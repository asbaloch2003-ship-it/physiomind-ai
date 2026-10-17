import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Container, PageHeader, Tag, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { SourceReference, SemesterFilter } from "@/components/curriculum-controls";
import { semesters, courses, creditLabel } from "@/lib/curriculum";

export const Route = createFileRoute("/curriculum")({
  head: () => meta("DPT Curriculum", "All ten semesters of the uploaded HEC Pakistan DPT curriculum, revised 2016, with subjects and credit hours."),
  component: Page,
});

function Page() {
  const [semester, setSemester] = useState("all");
  return (
    <>
      <PageHeader eyebrow="HEC Pakistan · Revised 2016" title="DPT Curriculum" desc="Five professional years. Ten semesters. Your complete subject pathway from foundational sciences to supervised clinical practice." />
      <Container>
        <SourceReference />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <SemesterFilter value={semester} onChange={setSemester} />
          <p className="text-sm text-muted-foreground">{courses.length} subjects · 174 credits stated in source · Scheme pp. 17–19</p>
        </div>
        <div className="grid items-start gap-x-10 gap-y-12 lg:grid-cols-2">
          {semesters.filter((s) => semester === "all" || s.number === Number(semester)).map((s) => <section key={s.number}>
            <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-primary pb-4">
              <div><p className="mb-1 text-xs font-semibold text-accent">PROFESSIONAL YEAR {s.year}</p><h2 className="text-xl font-bold">Semester {s.number}</h2></div>
              <Tag>{s.publishedCredits} credits in source</Tag>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">Credit format: total (theory–practical / clinical)</p>
            <ul className="divide-y">{s.courses.map((c) => <li key={c.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0"><Link to="/subjects" search={{ semester: String(s.number), course: c.id }} className="text-sm font-medium hover:text-primary">{c.name}</Link>{c.optional && <p className="mt-1 text-xs text-accent">University optional</p>}</div>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{creditLabel(c)}</span>
            </li>)}</ul>
            <Button variant="link" className="mt-2 px-0" asChild><Link to="/subjects" search={{ semester: String(s.number) }}>Study semester {s.number}<ArrowRight /></Link></Button>
          </section>)}
        </div>
        <p className="mt-10 border-t pt-5 text-xs leading-relaxed text-muted-foreground"><strong>Source credit discrepancy:</strong> the document states 174 total credits, but its semester totals sum to 177. Semester 6 lists courses totaling 17; semester 9 lists courses totaling 18, while each printed semester total is 18. Figures above preserve the printed scheme. Biostatistics II is university optional; confirm your university’s adopted scheme.</p>
      </Container>
    </>
  );
}
