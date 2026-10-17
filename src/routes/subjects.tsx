import { createFileRoute } from "@tanstack/react-router";
import { Bone, HeartPulse, Brain, Activity, Zap, Baby } from "lucide-react";
import { Card, Container, PageHeader, meta } from "@/components/site";

export const Route = createFileRoute("/subjects")({
  head: () => meta("Subjects", "Explore core DPT subjects with lectures, notes and practice questions."),
  component: Page,
});

const subjects = [
  { icon: Bone, n: "Musculoskeletal PT", d: "Assessment and management of joint, muscle and soft-tissue conditions.", l: 24 },
  { icon: Brain, n: "Neurological PT", d: "Stroke, spinal cord injury, Parkinson's and neuro rehabilitation principles.", l: 20 },
  { icon: HeartPulse, n: "Cardiopulmonary PT", d: "Chest physiotherapy, cardiac rehab and respiratory assessment.", l: 16 },
  { icon: Activity, n: "Kinesiology & Biomechanics", d: "Human movement analysis, gait and posture.", l: 18 },
  { icon: Zap, n: "Electrotherapy", d: "TENS, ultrasound, IFT and physical agents with safety considerations.", l: 14 },
  { icon: Baby, n: "Pediatric PT", d: "Developmental milestones, cerebral palsy and pediatric assessment.", l: 12 },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Learn by subject" title="Subjects" desc="Structured modules for each core area of physiotherapy practice." />
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.n}>
              <s.icon className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{s.n}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              <p className="mt-4 text-xs font-medium text-accent">{s.l} lessons planned</p>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
