import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, MessageSquareHeart, ShieldCheck } from "lucide-react";
import { Card, Container, PageHeader, meta } from "@/components/site";

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfxVckZh_AWAkKMCNmOS1yo5XHC3w1v8zxw5g-EtGnsgvJU2Q/viewform";

export const Route = createFileRoute("/feedback")({
  head: () => meta("Share Feedback", "Rate PhysioSmart AI and help improve DPT education."),
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <>
      <PageHeader eyebrow="Help us improve" title="Share Your Feedback" desc="Your ratings and suggestions help make PhysioSmart AI better for DPT students." />
      <Container>
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary"><MessageSquareHeart className="h-8 w-8" aria-hidden="true" /></div>
              <h2 className="text-2xl font-bold">Rate your experience</h2>
              <p className="text-muted-foreground">Share your star rating, the features you explored, and suggestions for improvement through our short Google feedback form.</p>
              <a href={FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open Feedback Form <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
              <p className="text-sm text-muted-foreground">The form opens in a new tab. No PhysioSmart AI account is required.</p>
              <div className="flex items-start gap-2 rounded-lg border bg-secondary/30 p-4 text-left text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><p>Please do not include patient details or sensitive personal information. Feedback is collected using Google Forms for educational project evaluation.</p></div>
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
