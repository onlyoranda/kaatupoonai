// Shared background story processor used by the cron routes. This is what
// lets story generation keep going even if the person closes the tab:
// whichever of the open-tab loop (see story.$storyId.tsx) or the scheduled
// sweep gets to a story first does the next step, and retries/failure
// bookkeeping (see recordAttemptFailure in story.functions.ts) is shared
// between both paths.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { runRenderScene, runScriptBatch } from "@/lib/story.functions";

// Stories touched more recently than this are probably already being
// worked on by an open tab — skip them this pass rather than racing it.
const RECENTLY_TOUCHED_MS = 30_000;
const MAX_STORIES_PER_SWEEP = 5;

export async function processStoriesSweep(): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cutoff = new Date(Date.now() - RECENTLY_TOUCHED_MS).toISOString();

  const { data: stories, error } = await supabaseAdmin
    .from("stories")
    .select("id, status")
    .in("status", ["scripting", "illustrating", "narrating"])
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(MAX_STORIES_PER_SWEEP);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results = [];
  for (const story of stories ?? []) {
    results.push(await processOne(supabaseAdmin, story.id));
  }

  return Response.json({ ok: true, processed: results.length, results });
}

async function processOne(supabaseAdmin: SupabaseClient<Database>, storyId: string) {
  try {
    const { data: pending } = await supabaseAdmin
      .from("scenes")
      .select("idx")
      .eq("story_id", storyId)
      .eq("status", "beat")
      .order("idx")
      .limit(1)
      .maybeSingle();

    if (pending) {
      const step = await runScriptBatch(supabaseAdmin, storyId, pending.idx);
      return { storyId, step: "scripting", ...step };
    }

    const { data: next } = await supabaseAdmin
      .from("scenes")
      .select("idx")
      .eq("story_id", storyId)
      .neq("status", "ready")
      .order("idx")
      .limit(1)
      .maybeSingle();

    if (next) {
      const step = await runRenderScene(supabaseAdmin, storyId, next.idx);
      return { storyId, step: "rendering", ...step };
    }

    return { storyId, step: "nothing-pending" };
  } catch (err) {
    // The shared step functions already mark the story "failed" once its
    // retry budget is exhausted before throwing — just log and move on so
    // one bad story doesn't stop the rest of the sweep.
    console.error(`[cron] story ${storyId} failed permanently:`, err);
    return { storyId, step: "failed", message: err instanceof Error ? err.message : String(err) };
  }
}
