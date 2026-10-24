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

function Diagram({type,name}:{type:string;name:string}) {
  const isKnee=type==="knee", isShoulder=type==="shoulder", isLeg=type==="leg", isWrist=type==="wrist", isHip=type==="hip", isNeck=type==="neck";
  const focus=isKnee?[286,123]:isShoulder?[157,108]:isLeg?[288,113]:isWrist?[210,95]:isHip?[237,123]:[158,69];
  return <figure className="overflow-hidden rounded-2xl border bg-white shadow-sm">
    <div className="flex items-center justify-between gap-2 border-b bg-slate-50 px-4 py-3"><strong className="text-sm text-slate-900">Clinical positioning illustration</strong><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{name}</span></div>
    <svg viewBox="0 0 540 295" role="img" aria-label={name+" illustrated examination position with patient, clinician, assessment contact and direction arrow"} className="w-full">
      <defs><linearGradient id="patientShade" x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#f7c9a5"/><stop offset="1" stopColor="#d99270"/></linearGradient><linearGradient id="scrubs" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2563a6"/><stop offset="1" stopColor="#12335f"/></linearGradient><marker id="forceArrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0 L7 3 L0 6" fill="none" stroke="#e11d48" strokeWidth="1.6"/></marker></defs>
      <rect width="540" height="295" fill="#f1f5f9"/>
      <path d="M0 244 H540" stroke="#cbd5e1" strokeWidth="2"/>
      <rect x="30" y="169" width="332" height="14" rx="7" fill="#3d536e"/><path d="M57 182 V245 M336 182 V245" stroke="#475569" strokeWidth="10"/>
      <rect x="30" y="156" width="330" height="16" rx="6" fill="#8fb6cb"/>
      {isWrist||isNeck?<g>
        <path d="M102 151 L103 106 Q103 82 133 77 L180 77 Q202 81 205 112 L207 157" fill="url(#scrubs)" stroke="#24496d" strokeWidth="2"/>
        <rect x="136" y="65" width="28" height="25" rx="9" fill="url(#patientShade)"/><circle cx="150" cy="46" r="23" fill="url(#patientShade)" stroke="#bd795c" strokeWidth="2"/>
        <path d="M105 107 L89 145 L102 151 M197 106 L217 133 L230 117" stroke="#d99270" strokeWidth="15" fill="none" strokeLinecap="round"/>
      </g>:<g>
        <circle cx="64" cy="133" r="20" fill="url(#patientShade)" stroke="#bd795c" strokeWidth="2"/>
        <path d="M83 137 Q115 128 153 140 L218 145 Q234 146 238 158 L151 159 L87 152Z" fill="url(#scrubs)"/>
        <path d="M91 151 L170 160 L230 160" stroke="#d99270" strokeWidth="10" fill="none" strokeLinecap="round"/>
        <path d={isLeg?"M232 152 L280 112 L339 70":isHip?"M232 151 L258 124 L298 150":isKnee?"M232 153 L286 123 L337 158":"M232 151 L284 155 L335 158"} stroke="url(#patientShade)" strokeWidth="23" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={isLeg?"M232 158 L294 160 L350 162":isHip?"M232 154 L290 160 L345 161":"M232 157 L288 160 L345 160"} stroke="#d99270" strokeWidth="16" fill="none" strokeLinecap="round"/>
      </g>}
      <g>
        <circle cx="422" cy="54" r="22" fill="url(#patientShade)" stroke="#bd795c" strokeWidth="2"/>
        <path d="M398 80 Q420 74 445 81 L457 154 L396 154Z" fill="url(#scrubs)" stroke="#24496d" strokeWidth="2"/>
        <path d="M409 151 L404 236 M442 151 L450 236" stroke="#243e62" strokeWidth="19" fill="none" strokeLinecap="round"/>
        <path d={isWrist?"M402 104 L327 112 L220 116 M444 103 L346 128 L231 117":isNeck?"M401 104 L344 74 L168 66 M444 103 L339 89 L172 72":isShoulder?"M401 107 L328 98 L163 109 M445 105 L351 126 L183 114":isHip?"M402 107 L343 119 L248 125 M445 108 L347 146 L256 132":"M402 107 L345 122 L283 122 M445 107 L358 151 L296 132"} stroke="url(#patientShade)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <circle cx={focus[0]} cy={focus[1]} r="21" fill="#fbbf24" fillOpacity=".25" stroke="#e59c16" strokeWidth="3" strokeDasharray="5 4"/>
      <path d={isLeg?"M287 114 L321 78":isShoulder?"M169 105 L169 64":isNeck?"M158 65 L171 85":isHip?"M245 121 L262 91":isWrist?"M216 110 L247 139":"M279 128 L311 119"} stroke="#e11d48" strokeWidth="4" fill="none" markerEnd="url(#forceArrow)"/>
      <rect x="15" y="12" width="166" height="29" rx="7" fill="#fff" stroke="#cbd5e1"/><text x="98" y="31" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a">Patient positioning</text>
      <rect x="360" y="12" width="164" height="29" rx="7" fill="#fff" stroke="#cbd5e1"/><text x="442" y="31" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a">Physiotherapist</text>
      <rect x="15" y="256" width="510" height="28" rx="7" fill="#fff" stroke="#cbd5e1"/><circle cx="29" cy="270" r="6" fill="#fbbf24" fillOpacity=".4" stroke="#e59c16"/><text x="43" y="274" fontSize="12" fill="#334155">Highlighted contact area</text><path d="M253 270 H280" stroke="#e11d48" strokeWidth="3" markerEnd="url(#forceArrow)"/><text x="290" y="274" fontSize="12" fill="#334155">Illustrative movement direction</text>
    </svg>
    <figcaption className="px-4 py-3 text-xs leading-5 text-slate-600">Schematic teaching illustration, not a clinical photograph. Use the exact written positioning and hand-placement instructions below; the image is not to scale.</figcaption>
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
          <Diagram type={t.diagram} name={t.name}/>
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
