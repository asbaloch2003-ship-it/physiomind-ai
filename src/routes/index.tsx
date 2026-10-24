import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Stethoscope, BrainCircuit, ArrowRight, GraduationCap, ClipboardList, FileText, ListChecks, MessageCircle, Lightbulb, HeartPulse, ChartNoAxesCombined, ShieldCheck, Check, Layers } from "lucide-react";
import { meta } from "@/components/site";
import { Button } from "@/components/ui/button";
import { ClinicalWorkflow } from "@/components/clinical-workflow";

export const Route = createFileRoute("/")({
  head: () => meta("DPT Learning & Clinical Reasoning", "PhysioSmart AI brings the DPT curriculum, notes, BCQs, viva preparation, special tests and educational clinical reasoning into one learning platform for students in Pakistan."),
  component: Index,
});

const features = [
  { icon: BookOpen, label: "LEARN", title: "Complete DPT Learning", desc: "Choose your semester, subject and topic. Learn through simple explanations, clinical examples, notes, BCQs and viva questions.", to: "/study", link: "Start interactive study" },
  { icon: Stethoscope, label: "ASSESS", title: "Physiotherapy Special Tests", desc: "Explore special tests with purpose, patient position, procedure, positive findings, interpretation and visual explanations.", to: "/special-tests", link: "Explore special tests" },
  { icon: BrainCircuit, label: "THINK", title: "AI Clinical Reasoning", desc: "Enter a fictional patient case and receive an educational clinical reasoning pathway including relevant assessments, possible differential diagnoses, intervention options, outcome measures and prognostic considerations.", to: "/ai-assistant", link: "Ask AI about a clinical case" },
] as const;

const learningSteps = [
  { icon: GraduationCap, title: "Choose Your Semester" },
  { icon: Layers, title: "Select Your Subject" },
  { icon: BookOpen, title: "Learn the Topic" },
  { icon: ListChecks, title: "Practice with BCQs" },
  { icon: ClipboardList, title: "Solve Clinical Cases" },
  { icon: BrainCircuit, title: "Build Clinical Reasoning" },
];

const classroom = [
  { icon: FileText, label: "Notes" }, { icon: GraduationCap, label: "Lectures" },
  { icon: ListChecks, label: "BCQs" }, { icon: MessageCircle, label: "Viva" },
  { icon: Lightbulb, label: "Daily-life examples" },
];
const clinical = ["Patient history", "Assessment", "Special tests", "Clinical reasoning", "Intervention", "Outcome measures", "Prognosis"];

function Index() {
  return (
    <>
      <section className="homepage-hero border-b">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1.12fr_1fr] lg:gap-16 lg:py-12">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-success"><GraduationCap className="h-4 w-4" />For DPT students in Pakistan</p>
            <div className="mt-5 inline-flex items-center gap-3" aria-label="PhysioSmart AI brand"><img src="/physiosmart-logo.svg" alt="" width="64" height="64" className="h-16 w-16 shrink-0 object-contain" /><div><p className="font-display text-xl font-bold tracking-tight text-primary">PhysioSmart <span className="text-accent">AI</span></p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Learn · Practice · Excel</p></div></div>
            <h1 className="mt-3 text-[32px] font-bold leading-[1.22] sm:text-[42px] xl:text-[46px]">
              Don't just learn physiotherapy. <span className="text-primary">Learn to think like a physiotherapist.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">PhysioSmart AI brings the DPT curriculum, easy-to-understand notes, BCQs, viva preparation, special tests and AI-assisted clinical reasoning into one structured learning platform.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="h-auto min-h-12 whitespace-normal px-5 py-3"><Link to="/study">Start Learning<ArrowRight /></Link></Button>
              <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal border-primary/30 bg-card px-5 py-3 text-primary hover:bg-primary-soft hover:text-primary"><Link to="/ai-assistant">Practice AI Clinical Cases</Link></Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-primary" />Curriculum-aligned learning</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" />Education-first clinical reasoning</span>
            </div>
          </div>
          <ClinicalWorkflow />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <p className="section-eyebrow">Learn. Assess. Think.</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Everything a DPT Student Needs</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.label} className={`flex flex-col rounded-lg border p-6 sm:p-7 ${f.label === "THINK" ? "border-primary/30 bg-primary-soft" : "bg-card"}`}>
              <div className="flex items-center justify-between"><div className={`grid h-12 w-12 place-items-center rounded-lg ${f.label === "THINK" ? "bg-primary text-primary-foreground" : f.label === "ASSESS" ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`}><f.icon strokeWidth={1.6} /></div><span className={`text-xs font-semibold tracking-widest ${f.label === "ASSESS" ? "text-success" : "text-primary"}`}>{f.label}</span></div>
              <h3 className="mt-6 text-xl font-semibold leading-snug">{f.title}</h3>
              <p className="mb-6 mt-3 text-sm leading-7 text-muted-foreground">{f.desc}</p>
              <Button asChild variant="link" className="mt-auto h-auto justify-start self-start p-0 text-sm"><Link to={f.to}>{f.link}<ArrowRight /></Link></Button>
            </article>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-2.5 text-xs leading-6 text-muted-foreground"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-success" /><p>PhysioSmart AI is an educational and clinical-learning support tool. AI-generated information does not replace assessment, diagnosis or treatment by a qualified healthcare professional.</p></div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p className="section-eyebrow">A structured path forward</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">How PhysioSmart AI Works</h2>
          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {learningSteps.map((step, index) => <li key={step.title} className="relative border-t-2 border-primary/20 pt-5"><span className="text-xs font-semibold tabular-nums text-success">{String(index + 1).padStart(2, "0")}</span><step.icon className="mb-4 mt-4 h-6 w-6 text-primary" strokeWidth={1.6} /><h3 className="max-w-40 text-sm font-semibold leading-6">{step.title}</h3>{index < learningSteps.length - 1 && <ArrowRight className="absolute -right-4 top-[-9px] hidden h-4 w-4 bg-card text-primary/40 lg:block" aria-hidden="true" />}</li>)}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <p className="section-eyebrow">Knowledge becomes clinical thinking</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">From Classroom to Clinic</h2>
        <div className="mt-9 grid gap-8 md:grid-cols-2 md:gap-14">
          <div className="border-t-2 border-primary pt-6">
            <div className="flex items-center gap-3 text-primary"><GraduationCap className="h-7 w-7" strokeWidth={1.5} /><h3 className="text-sm font-semibold tracking-widest">CLASSROOM</h3></div>
            <ul className="mt-5 grid gap-x-6 sm:grid-cols-2">{classroom.map(item => <li key={item.label} className="flex items-center gap-3 border-b py-4 text-sm"><item.icon className="h-4 w-4 text-primary" />{item.label}</li>)}</ul>
          </div>
          <div className="border-t-2 border-success pt-6">
            <div className="flex items-center gap-3 text-success"><HeartPulse className="h-7 w-7" strokeWidth={1.5} /><h3 className="text-sm font-semibold tracking-widest">CLINICAL</h3></div>
            <ul className="mt-5 grid gap-x-6 sm:grid-cols-2">{clinical.map(label => <li key={label} className="flex items-center gap-3 border-b py-4 text-sm"><Check className="h-4 w-4 shrink-0 text-success" />{label}</li>)}</ul>
          </div>
        </div>
        <div className="mt-7 flex items-center gap-2 text-sm font-medium text-muted-foreground"><ChartNoAxesCombined className="h-4 w-4 text-success" />From understanding concepts to making evidence-informed decisions.</div>
      </section>

      <section className="homepage-cta border-y bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center">
          <div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">Your next step starts here</p><h2 className="max-w-xl text-2xl font-bold leading-snug sm:text-3xl">Start Your Physiotherapy Learning Journey</h2></div>
          <Button asChild variant="secondary" className="h-auto min-h-12 whitespace-normal bg-card px-6 py-3 text-primary hover:bg-primary-soft"><Link to="/study">Explore PhysioSmart AI<ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
