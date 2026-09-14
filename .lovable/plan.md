# Move story text and pictures to Hugging Face

Story writing and illustrations switch from the current AI provider to your Hugging Face account (the same account and key the Video Generator already uses). Narration stays exactly as it is today.

## What changes for you

- **Story text** (outline, scene-by-scene narration, picture prompts, and the "make my idea richer" step) is written by a Hugging Face chat model.
- **Pictures** are drawn by a Hugging Face image model, using the same 90s cartoon style descriptions you already pick from.
- **Narration** — English and Tamil, uncle/aunty/kid — is untouched. Hugging Face has no Tamil voice with separate character options, so moving it would have made all three sound the same.
- **No automatic fallback.** If Hugging Face fails or the account quota runs out, the story pauses with a clear message instead of quietly switching providers and spending elsewhere.
- Everything else stays the same: the create screen, retries on a temporary hiccup, resuming a stopped story, and the saved scenes.

## What to expect

- Picture style will shift somewhat — a different model draws differently even with the same style description. Worth generating one short story after the change and adjusting the style wording if the look drifts.
- Story text and pictures now draw down your Hugging Face quota together with the Video Generator, so the two features share one limit. Once this is in, we can look at usage and cost monitoring for that shared account.

## Technical notes

All work is inside `src/lib/ai.server.ts`. Exported signatures stay identical, so `story.functions.ts` and everything else is unchanged. `video.server.ts` is not touched.

- Add an `InferenceClient` created from `process.env.HF_TOKEN`, same pattern as `video.server.ts`; keep a single shared helper for missing-token errors.
- `chatJson<T>` → `client.chatCompletion` against an instruction-following model on HF Inference Providers (`meta-llama/Llama-3.3-70B-Instruct`), with `response_format: { type: "json_object" }` where the provider supports it, `max_tokens` kept at 16000, and the reply run through the existing `parseJson` / `repairTruncatedJson` path unchanged.
- `enhanceStoryIdea` keeps its prompt and fallback-to-original behaviour, but drops the Claude-specific model override and uses the same HF chat model; the optional `model` parameter on `chatJson` remains for future overrides.
- `generateImage` → `client.textToImage` with `black-forest-labs/FLUX.1-schnell`, returning the blob's bytes as `Uint8Array` so the existing upload path is unchanged.
- `generateSpeech` and `voicePreset` stay on the current provider, unchanged.
- `gatewayError` is adapted to HF error shapes: parse the thrown error's message/status, map 402/429 quota or rate-limit text to the existing "out of credits / busy right now" wording, and keep everything else as a clear failure message. `withRetries` is unchanged, and a quota error is not retried.
- No new packages, no schema or database changes, no UI changes.
