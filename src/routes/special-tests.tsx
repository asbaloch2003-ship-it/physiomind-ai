import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Container, Disclaimer, PageHeader, Tag, meta } from "@/components/site";

export const Route = createFileRoute("/special-tests")({
  head: () => meta("Physiotherapy Special Tests", "Interactive clinical test guides with patient and therapist positioning, steps, findings, and simple diagrams."),
  component: Page,
});

type Test = {name:string;region:string;purpose:string;patient:string;therapist:string;steps:string[];positive:string;meaning:string;caution:string;diagram:string};
const tests:Test[] = [
  {name:"Lachman Test",region:"Knee",purpose:"Assess anterior cruciate ligament (ACL) laxity.",patient:"Supine, relaxed; knee flexed approximately 20–30°.",therapist:"Stand beside the tested knee. One hand stabilizes distal femur; the other grasps proximal tibia.",steps:["Support the slightly flexed knee.","Stabilize the femur and draw the proximal tibia anteriorly.","Compare translation and end-feel with the other knee."],positive:"Greater anterior tibial translation and/or a soft endpoint compared with the other side.",meaning:"Supports possible ACL injury when combined with history and other findings.",caution:"Avoid forcing a painful or acutely injured knee; refer suspected major trauma.",diagram:"knee"},
  {name:"McMurray Test",region:"Knee",purpose:"Assess possible meniscal pathology.",patient:"Supine with hip and knee initially flexed.",therapist:"Stand at the tested side; support the heel and palpate the knee joint line.",steps:["Flex the knee comfortably.","Rotate the tibia while moving the knee toward extension with appropriate varus/valgus positioning.","Observe for joint-line pain, catching or a palpable click."],positive:"Reproduction of familiar joint-line symptoms with a palpable or audible click may be suggestive.",meaning:"Contributes to assessment of meniscal pathology; no single test confirms a tear.",caution:"Do not force rotation if the knee is locked, swollen or very painful.",diagram:"knee"},
  {name:"Neer Test",region:"Shoulder",purpose:"Reproduce symptoms associated with subacromial shoulder pain.",patient:"Sitting or standing, arm relaxed.",therapist:"Stand beside the patient; stabilize scapula and support the arm.",steps:["Stabilize the scapula.","Passively elevate the arm in forward flexion with the shoulder internally rotated as tolerated.","Ask whether the maneuver reproduces familiar pain."],positive:"Reproduction of familiar anterolateral shoulder pain.",meaning:"A symptom-provocation finding, not a definitive diagnosis of impingement.",caution:"Stop if there is severe pain, recent trauma or instability.",diagram:"shoulder"},
  {name:"Hawkins–Kennedy Test",region:"Shoulder",purpose:"Assess provocation of subacromial shoulder pain.",patient:"Sitting or standing; shoulder and elbow flexed to approximately 90°.",therapist:"Stand in front or beside the patient, supporting elbow and forearm.",steps:["Flex the shoulder and elbow to 90°.","Gently internally rotate the shoulder by moving the forearm downward.","Ask whether familiar shoulder pain occurs."],positive:"Familiar anterolateral shoulder pain.",meaning:"May support a subacromial pain presentation when considered with the full examination.",caution:"Avoid aggressive rotation in acute painful shoulders.",diagram:"shoulder"},
  {name:"Straight Leg Raise",region:"Lumbar",purpose:"Assess neural mechanosensitivity in possible lumbar radicular pain.",patient:"Supine with both legs relaxed.",therapist:"Stand beside the symptomatic leg; support heel and maintain knee extension.",steps:["Slowly raise the straight leg by flexing the hip.","Note angle and distribution of reproduced symptoms.","Differentiate radiating symptoms from ordinary hamstring stretch."],positive:"Reproduction of familiar radiating leg symptoms, often between approximately 30° and 70°.",meaning:"Can support a lumbar nerve-root-related presentation; interpretation requires neurological examination.",caution:"Do not provoke severe or progressive neurological symptoms.",diagram:"leg"},
  {name:"Phalen Test",region:"Wrist",purpose:"Provoke symptoms associated with median nerve compression at the carpal tunnel.",patient:"Sitting with elbows supported or comfortably flexed.",therapist:"Face the patient and observe symptoms; hands-on pressure is not necessary.",steps:["Ask the patient to flex both wrists fully, backs of hands together.","Hold up to 60 seconds or stop when familiar symptoms appear.","Record distribution and timing of tingling or numbness."],positive:"Familiar paresthesia in median-nerve-innervated digits.",meaning:"A supportive finding in suspected carpal tunnel syndrome, not diagnostic alone.",caution:"Stop if symptoms become intense.",diagram:"wrist"},
  {name:"Thomas Test",region:"Hip",purpose:"Assess hip flexor length and potential contracture.",patient:"Supine near table edge; draw one knee toward chest to flatten lumbar lordosis.",therapist:"Stand beside the table and observe the opposite thigh and knee.",steps:["Ask the patient to bring one knee to the chest.","Observe whether the opposite thigh remains supported on the table.","Note thigh elevation and knee extension as potential clues to different muscle limitations."],positive:"Opposite thigh lifts off the table or cannot reach neutral hip extension.",meaning:"Suggests reduced hip flexor length, interpreted alongside pelvic positioning.",caution:"Support the patient safely near the edge of the table.",diagram:"hip"},
  {name:"Spurling Test",region:"Cervical",purpose:"Assess reproduction of symptoms consistent with cervical radiculopathy.",patient:"Sitting upright with neck positioned comfortably.",therapist:"Stand behind the patient, providing controlled support.",steps:["Only after screening, gently extend and side-bend the neck toward the symptomatic side.","Apply carefully controlled axial compression only when appropriate.","Check whether familiar radiating arm symptoms are reproduced."],positive:"Reproduction of familiar radiating arm pain or paresthesia rather than isolated neck discomfort.",meaning:"May support cervical radiculopathy in combination with neurological assessment.",caution:"Do not perform with suspected cervical instability, significant trauma, myelopathy, vascular concerns or progressive neurological deficit.",diagram:"neck"},
];
const regions = ["All", ...Array.from(new Set(tests.map(t=>t.region)))];

function Diagram({type}:{type:string}) {
  const area:Record<string,{label:string;x:number;y:number}> = {
    knee:{label:"Knee",x:150,y:145}, shoulder:{label:"Shoulder",x:106,y:63},
    leg:{label:"Raised leg",x:148,y:146}, wrist:{label:"Wrist",x:89,y:132},
    hip:{label:"Hip",x:135,y:119}, neck:{label:"Neck",x:145,y:58},
  };
  const spot=area[type]||area.knee;
  return <figure className="rounded-xl border bg-secondary/40 p-3">
    <svg viewBox="0 0 320 220" role="img" aria-label={"Simplified front-view body diagram showing the "+spot.label.toLowerCase()+" region"} className="mx-auto h-48 w-full max-w-sm">
      <rect x="1" y="1" width="318" height="218" rx="14" fill="none" stroke="currentColor" strokeOpacity=".13"/>
      <circle cx="160" cy="36" r="18" fill="#dbeafe" stroke="#64748b" strokeWidth="2"/>
      <path d="M151 55 L144 65 L116 72 L126 116 L141 128 L179 128 L194 116 L204 72 L176 65 L169 55" fill="#dbeafe" stroke="#64748b" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M117 75 L96 120 L89 158 M203 75 L224 120 L231 158 M145 129 L142 166 L139 199 M176 129 L180 166 L185 199" fill="none" stroke="#64748b" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={spot.x} cy={spot.y} r="16" fill="#2563eb" fillOpacity=".18" stroke="#2563eb" strokeWidth="3"/>
      <path d={"M"+(spot.x+15)+" "+(spot.y-10)+" L260 44"} stroke="#2563eb" strokeWidth="2" strokeDasharray="5 4" fill="none"/>
      <rect x="223" y="20" width="85" height="30" rx="8" fill="#2563eb"/>
      <text x="265" y="39" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">{spot.label}</text>
    </svg>
    <figcaption className="mt-1 text-center text-xs text-muted-foreground">Simplified orientation diagram — highlighted assessment region, not a demonstration of hand placement.</figcaption>
  </figure>;
}

function Page() {
  const [region,setRegion]=useState("All");
  const [opened,setOpened]=useState<string|null>(null);
  const list=tests.filter(t=>region==="All"||t.region===region);
  return <>
    <PageHeader eyebrow="Clinical skills library" title="Physiotherapy Special Tests" desc="Explore positioning, therapist hand placement, step-by-step technique, positive findings and safety considerations. Select any test to open its detailed guide." />
    <Container>
      <div className="mb-7 flex flex-wrap gap-2">{regions.map(x=><button key={x} type="button" onClick={()=>{setRegion(x);setOpened(null)}} className={`rounded-full px-4 py-2 text-sm font-medium ${region===x?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground hover:bg-primary-soft"}`}>{x}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{list.map(t=><Card key={t.name} className="!rounded-xl">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{t.name}</h2><p className="mt-1 text-sm text-muted-foreground">{t.purpose}</p></div><Tag>{t.region}</Tag></div>
        <button type="button" aria-expanded={opened===t.name} onClick={()=>setOpened(opened===t.name?null:t.name)} className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-left text-sm font-semibold text-primary-foreground">{opened===t.name?"− Close detailed guide":"+ Open detailed guide"}</button>
        {opened===t.name&&<div className="mt-5 space-y-4 text-sm leading-6">
          <Diagram type={t.diagram}/>
          <div><h3 className="font-bold text-primary">Patient position</h3><p>{t.patient}</p></div>
          <div><h3 className="font-bold text-primary">Physiotherapist position and hand placement</h3><p>{t.therapist}</p></div>
          <div><h3 className="font-bold text-primary">Step-by-step procedure</h3><ol className="mt-2 list-inside list-decimal space-y-2">{t.steps.map((s,i)=><li key={i}>{s}</li>)}</ol></div>
          <div><h3 className="font-bold text-primary">Positive finding</h3><p>{t.positive}</p></div>
          <div><h3 className="font-bold text-primary">Clinical interpretation</h3><p>{t.meaning}</p></div>
          <div className="rounded-lg border border-warning/30 bg-warning-soft p-3"><h3 className="font-bold">Safety / precautions</h3><p>{t.caution}</p></div>
        </div>}
      </Card>)}</div>
      <p className="mt-7 text-sm text-muted-foreground">Educational overview only. Practice clinical tests under qualified supervision; no single special test establishes a diagnosis.</p>
      <div className="mt-7"><Disclaimer/></div>
    </Container>
  </>;
}
