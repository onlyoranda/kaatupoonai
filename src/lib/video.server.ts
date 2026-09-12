// Server-only helper for the Hugging Face Inference API (text-to-video).
// Requires the HF_TOKEN secret. The model can be swapped later by changing
// MODEL below — nothing else needs to change.
const HF_ENDPOINT = "https://api-inference.huggingface.co/models";
const MODEL = "Wan-AI/Wan2.2-TI2V-5B";

function apiKey(): string {
  const key = process.env["HF_TOKEN"];
  if (!key) throw new Error("Video generation isn't configured yet.");
  return key;
}

export type VideoResult = { kind: "url"; url: string } | { kind: "bytes"; bytes: Uint8Array };

/**
 * Calls the Hugging Face text-to-video model. Some models reply with JSON
 * containing a hosted video URL; others stream the raw MP4 bytes back
 * directly — both are handled here so callers don't need to care which.
 */
export async function generateVideoFromPrompt(prompt: string): Promise<VideoResult> {
  const res = await fetch(`${HF_ENDPOINT}/${MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // HF workers can take a while to spin up a model on first use.
    if (res.status === 503) {
      throw new Error("The video model is warming up — please try again in a minute.");
    }
    throw new Error(`Video generation failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as {
      video?: { url?: string };
      output?: { video?: { url?: string } };
      url?: string;
    };
    const url = data.video?.url ?? data.output?.video?.url ?? data.url;
    if (!url) throw new Error("The video model didn't return a video.");
    return { kind: "url", url };
  }

  const buffer = await res.arrayBuffer();
  return { kind: "bytes", bytes: new Uint8Array(buffer) };
}
