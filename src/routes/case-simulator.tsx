import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, Container, Disclaimer, PageHeader, meta } from "@/components/site";

export const Route = createFileRoute("/case-simulator")({
  head: () => meta("AI Clinical Case Simulator", "Practice step-by-step clinical reasoning with simulated physiotherapy patient cases."),
  component: Page,
});

const steps = [
  { t: "Patient presentation", c: "A 24-year-old male footballer reports right knee pain and swelling after a non-contact twisting injury 3 days ago. He heard a 'pop' and could not continue playing.", q: "What key questions would you ask in the subjective history?", a: "Mechanism of injury, immediate swelling, locking/giving way, previous injuries, pain behaviour, functional limitations and red flags." },
  { t: "Hypothesis generation", c: "Based on the mechanism and the 'pop', list your primary hypotheses.", q: "Which structures might be involved?", a: "ACL injury is a leading hypothesis; consider meniscal injury, MCL sprain and bone bruising as differentials." },
  { t: "Objective assessment", c: "Observation shows moderate effusion. ROM is limited by pain.", q: "Which special tests would help?", a: "Lachman test, anterior drawer, pivot shift (if tolerated), McMurray, valgus stress test. Consider referral for imaging." },
  { t: "Clinical decision", c: "Lachman shows increased anterior translation with a soft end-feel.", q: "What is your next step?", a: "Findings are consistent with a possible ACL injury. Refer for orthopedic opinion/MRI, manage pain and swelling, and begin early protected rehabilitation as advised." },
];

function Page() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const s = steps[i]!;
  return (
    <>
      <PageHeader eyebrow="Clinical reasoning" title="AI Clinical Case Simulator" desc="Work through a simulated case one step at a time. Think first, then reveal the guided reasoning." />
      <Container>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <ol className="space-y-2">
            {steps.map((x, k) => (
              <li key={x.t} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${k === i ? "bg-primary-soft font-semibold text-primary" : "text-muted-foreground"}`}>
                {k < i ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="w-4 text-center">{k + 1}</span>} {x.t}
              </li>
            ))}
          </ol>
          <Card>
            <p className="text-xs font-semibold uppercase text-accent">Step {i + 1} of {steps.length}</p>
            <h2 className="mt-1 text-2xl font-bold">{s.t}</h2>
            <p className="mt-4">{s.c}</p>
            <p className="mt-6 font-semibold">{s.q}</p>
            <textarea className="mt-3 w-full rounded-xl border bg-background p-3 text-sm" rows={4} placeholder="Write your reasoning here..." />
            {shown && <div className="mt-4 rounded-xl bg-success-soft p-4 text-sm"><strong>Guided reasoning: </strong>{s.a}</div>}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setShown(true)} className="rounded-xl border-2 border-accent px-5 py-2 text-sm font-semibold text-accent">Reveal reasoning</button>
              <button disabled={i === steps.length - 1} onClick={() => { setI(i + 1); setShown(false); }} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">Next step</button>
              {i > 0 && <button onClick={() => { setI(0); setShown(false); }} className="px-3 text-sm text-muted-foreground">Restart</button>}
            </div>
          </Card>
        </div>
        <div className="mt-10"><Disclaimer /></div>
      </Container>
    </>
  );
}
