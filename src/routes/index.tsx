import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { startStory, previewVoice } from "@/lib/story.functions";
import {
  ART_STYLES,
  LANGUAGES,
  VOICE_TYPES,
  LENGTHS,
  AGE_BANDS,
  type AgeBandId,
  type ArtStyleId,
  type LanguageId,
  type LengthId,
  type VoiceTypeId,
} from "@/lib/story-config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cartoon Story Maker — ideas into narrated cartoons" },
      {
        name: "description",
        content:
          "Type an idea and get a narrated 90s-style cartoon story for children, in Indian English or Coimbatore Tamil.",
      },
      { property: "og:title", content: "Cartoon Story Maker" },
      {
        property: "og:description",
        content: "Type an idea and get a narrated 90s-style cartoon story for children.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Choice({
  active,
  onClick,
  label,
  blurb,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  blurb?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ink tilt rounded-2xl px-4 py-3 text-left",
        active ? "-translate-y-0.5 rotate-[-1deg] bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      <div className="font-display text-sm">{label}</div>
      {blurb ? <div className="text-xs opacity-80">{blurb}</div> : null}

    </button>
  );
}

function Home() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const start = useServerFn(startStory);
  const preview = useServerFn(previewVoice);

  const [idea, setIdea] = useState("");
  const [artStyle, setArtStyle] = useState<ArtStyleId>("saturday_2d");
  const [language, setLanguage] = useState<LanguageId>("en_IN");
  const [voiceType, setVoiceType] = useState<VoiceTypeId>("female");
  const [length, setLength] = useState<LengthId>("short");
  const [ageBand, setAgeBand] = useState<AgeBandId>("4_7");
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  async function hearVoice() {
    if (!user) return navigate({ to: "/auth" });
    setPreviewing(true);
    try {
      const res = await preview({ data: { language, voiceType } });
      await new Audio(res.dataUrl).play();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not play the sample.");
    } finally {
      setPreviewing(false);
    }
  }

  async function create() {
    if (!user) return navigate({ to: "/auth" });
    if (idea.trim().length < 3) return toast.error("Tell me a little more about the idea.");
    setBusy(true);
    try {
      const res = await start({
        data: { idea, artStyle, language, voiceType, length, ageBand },
      });
      navigate({ to: "/story/$storyId", params: { storyId: res.storyId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the story.");
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto max-w-4xl px-5 py-10">
      <span className="confetti right-[6%] top-[6%] hidden h-10 w-10 bg-secondary sm:block" />
      <span
        className="confetti left-[3%] top-[38%] hidden h-6 w-6 bg-accent sm:block"
        style={{ animationDelay: "1.5s" }}
      />
      <span
        className="confetti bottom-[8%] right-[8%] hidden h-8 w-8 bg-primary/40 sm:block"
        style={{ animationDelay: "2.4s" }}
      />

      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="wavy text-3xl leading-tight sm:text-4xl">Cartoon Story Maker</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Type an idea. Get a hand-drawn 90s cartoon story, read aloud for your little one.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!loading && user ? (
            <>
              <Link to="/library">
                <Button variant="secondary" className="ink rounded-full">
                  My stories
                </Button>
              </Link>
              <Button variant="ghost" className="rounded-full" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="secondary" className="ink rounded-full">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="ink relative rounded-3xl bg-card p-6 sm:p-8">

        <label htmlFor="idea" className="font-display text-sm">
          What should the story be about?
        </label>
        <Textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="A shy dragon who is afraid of fireworks…"
          className="ink mt-2 min-h-28 bg-background text-base"
        />

        <div className="mt-8 space-y-7">
          <div>
            <h2 className="mb-3 text-base">Cartoon look</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ART_STYLES.map((s) => (
                <Choice
                  key={s.id}
                  active={artStyle === s.id}
                  onClick={() => setArtStyle(s.id)}
                  label={s.label}
                  blurb={s.blurb}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base">Narrator language</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {LANGUAGES.map((l) => (
                <Choice
                  key={l.id}
                  active={language === l.id}
                  onClick={() => setLanguage(l.id)}
                  label={l.label}
                  blurb={l.blurb}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base">Narrator voice</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {VOICE_TYPES.map((v) => (
                <Choice
                  key={v.id}
                  active={voiceType === v.id}
                  onClick={() => setVoiceType(v.id)}
                  label={v.label}
                  blurb={v.blurb}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-2 px-0"
              onClick={hearVoice}
              disabled={previewing}
            >
              {previewing ? "Loading sample…" : "▶ Hear this voice"}
            </Button>
          </div>

          <div>
            <h2 className="mb-3 text-base">How long?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {LENGTHS.map((l) => (
                <Choice
                  key={l.id}
                  active={length === l.id}
                  onClick={() => setLength(l.id)}
                  label={l.label}
                  blurb={l.blurb}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base">Who's listening?</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {AGE_BANDS.map((a) => (
                <Choice
                  key={a.id}
                  active={ageBand === a.id}
                  onClick={() => setAgeBand(a.id)}
                  label={a.label}
                  blurb={a.blurb}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          A short story takes a few minutes to make; a full story takes longer. Keep this page open
          while it's being made.
        </p>
        <Button
          className="ink mt-3 w-full rounded-full py-7 text-lg"
          onClick={create}
          disabled={busy}
        >
          {busy ? "Writing the story…" : "Create my cartoon story ✨"}
        </Button>

      </section>
    </main>
  );
}
