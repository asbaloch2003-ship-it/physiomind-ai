import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { useStudentSession } from "@/components/student-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { meta } from "@/components/site";

export const Route = createFileRoute("/auth")({
  head: () => meta("Student Sign In", "Create your PhysioSmart AI student profile and save your BCQ learning activity."),
  validateSearch: (search: Record<string, unknown>): { next?: "/quizzes" | "/dashboard" } => ({ next: search["next"] === "/quizzes" ? "/quizzes" : "/dashboard" }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const { user } = useStudentSession();
  const next = Route.useSearch().next ?? "/dashboard";
  const navigate = useNavigate();
  useEffect(() => { if (user) void navigate({ to: next, replace: true }); }, [user, next, navigate]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setNotice("If this email has an account, a password reset link has been sent.");
      } else if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth?next=${next}`, data: { display_name: name.trim() } } });
        if (signupError) throw signupError;
        if (!data.session) setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        await navigate({ to: next, replace: true });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not complete this request. Please try again."); }
    finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth?next=${next}` });
      if (result.error) throw result.error;
      if (!result.redirected) await navigate({ to: next, replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed. Please try again."); }
  }
  return <section className="mx-auto max-w-md px-4 py-14">
    <p className="text-sm font-semibold text-accent">PhysioSmart AI · Student account</p>
    <h1 className="mt-3 text-3xl font-bold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
    <form onSubmit={submit} className="mt-8 space-y-5">
      {mode === "signup" && <label className="block text-sm font-medium">Display name<Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" /></label>}
      <label className="block text-sm font-medium">Email<Input className="mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
      {mode !== "forgot" && <label className="block text-sm font-medium">Password<Input className="mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>}
      <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="mt-4 text-sm text-success">{notice}</p>}
    {mode !== "forgot" && <div className="mt-6 space-y-3 border-t pt-6"><Button variant="outline" className="w-full" onClick={() => social("google")}>Continue with Google</Button><Button className="lovable-auth-button w-full" onClick={() => social("lovable")}>Continue with Lovable</Button></div>}
    <div className="mt-4 flex flex-wrap justify-center gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setNotice(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "Create a student account"}</Button><Button variant="link" onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setError(""); setNotice(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div>
    <Link to="/quizzes" className="mt-4 block text-center text-sm text-muted-foreground">Continue BCQs without saving</Link>
  </section>;
}