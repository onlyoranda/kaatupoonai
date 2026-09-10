import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getStory,
  scriptBatch,
  renderScene,
  markFailed,
  resumeStory,
} from "@/lib/story.functions";
import { STATUS_LABELS } from "@/lib/story-config";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/story/$storyId")({
  head: () => ({
    meta: [
      { title: "Your cartoon story | Cartoon Story Maker" },
      { name: "description", content: "Watch and listen to your narrated cartoon story." },
      { property: "og:title", content: "Your cartoon story" },
      { property: "og:description", content: "Watch and listen to your narrated cartoon story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryPage,
});

type Scene = {
  id: string;
  idx: number;
  narration_text: string;
  status: string;
  imageUrl: string | null;
  audioUrl: string | null;
};

function StoryPage() {
  const { storyId } = Route.useParams();
  const load = useServerFn(getStory);
  const script = useServerFn(scriptBatch);
  const render = useServerFn(renderScene);
  const fail = useServerFn(markFailed);
  const resume = useServerFn(resumeStory);


  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("scripting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const running = useRef(false);

  const refresh = useCallback(async () => {
    const res = await load({ data: { storyId } });
    setTitle(res.story.title);
    setStatus(res.story.status);
    setErrorMessage(res.story.error_message);
    setScenes(res.scenes as Scene[]);
    return res;
  }, [load, storyId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (running.current) return;
      running.current = true;
      try {
        let res = await refresh();
        if (res.story.status === "ready" || res.story.status === "failed") return;

        // 1. Expand every beat into narration + picture prompts.
        let stalled = 0;
        while (!cancelled && res.scenes.some((s) => s.status === "beat")) {
          const before = res.scenes.filter((s) => s.status === "beat").length;
          const from = res.scenes.find((s) => s.status === "beat")!.idx;
          await script({ data: { storyId, from } });
          res = await refresh();
          const after = res.scenes.filter((s) => s.status === "beat").length;
          stalled = after < before ? 0 : stalled + 1;
          if (stalled >= 2) {
            throw new Error("The story writer got stuck on a scene. Please try again.");
          }
        }

        // 2. Draw and narrate each scene in order.
        while (!cancelled) {
          const next = res.scenes.find((s) => s.status !== "ready");
          if (!next) break;
          await render({ data: { storyId, idx: next.idx } });
          res = await refresh();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        if (!cancelled) {
          toast.error(message);
          await fail({ data: { storyId, message } }).catch(() => {});
          await refresh().catch(() => {});
        }
      } finally {
        running.current = false;
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [storyId, refresh, script, render, fail, attempt]);

  async function tryAgain() {
    setRetrying(true);
    try {
      await resume({ data: { storyId } });
      await refresh();
      setAttempt((n) => n + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not restart.");
    } finally {
      setRetrying(false);
    }
  }

  const ready = scenes.filter((s) => s.status === "ready").length;
  const total = scenes.length || 1;
  const isReady = status === "ready" && ready === scenes.length && scenes.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{title || "Making your story…"}</h1>
          <p className="text-sm text-muted-foreground">
            {STATUS_LABELS[status] ?? status}
          </p>
        </div>
        <Link to="/library">
          <Button variant="secondary" className="ink">
            My stories
          </Button>
        </Link>
      </header>

      {status === "failed" ? (
        <div className="ink rounded-2xl bg-card p-6">
          <p className="text-sm">{errorMessage ?? "Something went wrong."}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing is lost — the finished scenes are saved, so this carries on from where it
            stopped.
          </p>
          <Button className="ink mt-4" onClick={tryAgain} disabled={retrying}>
            {retrying ? "Picking up again…" : "Try again"}
          </Button>
        </div>
      ) : isReady ? (
        <Player scenes={scenes} />
      ) : (
        <div className="ink rounded-2xl bg-card p-6">
          <Progress value={(ready / total) * 100} className="h-3" />
          <p className="mt-3 text-sm text-muted-foreground">
            {ready} of {scenes.length || "…"} scenes drawn and narrated. Keep this page open.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {scenes.map((s) =>
              s.imageUrl ? (
                <img
                  key={s.id}
                  src={s.imageUrl}
                  alt={`Scene ${s.idx + 1}`}
                  className="ink aspect-square rounded-lg object-cover"
                />
              ) : (
                <div key={s.id} className="ink aspect-square rounded-lg bg-muted" />
              ),
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Player({ scenes }: { scenes: Scene[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scene = scenes[i]!;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, i]);

  return (
    <div className="ink overflow-hidden rounded-2xl bg-card">
      <div className="relative aspect-video overflow-hidden bg-black">
        {scene.imageUrl ? (
          <img
            key={scene.id}
            src={scene.imageUrl}
            alt={`Scene ${i + 1}`}
            className="h-full w-full animate-[kenburns_18s_ease-in-out_infinite_alternate] object-cover"
          />
        ) : null}
        <p className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-center text-sm text-white">
          {scene.narration_text}
        </p>
      </div>

      {scene.audioUrl ? (
        <audio
          ref={audioRef}
          src={scene.audioUrl}
          onEnded={() => {
            if (i + 1 < scenes.length) setI(i + 1);
            else setPlaying(false);
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2 p-4">
        <Button className="ink" onClick={() => setPlaying(!playing)}>
          {playing ? "Pause" : "Play"}
        </Button>
        <Button variant="secondary" className="ink" onClick={() => setI(Math.max(0, i - 1))}>
          Previous
        </Button>
        <Button
          variant="secondary"
          className="ink"
          onClick={() => setI(Math.min(scenes.length - 1, i + 1))}
        >
          Next
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          Scene {i + 1} of {scenes.length}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
        {scenes.map((s, idx) => (
          <button key={s.id} type="button" onClick={() => setI(idx)}>
            {s.imageUrl ? (
              <img
                src={s.imageUrl}
                alt={`Go to scene ${idx + 1}`}
                className={`ink h-14 w-14 shrink-0 rounded-md object-cover ${
                  idx === i ? "opacity-100" : "opacity-60"
                }`}
              />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
