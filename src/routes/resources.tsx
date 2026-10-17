import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Card, Container, Disclaimer, PageHeader, meta } from "@/components/site";

export const Route = createFileRoute("/resources")({
  head: () => meta("Clinical Resources", "Trusted evidence-based physiotherapy resources and databases for DPT students."),
  component: Page,
});

const res = [
  { n: "PEDro", d: "Physiotherapy Evidence Database of trials, reviews and guidelines.", u: "https://pedro.org.au" },
  { n: "PubMed", d: "Biomedical literature search from the U.S. National Library of Medicine.", u: "https://pubmed.ncbi.nlm.nih.gov" },
  { n: "Cochrane Library", d: "High-quality systematic reviews of healthcare interventions.", u: "https://www.cochranelibrary.com" },
  { n: "Physiopedia", d: "Collaborative physiotherapy knowledge resource.", u: "https://www.physio-pedia.com" },
  { n: "JOSPT Clinical Practice Guidelines", d: "Orthopaedic and sports physical therapy guidelines.", u: "https://www.jospt.org" },
  { n: "World Physiotherapy", d: "Global professional body for physiotherapy.", u: "https://world.physio" },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Evidence-informed practice" title="Clinical Resources" desc="Reputable external sources to deepen your learning and support evidence-based reasoning." />
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {res.map((r) => (
            <a key={r.n} href={r.u} target="_blank" rel="noreferrer">
              <Card className="h-full">
                <div className="flex justify-between"><h2 className="font-semibold">{r.n}</h2><ExternalLink className="h-4 w-4 text-accent" /></div>
                <p className="mt-2 text-sm text-muted-foreground">{r.d}</p>
              </Card>
            </a>
          ))}
        </div>
        <div className="mt-10"><Disclaimer /></div>
      </Container>
    </>
  );
}
