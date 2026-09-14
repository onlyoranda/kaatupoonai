// Server-only AI helpers.
// Story text and illustrations run on Hugging Face Inference Providers
// (same account/token as the video generator). Narration stays on the
// Lovable AI Gateway, which has the Tamil/English voice characters we need.
import { InferenceClient } from "@huggingface/inference";
import type { LanguageId, VoiceTypeId } from "./story-config";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/** Instruction-following chat model used for outlines, scripts and idea polish. */
const HF_CHAT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
/** Text-to-image model used for the cartoon scene illustrations. */
const HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";

function hfClient(): InferenceClient {
  const key = process.env["HF_TOKEN"];
  if (!key) throw new Error("AI is not configured yet.");
  return new InferenceClient(key);
}

/** Turns a Hugging Face failure into a clear, user-facing message. */
function hfError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (
    lower.includes("402") ||
    lower.includes("quota") ||
    lower.includes("credits") ||
    lower.includes("payment required") ||
    lower.includes("exceeded your monthly")
  ) {
    return new Error(`Out of AI credits: ${raw.slice(0, 300)}`);
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many")) {
    return new Error("The story machine is busy right now. Please try again in a moment.");
  }
  if (lower.includes("503") || lower.includes("loading")) {
    return new Error("The story machine is warming up — please try again in a minute.");
  }
  return new Error(`AI request failed: ${raw.slice(0, 300)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a flaky async operation with a short linear backoff. Used to ride
 * out transient failures — the AI gateway timing out, an image/speech
 * request getting killed for running out of memory, a dropped connection —
 * without giving up on the very first hiccup.
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 700,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await sleep(baseDelayMs * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("The request failed repeatedly.");
}

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  return key;
}

function gatewayError(status: number, body: string): Error {
  let message = body;
  try {
    const parsed = JSON.parse(body);
    message = parsed?.message ?? parsed?.error?.message ?? body;
  } catch {
    /* keep raw body */
  }
  if (status === 429) {
    return new Error("The story machine is busy right now. Please try again in a moment.");
  }
  if (status === 402) {
    return new Error(`Out of AI credits: ${message}`);
  }
  return new Error(`AI request failed (${status}): ${message}`);
}

/** Chat completion that must return JSON. */
export async function chatJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string | undefined;
}): Promise<T> {
  let text: string;
  try {
    const out = await hfClient().chatCompletion({
      model: params.model ?? HF_CHAT_MODEL,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      response_format: { type: "json_object" },
      max_tokens: params.maxTokens ?? 16000,
    });
    text = out.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    throw hfError(err);
  }
  return parseJson<T>(text);
}

// The idea box is short and rough by design — parents type in a hurry.
// The chat model turns that rough line into a slightly richer prompt (more
// sensory detail, a clearer shape) for the story writer, without changing
// what the parent actually asked for.
export async function enhanceStoryIdea(idea: string): Promise<string> {
  let out: { enhanced: string };
  try {
    out = await chatJson<{ enhanced: string }>({
      system:
        "You help a parent turn one rough line into a slightly richer idea for a children's cartoon story generator. Keep their exact characters, setting and core idea. Add a touch of warmth or sensory detail, nothing violent or scary. Output 1-2 short sentences, plain language a young child's parent would use. Reply only with JSON.",
      user: `Parent's rough idea: "${idea}"\n\nReturn JSON { "enhanced": string }.`,
      maxTokens: 300,
    });
  } catch {
    // Polishing the idea is a nice-to-have — never block the story on it.
    return idea;
  }
  const enhanced = out?.enhanced?.trim();
  return enhanced && enhanced.length > 0 ? enhanced : idea;
}

function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* try repairs below */
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      /* try truncation repair below */
    }
  }

  const repaired = repairTruncatedJson(cleaned);
  if (repaired !== null) {
    try {
      return JSON.parse(repaired) as T;
    } catch {
      /* fall through */
    }
  }

  throw new Error("The story writer returned something unreadable. Please try again.");
}

/**
 * Salvages a reply that was cut off mid-way: keeps everything up to the last
 * complete array element / object property and closes the open brackets.
 */
export function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  const src = text.slice(start);

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastSafe = -1;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length > 0) lastSafe = i;
    } else if (ch === "," && stack.length > 0) {
      lastSafe = i - 1;
    }
  }

  if (lastSafe < 0) return null;

  // Rebuild the bracket stack for the truncated prefix.
  const prefix = src.slice(0, lastSafe + 1);
  const open: string[] = [];
  inString = false;
  escaped = false;
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") open.push(ch);
    else if (ch === "}" || ch === "]") open.pop();
  }

  const closing = open
    .reverse()
    .map((c) => (c === "{" ? "}" : "]"))
    .join("");
  return prefix + closing;
}

/** Generates one illustration and returns raw image bytes. */
export async function generateImage(prompt: string): Promise<Uint8Array> {
  let blob: Blob;
  try {
    blob = await hfClient().textToImage({
      model: HF_IMAGE_MODEL,
      inputs: prompt,
    });
  } catch (err) {
    throw hfError(err);
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.byteLength < 256) throw new Error("No picture came back. Please try again.");
  return bytes;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

type VoicePreset = {
  provider: "openai" | "google";
  voice: string;
  instructions: string;
  mime: string;
  extension: string;
};

const ENGLISH_STYLE =
  "Narrate as a warm Indian English storyteller for young children. Gentle, unhurried pace, clear diction, friendly Indian accent. Never sound scary.";
const TAMIL_STYLE =
  "Read this Tamil story aloud like a friendly Coimbatore storyteller talking to small children. Everyday spoken Kongu Tamil rhythm, warm, unhurried and never scary.";

export function voicePreset(language: LanguageId, voiceType: VoiceTypeId): VoicePreset {
  if (language === "ta_CBE") {
    const voice = voiceType === "male" ? "Charon" : voiceType === "kid" ? "Leda" : "Kore";
    const extra =
      voiceType === "kid"
        ? " Sound like a bright, playful young child telling the story."
        : voiceType === "male"
          ? " Sound like a kind uncle with a deeper voice."
          : " Sound like a kind aunty with a warm voice.";
    return {
      provider: "google",
      voice,
      instructions: TAMIL_STYLE + extra,
      mime: "audio/wav",
      extension: "wav",
    };
  }

  const voice = voiceType === "male" ? "ash" : voiceType === "kid" ? "nova" : "coral";
  const extra =
    voiceType === "kid"
      ? " Use a bright, light, young-sounding voice, as if a cheerful child is telling the story."
      : voiceType === "male"
        ? " Use a deeper, calm grown-up male voice."
        : " Use a warm, bright grown-up female voice.";
  return {
    provider: "openai",
    voice,
    instructions: ENGLISH_STYLE + extra,
    mime: "audio/mpeg",
    extension: "mp3",
  };
}

/** Generates narration audio and returns the raw audio bytes plus its mime type. */
export async function generateSpeech(
  text: string,
  language: LanguageId,
  voiceType: VoiceTypeId,
): Promise<{ bytes: Uint8Array; mime: string; extension: string }> {
  const preset = voicePreset(language, voiceType);

  const body =
    preset.provider === "google"
      ? {
          model: "google/gemini-2.5-pro-tts",
          contents: [
            {
              role: "user",
              parts: [{ text: `${preset.instructions}\n\n${text}` }],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: preset.voice } },
            },
          },
        }
      : {
          model: "openai/gpt-4o-mini-tts",
          input: text,
          voice: preset.voice,
          instructions: preset.instructions,
          response_format: "mp3",
        };

  const res = await fetch(`${GATEWAY}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw gatewayError(res.status, await res.text().catch(() => ""));

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 256) throw new Error("The narration came back empty. Please try again.");
  return { bytes, mime: preset.mime, extension: preset.extension };
}
