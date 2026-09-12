// Shared, client-safe configuration for the cartoon story maker.

export type ArtStyleId = "saturday_2d" | "anime_90s" | "clay_90s" | "comic_90s";
export type LanguageId = "en_IN" | "ta_CBE";
export type VoiceTypeId = "male" | "female" | "kid";
export type LengthId = "short";
export type AgeBandId = "3_5" | "4_7" | "8_11";

export const ART_STYLES: {
  id: ArtStyleId;
  label: string;
  blurb: string;
  prompt: string;
}[] = [
  {
    id: "saturday_2d",
    label: "Saturday Morning 2D",
    blurb: "Bright flat colours, thick outlines, classic TV cartoon",
    prompt:
      "1990s Saturday-morning television cartoon cel animation still, hand-inked thick black outlines, flat bold gouache colour fills, simple painted background, slight film grain, 4:3-era broadcast look",
  },
  {
    id: "anime_90s",
    label: "90s Anime",
    blurb: "Soft cel-shaded anime, warm hand-painted skies",
    prompt:
      "1990s hand-drawn anime cel still, soft cel shading, hand-painted watercolour background, warm nostalgic palette, gentle film grain, retro anime character design",
  },
  {
    id: "clay_90s",
    label: "Claymation",
    blurb: "Chunky stop-motion plasticine world",
    prompt:
      "1990s stop-motion claymation still, plasticine characters with visible thumbprints, handmade miniature set, soft studio lighting, shallow depth of field",
  },
  {
    id: "comic_90s",
    label: "Comic Book",
    blurb: "Halftone dots, inky panels, retro print",
    prompt:
      "1990s printed comic book panel art, bold ink linework, halftone dot shading, slightly off-register retro print colours, dynamic composition",
  },
];

export const LANGUAGES: {
  id: LanguageId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "en_IN",
    label: "Indian English",
    blurb: "Warm Indian English storyteller",
  },
  {
    id: "ta_CBE",
    label: "Tamil",
    blurb: "Everyday Kongu Tamil, not textbook Tamil",
  },
];

export const VOICE_TYPES: { id: VoiceTypeId; label: string; blurb: string }[] = [
  { id: "male", label: "Uncle voice", blurb: "Deeper, calm grown-up" },
  { id: "female", label: "Aunty voice", blurb: "Warm, bright grown-up" },
  { id: "kid", label: "Kid voice", blurb: "Young and playful" },
];

export const LENGTHS: {
  id: LengthId;
  label: string;
  blurb: string;
  scenes: number;
  wordsPerScene: number;
}[] = [
  {
    id: "short",
    label: "Short story",
    blurb: "About 5 minutes",
    scenes: 20,
    wordsPerScene: 38,
  },
];

export const AGE_BANDS: { id: AgeBandId; label: string; blurb: string }[] = [
  { id: "3_5", label: "3-5 years", blurb: "Very simple, lots of repetition" },
  { id: "4_7", label: "4-7 years", blurb: "Simple words, clear little lessons" },
  { id: "8_11", label: "8-11 years", blurb: "Richer plot and vocabulary" },
];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Getting ready",
  scripting: "Writing the story",
  illustrating: "Drawing the scenes",
  narrating: "Recording the narration",
  ready: "Ready to watch",
  failed: "Something went wrong",
};

export function labelOf<T extends { id: string; label: string }>(list: T[], id: string): string {
  return list.find((item) => item.id === id)?.label ?? id;
}
