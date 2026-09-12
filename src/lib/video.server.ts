// Server-only helper for text-to-video generation via Hugging Face's
// Inference Providers. This specific model (Wan-AI/Wan2.2-TI2V-5B) is not
// served on Hugging Face's own classic serverless "hf-inference" backend —
// it's only available through the third-party "fal-ai" provider, routed via
// Hugging Face's unified Inference Providers system. The official
// @huggingface/inference client handles that routing (and the underlying
// provider's own request/response shape) correctly, so we use it here
// rather than hand-rolling a fetch to a guessed endpoint.
import { InferenceClient } from "@huggingface/inference";

const MODEL = "Wan-AI/Wan2.2-TI2V-5B";
const PROVIDER = "fal-ai";

function apiKey(): string {
  const key = process.env["HF_TOKEN"];
  if (!key) throw new Error("Video generation isn't configured yet.");
  return key;
}

/**
 * Calls the Wan2.2 text-to-video model via Hugging Face's Inference
 * Providers (fal-ai backend) and returns the generated video as raw bytes.
 */
export async function generateVideoFromPrompt(prompt: string): Promise<Uint8Array> {
  const client = new InferenceClient(apiKey());

  let blob: Blob;
  try {
    blob = await client.textToVideo({
      provider: PROVIDER,
      model: MODEL,
      inputs: prompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // The underlying model can take a while to spin up on first use.
    if (message.includes("503") || message.toLowerCase().includes("loading")) {
      throw new Error("The video model is warming up — please try again in a minute.");
    }
    throw new Error(`Video generation failed: ${message.slice(0, 300)}`);
  }

  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
