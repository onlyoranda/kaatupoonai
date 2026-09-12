import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listStories, deleteStory } from "@/lib/story.functions";
import { STATUS_LABELS, LANGUAGES, labelOf } from "@/lib/story-config";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "My stories | Cartoon Story Maker" },
      { name: "description", content: "Your private library of narrated cartoon stories." },
      { property: "og:title", content: "My stories | Cartoon Story Maker" },
      {
        property: "og:description",
        content: "Your private library of narrated cartoon stories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Library,
});

function Library() {
  const list = useServerFn(listStories);
  const remove = useServerFn(deleteStory);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => list({}),
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="wavy text-3xl">My stories</h1>
        <div className="flex shrink-0 gap-2">
          <Link to="/video">
            <Button variant="secondary" className="ink rounded-full">
              Video generator
            </Button>
          </Link>
          <Link to="/">
            <Button className="ink rounded-full">New story</Button>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="ink rounded-3xl bg-card p-8 text-center">
          <p className="text-muted-foreground">You haven't made a story yet.</p>
          <Link to="/">
            <Button className="ink mt-4 rounded-full">Make your first one</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((s) => (
            <li key={s.id} className="ink tilt flex items-center gap-4 rounded-2xl bg-card p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to="/story/$storyId"
                  params={{ storyId: s.id }}
                  className="font-display truncate hover:underline"
                >
                  {s.title}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {STATUS_LABELS[s.status] ?? s.status} · {labelOf(LANGUAGES, s.narration_language)}{" "}
                  · {s.scene_count} scenes
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await remove({ data: { storyId: s.id } });
                  toast.success("Story deleted.");
                  qc.invalidateQueries({ queryKey: ["stories"] });
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
