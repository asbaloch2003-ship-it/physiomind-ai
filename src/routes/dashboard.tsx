import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Container, PageHeader, meta } from "@/components/site";

export const Route = createFileRoute("/dashboard")({
  head: () => meta("Student Dashboard", "Track your DPT learning progress, quizzes and clinical case practice."),
  component: Page,
});

const progress = [
  { s: "Musculoskeletal PT", p: 68 },
  { s: "Neurological PT", p: 42 },
  { s: "Electrotherapy", p: 80 },
  { s: "Cardiopulmonary PT", p: 25 },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Your progress" title="Student Dashboard" desc="A preview of how your learning progress will be tracked. Sample data shown." />
      <Container>
        <div className="grid gap-5 sm:grid-cols-3">
          {[["Quizzes completed", "12"], ["Cases practised", "5"], ["Study streak", "7 days"]].map(([k, v]) => (
            <Card key={k}><p className="text-sm text-muted-foreground">{k}</p><p className="mt-2 text-3xl font-bold text-primary">{v}</p></Card>
          ))}
        </div>
        <Card className="mt-6">
          <h2 className="text-lg font-semibold">Subject progress</h2>
          <div className="mt-5 space-y-4">
            {progress.map((x) => (
              <div key={x.s}>
                <div className="flex justify-between text-sm"><span>{x.s}</span><span className="text-muted-foreground">{x.p}%</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-brand" style={{ width: `${x.p}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <div className="mt-6 flex gap-3">
          <Link to="/quizzes" className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Continue BCQs</Link>
          <Link to="/case-simulator" className="rounded-xl border-2 border-accent px-5 py-2 text-sm font-semibold text-accent">Resume case</Link>
        </div>
      </Container>
    </>
  );
}
