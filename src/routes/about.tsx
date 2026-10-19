import { createFileRoute } from "@tanstack/react-router";
import { Card, Container, Disclaimer, PageHeader, meta } from "@/components/site";

export const Route = createFileRoute("/about")({
  head: () => meta("About", "PhysioSmart AI's mission: helping DPT students in Pakistan build strong clinical reasoning."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader eyebrow="Our mission" title="About PhysioSmart AI" desc="We help DPT students in Pakistan move beyond memorisation toward structured, evidence-informed clinical thinking." />
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {[["Learn", "Structured curriculum content, notes and lectures in one place."], ["Practise", "BCQs, viva questions and special test references for exam readiness."], ["Reason", "Guided case simulations that model how clinicians think."]].map(([t, d]) => (
            <Card key={t}><h2 className="text-xl font-semibold text-primary">{t}</h2><p className="mt-2 text-sm text-muted-foreground">{d}</p></Card>
          ))}
        </div>
        <div className="mt-10"><Disclaimer /></div>
      </Container>
    </>
  );
}
