import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { meta } from "@/components/site";
import { useStudentSession } from "@/components/student-session";

export const Route = createFileRoute("/reset-password")({ head: () => meta("Reset Student Password", "Set a new password for your PhysioSmart AI student account."), component: Page });
function Page() {
  const { recovery: sessionRecovery } = useStudentSession();
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (hash.get("type") === "recovery" && accessToken && refreshToken) {
      setBusy(true);
      void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) setMessage("This reset link is invalid or expired. Request a new link.");
        else setRecovery(true);
        setBusy(false);
        window.history.replaceState(null, "", window.location.pathname);
      });
    } else if (sessionRecovery) {
      void supabase.auth.getUser().then(({ data }) => setRecovery(Boolean(data.user)));
    }
  }, [sessionRecovery]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!recovery) return;
    if (password !== confirmation) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setDone(true); setMessage("Your password has been updated."); }
  }
  return <section className="mx-auto max-w-md px-4 py-14"><h1 className="text-3xl font-bold">Set a new password</h1>{recovery && !done ? <form onSubmit={submit} className="mt-8 space-y-5"><label className="block">New password<Input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><label className="block">Confirm password<Input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label><Button disabled={busy}>{busy ? "Saving…" : "Update password"}</Button></form> : !done && <p className="mt-5 text-muted-foreground">Open the password reset link from your email to continue.</p>}{message && <p role="status" className="mt-4">{message}</p>}<Button asChild variant="link" className="mt-4"><Link to="/auth">Back to sign in</Link></Button></section>;
}