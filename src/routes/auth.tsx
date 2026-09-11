import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Cartoon Story Maker" },
      {
        name: "description",
        content: "Sign in to save your cartoon stories to your own private library.",
      },
      { property: "og:title", content: "Sign in | Cartoon Story Maker" },
      {
        property: "og:description",
        content: "Sign in to save your cartoon stories to your own private library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && session && mode !== "forgot") navigate({ to: "/" });
  }, [loading, session, mode, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're all set!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  }

  const heading =
    mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password";

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <span className="confetti left-[12%] top-[18%] h-8 w-8 bg-secondary" />
      <span
        className="confetti right-[14%] top-[24%] h-6 w-6 bg-accent"
        style={{ animationDelay: "1.2s" }}
      />
      <span
        className="confetti bottom-[16%] left-[22%] h-5 w-5 bg-primary/50"
        style={{ animationDelay: "2.1s" }}
      />

      <div className="ink relative w-full max-w-md rounded-3xl bg-card p-8">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          &larr; Back
        </Link>
        <h1 className="wavy mt-3 text-2xl">{heading}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Type your email and we'll send you a link to set a new password."
            : "Your stories stay private to you."}
        </p>

        {mode === "forgot" && sent ? (
          <div className="mt-6 rounded-2xl bg-muted p-4 text-sm">
            Check your email for the reset link. It opens a page where you can pick a new password.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="ink w-full rounded-full py-6" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="mt-5 space-y-2 text-center">
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:underline"
            onClick={() => {
              setSent(false);
              setMode(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : mode === "signup"
                ? "Already have an account? Sign in"
                : "Back to sign in"}
          </button>
          {mode !== "forgot" && (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:underline"
              onClick={() => {
                setSent(false);
                setMode("forgot");
              }}
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

