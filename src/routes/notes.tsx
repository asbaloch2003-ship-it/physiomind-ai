import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Card, Container, PageHeader, Tag, meta } from "@/components/site";

export const Route = createFileRoute("/notes")({
  head: () => meta("Study Notes", "Concise DPT study notes, lecture summaries and viva questions."),
  component: Page,
});

const notes = [
  { t: "Brachial Plexus Overview", s: "Anatomy", d: "Roots, trunks, divisions, cords and terminal branches with common lesions." },
  { t: "Gait Cycle Phases", s: "Kinesiology", d: "Stance and swing phases, key muscle activity and common gait deviations." },
  { t: "Stroke Rehabilitation Principles", s: "Neuro PT", d: "Assessment frameworks and task-oriented training concepts." },
  { t: "TENS Parameters", s: "Electrotherapy", d: "Conventional vs acupuncture-like TENS, indications and precautions." },
  { t: "Viva: Shoulder Complex", s: "Viva Prep", d: "Frequently asked viva questions on shoulder anatomy and assessment." },
  { t: "Chest Physiotherapy Techniques", s: "Cardiopulmonary", d: "Airway clearance, breathing exercises and positioning." },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Study material" title="Notes" desc="Concise summaries and viva prep, organised by subject." />
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <Card key={n.t}>
              <div className="flex items-start justify-between"><FileText className="text-primary" /><Tag>{n.s}</Tag></div>
              <h2 className="mt-4 font-semibold">{n.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{n.d}</p>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
