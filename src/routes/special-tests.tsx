import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Container, Disclaimer, PageHeader, Tag, meta } from "@/components/site";

export const Route = createFileRoute("/special-tests")({
  head: () => meta("Special Tests", "Common physiotherapy special tests: purpose, procedure and positive findings."),
  component: Page,
});

const tests = [
  { n: "Lachman Test", r: "Knee", p: "Assess ACL integrity.", how: "Patient supine, knee at 20–30° flexion. Stabilize femur, translate tibia anteriorly.", pos: "Increased anterior translation or soft end-feel." },
  { n: "McMurray Test", r: "Knee", p: "Screen for meniscal lesion.", how: "Flex knee fully, rotate tibia and extend while palpating joint line.", pos: "Painful click or clunk along joint line." },
  { n: "Neer's Test", r: "Shoulder", p: "Screen for subacromial impingement.", how: "Stabilize scapula, passively flex internally rotated arm.", pos: "Pain in anterior/lateral shoulder." },
  { n: "Hawkins-Kennedy", r: "Shoulder", p: "Screen for subacromial impingement.", how: "Shoulder and elbow at 90° flexion, passively internally rotate.", pos: "Shoulder pain." },
  { n: "Straight Leg Raise", r: "Lumbar", p: "Assess neural tension / lumbar radiculopathy.", how: "Patient supine, passively raise straight leg.", pos: "Reproduction of radiating leg symptoms, typically 30–70°." },
  { n: "Phalen's Test", r: "Wrist", p: "Screen for carpal tunnel syndrome.", how: "Hold wrists in full flexion for up to 60 seconds.", pos: "Tingling in median nerve distribution." },
  { n: "Thomas Test", r: "Hip", p: "Assess hip flexor tightness.", how: "Supine, hug one knee to chest, observe opposite thigh.", pos: "Opposite thigh lifts off the table." },
  { n: "Spurling's Test", r: "Cervical", p: "Assess cervical radiculopathy.", how: "Extend, side-bend and gently compress the head.", pos: "Radiating arm pain on the tested side." },
];
const regions = ["All", ...Array.from(new Set(tests.map((t) => t.r)))];

function Page() {
  const [r, setR] = useState("All");
  const list = tests.filter((t) => r === "All" || t.r === r);
  return (
    <>
      <PageHeader eyebrow="Clinical assessment" title="Special Tests" desc="Quick-reference cards. No single test confirms a diagnosis — interpret findings alongside history and clinical examination." />
      <Container>
        <div className="mb-6 flex flex-wrap gap-2">
          {regions.map((x) => <button key={x} onClick={() => setR(x)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${r === x ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{x}</button>)}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((t) => (
            <Card key={t.n}>
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{t.n}</h2><Tag>{t.r}</Tag></div>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="font-medium">Purpose</dt><dd className="text-muted-foreground">{t.p}</dd></div>
                <div><dt className="font-medium">Procedure</dt><dd className="text-muted-foreground">{t.how}</dd></div>
                <div><dt className="font-medium text-accent">Positive finding</dt><dd className="text-muted-foreground">{t.pos}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
        <div className="mt-10"><Disclaimer /></div>
      </Container>
    </>
  );
}
