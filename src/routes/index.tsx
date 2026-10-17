import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Stethoscope, Brain, ListChecks, FlaskConical, ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Card, Container, Disclaimer, meta } from "@/components/site";

export const Route = createFileRoute("/")({
  head: () => meta("Learn to think like a physiotherapist", "AI-powered DPT curriculum, special tests, BCQs and clinical case reasoning for physiotherapy students in Pakistan."),
  component: Index,
});

const features = [
  { icon: BookOpen, title: "DPT Curriculum", desc: "Year-by-year structure of the 5-year DPT program with subject outlines.", to: "/curriculum" },
  { icon: Stethoscope, title: "Special Tests", desc: "Purpose, procedure and interpretation of common orthopedic and neuro tests.", to: "/special-tests" },
  { icon: Brain, title: "AI Clinical Reasoning", desc: "Work through simulated patient cases step by step: history, assessment, plan.", to: "/case-simulator" },
  { icon: ListChecks, title: "BCQs & Viva", desc: "Practice questions with explanations to prepare for professional exams.", to: "/quizzes" },
  { icon: FlaskConical, title: "Evidence-Based Learning", desc: "Learn to appraise research and link findings to clinical decisions.", to: "/resources" },
] as const;

function Index() {
  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div className="min-w-0">
            <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">Built for DPT students in Pakistan</span>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] sm:text-4xl lg:text-5xl xl:text-6xl">
              Don't just learn physiotherapy. <span className="bg-brand bg-clip-text text-transparent">Learn to think like a physiotherapist.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">PhysioMind AI brings your curriculum, notes, BCQs, viva prep, special tests and guided clinical reasoning into one structured learning space.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/curriculum" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft hover:opacity-90">Start Learning <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/case-simulator" className="inline-flex items-center gap-2 rounded-xl border-2 border-accent bg-card px-6 py-3 font-semibold text-accent hover:bg-success-soft">Practice Clinical Cases</Link>
            </div>
          </div>
          <img src={hero} alt="Physiotherapy student studying musculoskeletal anatomy" width={1280} height={960} className="rounded-3xl border shadow-soft" />
        </div>
      </section>
      <Container>
        <h2 className="text-3xl font-bold">Everything you need across your DPT journey</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link key={f.title} to={f.to}>
              <Card className="h-full">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><f.icon /></div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-12"><Disclaimer /></div>
      </Container>
    </>
  );
}
