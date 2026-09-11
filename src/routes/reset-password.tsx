import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | Cartoon Story Maker" },
      {
        name: "description",
        content: "Set a new password for your Cartoon Story Maker account.",
      },
      { property: "og:title", content: "Choose a new password | Cartoon Story Maker" },
      {
        property: "og:description",
        content: "Set a new password for your Cartoon Story Maker account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password changed. You're signed in!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not change the password. Try the email link again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="ink w-full max-w-md rounded-3xl bg-card p-8">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          &larr; Back
        </Link>
        <h1 className="wavy mt-3 text-2xl">New password</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick something you'll remember. You'll go straight in afterwards.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Repeat it</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="ink w-full rounded-full py-6" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
