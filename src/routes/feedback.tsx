import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, Container, PageHeader, meta } from "@/components/site";
import { submitFeedback } from "@/lib/feedback.functions";

export const Route = createFileRoute("/feedback")({
  head: () => meta("Share Feedback", "Help improve PhysioSmart AI by reviewing its learning and clinical reasoning features."),
  component: FeedbackPage,
});
const roles = ["DPT student", "Physiotherapist", "Faculty", "Other"] as const;
const areas = ["Overall experience", "Study materials", "Special tests", "AI clinical reasoning", "BCQs", "Accessibility", "History taking forms", "Notes", "Curriculum", "Other"] as const;
function FeedbackPage() {
  const submit = useServerFn(submitFeedback);
  const [role, setRole] = useState<(typeof roles)[number]>("DPT student");
  const [area, setArea] = useState<(typeof areas)[number]>("Overall experience");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || rating < 1 || comment.trim().length < 10) return;
    setBusy(true); setError("");
    try {
      await submit({ data: { role, area, rating, comment: comment.trim(), contact: contact.trim(), website } });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit feedback.");
    } finally { setBusy(false); }
  }
  return <>
    <PageHeader eyebrow="Help us improve" title="Share Your Feedback" desc="Your experience helps us make PhysioSmart AI clearer, safer and more useful for physiotherapy education." />
    <Container>
      <div className="mx-auto max-w-2xl">
        <Card>
          {success ? <div role="status" className="space-y-3"><h2 className="text-xl font-bold text-primary">Thank you for your feedback!</h2><p>Your feedback was saved successfully. Thank you for helping improve PhysioSmart AI.</p><button className="rounded-lg border px-4 py-2" onClick={() => { setSuccess(false); setComment(""); setRating(0); setContact(""); }}>Submit another response</button></div> :
          <form onSubmit={send} className="space-y-5">
            <p className="text-sm text-muted-foreground">No account is required. Your responses are collected for project evaluation and improvements. Please do not include patient names, clinical records or other sensitive personal information. Your optional contact information will be stored with your feedback and used only if the team needs to follow up.</p>
            <label className="block text-sm font-semibold">Your role
              <select value={role} onChange={e => setRole(e.target.value as typeof role)} className="mt-2 w-full rounded-lg border bg-background p-3">{roles.map(v => <option key={v}>{v}</option>)}</select>
            </label>
            <fieldset><legend className="mb-2 text-sm font-semibold">Overall rating *</legend><div className="flex flex-wrap gap-2">{[1,2,3,4,5].map(n => <button type="button" key={n} aria-label={n + " out of 5"} aria-pressed={rating === n} onClick={() => setRating(n)} className={`rounded-lg border px-4 py-2 text-lg ${rating === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{n} ★</button>)}</div></fieldset>
            <label className="block text-sm font-semibold">Feature to review
              <select value={area} onChange={e => setArea(e.target.value as typeof area)} className="mt-2 w-full rounded-lg border bg-background p-3">{areas.map(v => <option key={v}>{v}</option>)}</select>
            </label>
            <label className="block text-sm font-semibold">Your suggestions * <span className="font-normal text-muted-foreground">(10–1500 characters)</span>
              <textarea required minLength={10} maxLength={1500} rows={5} value={comment} onChange={e => setComment(e.target.value)} placeholder="What worked well? What should we improve?" className="mt-2 w-full rounded-lg border bg-background p-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">Email for follow-up <span className="font-normal text-muted-foreground">(optional)</span>
              <input type="email" maxLength={160} value={contact} onChange={e => setContact(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-lg border bg-background p-3 font-normal" />
            </label>
            <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label></div>
            {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
            <button disabled={busy || rating === 0 || comment.trim().length < 10} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Submitting…" : "Submit feedback"}</button>
          </form>}
        </Card>
      </div>
    </Container>
  </>;
}
