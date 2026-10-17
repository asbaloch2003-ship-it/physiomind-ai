import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Container, PageHeader, meta } from "@/components/site";

export const Route = createFileRoute("/quizzes")({
  head: () => meta("BCQs & Quizzes", "Practice DPT best-choice questions with instant feedback and explanations."),
  component: Page,
});

const qs = [
  { q: "Which nerve supplies the deltoid muscle?", o: ["Radial", "Axillary", "Musculocutaneous", "Suprascapular"], a: 1, e: "The axillary nerve (C5–C6) supplies the deltoid and teres minor." },
  { q: "The Lachman test primarily assesses which ligament?", o: ["PCL", "MCL", "ACL", "LCL"], a: 2, e: "Lachman assesses anterior tibial translation, testing ACL integrity." },
  { q: "Normal knee flexion range of motion is approximately:", o: ["0–90°", "0–110°", "0–135°", "0–180°"], a: 2, e: "Commonly cited normal active knee flexion is about 0–135°." },
  { q: "Which is a contraindication for therapeutic ultrasound?", o: ["Chronic tendinopathy", "Over a malignancy", "Muscle spasm", "Scar tissue"], a: 1, e: "Ultrasound should not be applied over known or suspected malignancy." },
];

function Page() {
  const [ans, setAns] = useState<Record<number, number>>({});
  const score = Object.entries(ans).filter(([k, v]) => qs[+k]?.a === v).length;
  return (
    <>
      <PageHeader eyebrow="Exam practice" title="BCQs & Quizzes" desc="Select an answer to see instant feedback and a short explanation." />
      <Container>
        <p className="mb-6 font-semibold">Score: <span className="text-primary">{score}</span> / {qs.length}</p>
        <div className="space-y-5">
          {qs.map((x, i) => (
            <Card key={i}>
              <h2 className="font-semibold">{i + 1}. {x.q}</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {x.o.map((o, j) => {
                  const picked = ans[i] !== undefined;
                  const cls = !picked ? "hover:bg-secondary" : j === x.a ? "border-success bg-success-soft" : ans[i] === j ? "border-destructive text-destructive" : "opacity-60";
                  return <button key={o} disabled={picked} onClick={() => setAns({ ...ans, [i]: j })} className={`rounded-xl border px-4 py-3 text-left text-sm ${cls}`}>{o}</button>;
                })}
              </div>
              {ans[i] !== undefined && <p className="mt-3 text-sm text-muted-foreground">{x.e}</p>}
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
