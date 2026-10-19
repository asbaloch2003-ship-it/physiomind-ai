import { BookOpen, ClipboardList, BrainCircuit, Stethoscope, ScanLine, HeartPulse, ChartNoAxesCombined, ArrowDown } from "lucide-react";

const workflow = [
  { icon: BookOpen, label: "Student Learning" },
  { icon: ClipboardList, label: "Patient History" },
  { icon: BrainCircuit, label: "AI Clinical Reasoning" },
  { icon: Stethoscope, label: "Assessment & Special Tests" },
  { icon: ScanLine, label: "Clinical Impression" },
  { icon: HeartPulse, label: "Evidence-Informed Intervention" },
  { icon: ChartNoAxesCombined, label: "Outcome & Prognosis" },
];

export function ClinicalWorkflow() {
  return (
    <div className="clinical-workflow mx-auto w-full max-w-md" aria-label="PhysioSmart AI educational clinical workflow">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">The learning-to-clinic pathway</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />Educational AI</span>
      </div>
      <ol className="flex flex-col items-center">
        {workflow.map((step, index) => (
          <li key={step.label} className="w-full">
            {index > 0 && <div className="flex h-4 items-center justify-center text-primary/40" aria-hidden="true"><ArrowDown className="h-3.5 w-3.5" /></div>}
            <div className={`workflow-node flex min-h-12 items-center gap-3 rounded-lg border px-4 py-2.5 ${index === 2 ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card text-foreground"}`}>
              <step.icon className={`h-5 w-5 shrink-0 ${index === 2 ? "text-primary-foreground" : index > 2 ? "text-success" : "text-primary"}`} strokeWidth={1.6} />
              <span className="flex-1 text-sm font-semibold">{step.label}</span>
              <span className={`text-[11px] font-medium tabular-nums ${index === 2 ? "text-primary-foreground/65" : "text-muted-foreground/60"}`}>{String(index + 1).padStart(2, "0")}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}