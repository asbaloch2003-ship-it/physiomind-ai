import { createFileRoute } from "@tanstack/react-router";
import { Card, Container, PageHeader, Tag, meta } from "@/components/site";

export const Route = createFileRoute("/curriculum")({
  head: () => meta("DPT Curriculum", "Year-by-year overview of the 5-year Doctor of Physical Therapy program."),
  component: Page,
});

const years = [
  { y: "Year 1", s: ["Anatomy I & II", "Physiology I & II", "Kinesiology I", "English", "Pakistan Studies"] },
  { y: "Year 2", s: ["Anatomy III", "Physiology III", "Biochemistry", "Kinesiology II", "Biomechanics & Ergonomics", "Exercise Physiology"] },
  { y: "Year 3", s: ["Pathology & Microbiology", "Pharmacology", "Medicine", "Physical Agents & Electrotherapy", "Therapeutic Exercise", "Research Methods"] },
  { y: "Year 4", s: ["Surgery", "Musculoskeletal PT", "Neurological PT", "Radiology & Diagnostic Imaging", "Evidence-Based Practice", "Clinical Practice I"] },
  { y: "Year 5", s: ["Cardiopulmonary PT", "Pediatric PT", "Sports PT", "Women's Health", "Professional Practice & Ethics", "Clinical Practice II"] },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Program overview" title="DPT Curriculum" desc="A general outline of the 5-year DPT program. Exact subjects vary by university — always follow your institution's official scheme of studies." />
      <Container>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {years.map((y, i) => (
            <Card key={y.y}>
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold text-primary-foreground">{i + 1}</span><h2 className="text-xl font-semibold">{y.y}</h2></div>
              <div className="mt-4 flex flex-wrap gap-2">{y.s.map((s) => <Tag key={s}>{s}</Tag>)}</div>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
