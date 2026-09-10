import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatJson, generateImage, generateSpeech } from "./ai.server";
import {
  ART_STYLES,
  AGE_BANDS,
  LENGTHS,
  type AgeBandId,
  type ArtStyleId,
  type LanguageId,
  type LengthId,
  type VoiceTypeId,
} from "./story-config";

const BUCKET = "story-media";
const BATCH = 3;

type StartInput = {
  idea: string;
  artStyle: ArtStyleId;
  language: LanguageId;
  voiceType: VoiceTypeId;
  length: LengthId;
  ageBand: AgeBandId;
};

function styleOf(id: string) {
  return ART_STYLES.find((s) => s.id === id) ?? ART_STYLES[0]!;
}
function lengthOf(id: string) {
  return LENGTHS.find((l) => l.id === id) ?? LENGTHS[0]!;
}
function ageOf(id: string) {
  return AGE_BANDS.find((a) => a.id === id) ?? AGE_BANDS[1]!;
}

const SAFETY =
  "You write gentle stories for small children. Absolutely no violence, weapons, death, horror, cruelty, injury, romance, or unsafe behaviour. No scary imagery. Always a warm, reassuring ending.";

/** Step 1: safety check, title, character bible and scene beats. */
export const startStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StartInput) => {
    if (!input?.idea || input.idea.trim().length < 3) {
      throw new Error("Please write a slightly longer idea.");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const style = styleOf(data.artStyle);
    const len = lengthOf(data.length);
    const age = ageOf(data.ageBand);
    const tamil = data.language === "ta_CBE";

    const plan = await chatJson<{
      safe: boolean;
      reason?: string;
      title: string;
      character_bible: string;
      beats: string[];
    }>({
      system: `${SAFETY} You reply only with JSON.`,
      user: `Idea from a parent: "${data.idea}"
Audience age: ${age.label}.
Return JSON:
{
 "safe": boolean (false only if the idea cannot be made child-safe),
 "reason": short kind explanation if unsafe,
 "title": a short warm story title ${tamil ? "written in Tamil script" : "in English"},
 "character_bible": one English paragraph describing every recurring character and place with fixed visual details (colours, shapes, clothes) so illustrations stay consistent,
 "beats": array of exactly ${len.scenes} very short English one-line beats telling the story from start to a warm ending
}`,
      maxTokens: 4000,
    });

    if (!plan.safe) {
      throw new Error(
        plan.reason || "That idea isn't a good fit for a little kids' story. Try another one.",
      );
    }

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: userId,
        idea: data.idea.trim(),
        title: plan.title,
        art_style: data.artStyle,
        narration_language: data.language,
        voice_type: data.voiceType,
        length_pref: data.length,
        age_band: data.ageBand,
        scene_count: plan.beats.length,
        status: "scripting",
        character_bible: `${plan.character_bible}\n\nArt style: ${style.prompt}`,
      })
      .select("id, scene_count")
      .single();

    if (error || !story) throw new Error(error?.message ?? "Could not start the story.");

    await supabase.from("scenes").insert(
      plan.beats.map((beat, idx) => ({
        story_id: story.id,
        user_id: userId,
        idx,
        narration_text: beat,
        image_prompt: beat,
        status: "beat",
      })),
    );

    return { storyId: story.id as string, sceneCount: plan.beats.length };
  });

/** Step 2: expand a batch of beats into narration + image prompts. */
export const scriptBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storyId: string; from: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: story } = await supabase
      .from("stories")
      .select("*")
      .eq("id", data.storyId)
      .single();
    if (!story) throw new Error("Story not found.");

    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, idx, narration_text")
      .eq("story_id", data.storyId)
      .gte("idx", data.from)
      .lt("idx", data.from + BATCH)
      .order("idx");

    if (!scenes || scenes.length === 0) return { done: true, next: null };

    const len = lengthOf(story.length_pref);
    const age = ageOf(story.age_band);
    const tamil = story.narration_language === "ta_CBE";

    type ScriptOut = {
      scenes: { idx: number; narration: string; image: string; sound: string }[];
    };
    const ask = () =>
      chatJson<ScriptOut>({
        system: `${SAFETY} You reply only with JSON.`,
        user: `Story title: ${story.title}
Cast and world (keep every detail identical): ${story.character_bible}
Audience: ${age.label} — ${age.blurb}.
Expand these beats into scenes:
${scenes.map((s) => `${s.idx}: ${s.narration_text}`).join("\n")}

Return JSON { "scenes": [ { "idx": number, "narration": string, "image": string, "sound": string } ] } where:
- narration = about ${len.wordsPerScene} words of read-aloud narration ${
        tamil
          ? "written in Tamil script using everyday spoken Coimbatore/Kongu Tamil, not formal literary Tamil"
          : "in simple warm Indian English"
      }.
- image = an English illustration description of this exact moment, repeating the characters' fixed visual details.
- sound = a few words naming gentle ambience for the scene.`,
      maxTokens: 6000,
    });

    for (const s of out.scenes ?? []) {
      const row = scenes.find((x) => x.idx === s.idx);
      if (!row) continue;
      await supabase
        .from("scenes")
        .update({
          narration_text: s.narration,
          image_prompt: s.image,
          sound_cue: s.sound,
          status: "scripted",
          duration_seconds: Math.max(4, Math.round((s.narration?.split(/\s+/).length ?? 20) / 2.4)),
        })
        .eq("id", row.id);
    }

    const next = data.from + BATCH;
    const finished = next >= story.scene_count;
    if (finished) {
      await supabase.from("stories").update({ status: "illustrating" }).eq("id", story.id);
    }
    return { done: finished, next: finished ? null : next };
  });

/** Step 3: draw + narrate a single scene. */
export const renderScene = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storyId: string; idx: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: story } = await supabase
      .from("stories")
      .select("*")
      .eq("id", data.storyId)
      .single();
    if (!story) throw new Error("Story not found.");

    const { data: scene } = await supabase
      .from("scenes")
      .select("*")
      .eq("story_id", data.storyId)
      .eq("idx", data.idx)
      .single();
    if (!scene) throw new Error("Scene not found.");

    const style = styleOf(story.art_style);
    let imagePath = scene.image_path;
    let audioPath = scene.audio_path;

    if (!imagePath) {
      const bytes = await generateImage(
        `${style.prompt}. Wholesome children's cartoon, no text, no words, no letters. Consistent cast: ${story.character_bible}. Scene: ${scene.image_prompt}`,
      );
      const path = `${userId}/${story.id}/scene-${String(data.idx).padStart(3, "0")}.png`;
      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: "image/png", upsert: true });
      if (up.error) throw new Error(up.error.message);
      imagePath = path;
    }

    if (!audioPath) {
      const speech = await generateSpeech(
        scene.narration_text,
        story.narration_language as LanguageId,
        story.voice_type as VoiceTypeId,
      );
      const path = `${userId}/${story.id}/scene-${String(data.idx).padStart(3, "0")}.${speech.extension}`;
      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, speech.bytes, { contentType: speech.mime, upsert: true });
      if (up.error) throw new Error(up.error.message);
      audioPath = path;
    }

    await supabase
      .from("scenes")
      .update({ image_path: imagePath, audio_path: audioPath, status: "ready" })
      .eq("id", scene.id);

    const last = data.idx + 1 >= story.scene_count;
    if (last) await supabase.from("stories").update({ status: "ready" }).eq("id", story.id);

    return { done: last };
  });

export const markFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storyId: string; message: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("stories")
      .update({ status: "failed", error_message: data.message.slice(0, 500) })
      .eq("id", data.storyId);
    return { ok: true };
  });

export const getStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storyId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: story } = await supabase
      .from("stories")
      .select("*")
      .eq("id", data.storyId)
      .single();
    if (!story) throw new Error("Story not found.");

    const { data: scenes } = await supabase
      .from("scenes")
      .select("*")
      .eq("story_id", data.storyId)
      .order("idx");

    const paths = (scenes ?? []).flatMap((s) =>
      [s.image_path, s.audio_path].filter((p): p is string => !!p),
    );
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, 60 * 60 * 6);
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
      }
    }

    return {
      story,
      scenes: (scenes ?? []).map((s) => ({
        ...s,
        imageUrl: s.image_path ? (urls.get(s.image_path) ?? null) : null,
        audioUrl: s.audio_path ? (urls.get(s.audio_path) ?? null) : null,
      })),
    };
  });

export const listStories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("stories")
      .select("id, title, status, art_style, narration_language, created_at, scene_count")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const deleteStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storyId: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase.from("stories").delete().eq("id", data.storyId);
    return { ok: true };
  });

export const previewVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { language: LanguageId; voiceType: VoiceTypeId }) => input)
  .handler(async ({ data }) => {
    const text =
      data.language === "ta_CBE"
        ? "வணக்கம் குட்டீஸ்! இன்னிக்கு ஒரு அழகான கதை சொல்லப் போறேன், கேட்கறீங்களா?"
        : "Hello little one! Today I have a lovely story for you. Shall we begin?";
    const speech = await generateSpeech(text, data.language, data.voiceType);
    let binary = "";
    speech.bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return { dataUrl: `data:${speech.mime};base64,${btoa(binary)}` };
  });
