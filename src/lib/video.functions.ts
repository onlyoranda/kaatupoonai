import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateVideoFromPrompt } from "./video.server";

const BUCKET = "videos";

/** Generates a short video from a text prompt via Hugging Face, storing the
 * result in the user's own folder in the `videos` bucket (private, same
 * ownership pattern as `story-media`) and returning a signed URL to play it. */
export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string }) => {
    if (!input?.prompt || input.prompt.trim().length < 3) {
      throw new Error("Describe the video you want first.");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bytes = await generateVideoFromPrompt(data.prompt.trim());

    const path = `${userId}/${crypto.randomUUID()}.mp4`;
    const up = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "video/mp4", upsert: true });
    if (up.error) throw new Error(up.error.message);

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 6);
    if (signError || !signed) throw new Error(signError?.message ?? "Could not load the video.");

    return { videoUrl: signed.signedUrl };
  });
