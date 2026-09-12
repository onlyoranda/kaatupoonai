import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateVideo } from "@/lib/video.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/video")({
  head: () => ({
    meta: [
      { title: "Video generator | Cartoon Story Maker" },
      { name: "description", content: "Turn a text prompt into a short generated video." },
    ],
  }),
  component: VideoGeneratorPage,
});

function VideoGeneratorPage() {
  const generate = useServerFn(generateVideo);

  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const res = await generate({ data: { prompt } });
      setVideoUrl(res.videoUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="wavy text-3xl">Video generator</h1>
        <Link to="/">
          <Button variant="secondary" className="ink rounded-full">
            Back home
          </Button>
        </Link>
      </header>

      <div className="ink rounded-3xl bg-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            rows={3}
            placeholder="Describe the video you want, e.g. 'A young man walking on the street'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="ink w-full rounded-full py-6"
          >
            {loading ? "Generating…" : "Generate video"}
          </Button>
        </form>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        {videoUrl ? <video controls className="mt-6 w-full rounded-2xl" src={videoUrl} /> : null}

        <p className="mt-6 text-xs text-muted-foreground">
          Video generation can take a little while, especially the first time the model spins up.
        </p>
      </div>
    </main>
  );
}
