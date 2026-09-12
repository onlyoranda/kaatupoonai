import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_story",
  title: "Get story",
  description: "Read one of the signed-in user's stories with its scene narration text.",
  inputSchema: { story_id: z.string().uuid().describe("The story id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ story_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: story, error } = await supabase
      .from("stories")
      .select("id, title, idea, status, art_style, narration_language, voice_type, age_band, scene_count, created_at")
      .eq("id", story_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!story) return { content: [{ type: "text", text: "Story not found." }], isError: true };

    const { data: scenes } = await supabase
      .from("scenes")
      .select("idx, narration_text, sound_cue, status")
      .eq("story_id", story_id)
      .order("idx");

    const payload = { story, scenes: scenes ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
