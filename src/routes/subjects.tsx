import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, FileText, ListChecks } from "lucide-react";
import { Card, Container, PageHeader, Tag, meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { SourceReference, SemesterFilter, SubjectSearch } from "@/components/curriculum-controls";
import { filterCourses, creditLabel } from "@/lib/curriculum";
import { courseOutlines } from "@/lib/course-outlines";

export const Route = createFileRoute("/subjects")({
  head: () => meta("Subjects", "Explore core DPT subjects with lectures, notes and practice questions."),
  validateSearch: (search: Record<string, unknown>): { semester?: string; course?: string } => ({
    semester: typeof search.semester === "string" ? search.semester : undefined,
    course: typeof search.course === "string" ? search.course : undefined,
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const [semester, setSemester] = useState(search.semester ?? "all");
  const [query, setQuery] = useState("");
  const list = filterCourses(semester, query).filter((c) => !search.course || query !== "" || semester !== search.semester || c.id === search.course);
  return (
    <>
      <PageHeader eyebrow="Semester-wise learning" title="Subjects" desc="Every course in the uploaded HEC DPT study scheme, with official outlines and linked revision material." />
      <Container>
        <SourceReference />
        <div className="mb-6 flex flex-wrap items-end gap-4"><SemesterFilter value={semester} onChange={setSemester} /><SubjectSearch value={query} onChange={setQuery} /></div>
        <p className="mb-5 text-sm text-muted-foreground">{list.length} subjects</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id} className="flex flex-col !rounded-lg">
              <div className="flex items-center justify-between"><BookOpen className="size-6 text-primary" /><Tag>Semester {c.semester}</Tag></div>
              <h2 className="mt-4 text-lg font-semibold">{c.name}</h2>
              <p className="mt-2 text-xs text-accent">{creditLabel(c)} credits{c.optional ? " · University optional" : ""}</p>
              <ul className="my-4 list-inside list-disc space-y-1 text-sm text-muted-foreground">{courseOutlines[c.id]?.topics.map((t) => <li key={t}>{t}</li>)}</ul>
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                <Button variant="secondary" size="sm" asChild><Link to="/notes" search={{ semester: String(c.semester), course: c.id }}><FileText />Notes & viva</Link></Button>
                <Button variant="outline" size="sm" asChild><Link to="/quizzes" search={{ semester: String(c.semester), course: c.id }}><ListChecks />BCQs</Link></Button>
              </div>
            </Card>
          ))}
        </div>
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No subjects match your search.</p>}
      </Container>
    </>
  );
}
