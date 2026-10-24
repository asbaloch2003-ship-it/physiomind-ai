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

  {name:"Upper Limb Neurodynamic Test 1 (ULNT1 — Median Bias)",region:"Neurodynamic",purpose:"Assess upper-limb neural mechanosensitivity with a median-nerve-biased sequence.",patient:"Supine, head and neck supported, shoulder near table edge; explain that testing stops at tolerable symptoms.",therapist:"Stand beside the tested arm. Support the shoulder girdle, elbow, wrist and hand; avoid forceful depression.",steps:["Gently stabilize/depress the shoulder girdle as tolerated and abduct the shoulder.","Supinate the forearm, extend the wrist and fingers, then gradually externally rotate the shoulder.","Slowly extend the elbow within tolerance.","Use gentle contralateral and ipsilateral cervical side-flexion as structural differentiation while holding limb position."],positive:"Reproduction of familiar symptoms with a meaningful change on structural differentiation and/or relevant side-to-side asymmetry; stretching alone is insufficient.",meaning:"May indicate altered neural mechanosensitivity, not proof of median neuropathy or cervical radiculopathy.",caution:"Stop for severe pain, progressive weakness, new neurological signs or marked irritability; avoid aggressive sustained tension.",diagram:"arm"},
  {name:"Upper Limb Neurodynamic Test 2A (ULNT2A — Median Bias)",region:"Neurodynamic",purpose:"Alternative median-nerve-biased upper-limb neurodynamic sequence.",patient:"Supine near the edge of the plinth, arm initially supported at the side.",therapist:"Stand at the test side, supporting the arm while controlling shoulder girdle, elbow and wrist.",steps:["Gently depress the shoulder girdle and extend the elbow as tolerated.","Externally rotate the shoulder and supinate the forearm.","Extend the wrist and fingers.","Gradually abduct the shoulder, then use gentle neck side-flexion to differentiate neural from local tissue symptoms."],positive:"Familiar symptoms that vary with sensitizing or easing movements and differ meaningfully from the opposite side.",meaning:"Supports neural mechanosensitivity in the clinical context; does not independently localize a lesion.",caution:"Sequences vary across teaching systems; do not force end-range positions.",diagram:"arm"},
  {name:"Upper Limb Neurodynamic Test 2B (ULNT2B — Radial Bias)",region:"Neurodynamic",purpose:"Assess upper-limb mechanosensitivity using a radial-nerve-biased sequence.",patient:"Supine near plinth edge with arm supported.",therapist:"Stand alongside; control shoulder depression, elbow extension and forearm/hand position.",steps:["Gently depress the shoulder girdle.","Extend the elbow, internally rotate the shoulder and pronate the forearm.","Flex the wrist, fingers and thumb with appropriate ulnar deviation as tolerated.","Gradually abduct the shoulder and use gentle cervical side-flexion for structural differentiation."],positive:"Reproduction of familiar radial-sided arm symptoms with symptom modulation during differentiation.",meaning:"May suggest neural mechanosensitivity but does not diagnose radial nerve entrapment.",caution:"Avoid strong shoulder traction or forced wrist positioning.",diagram:"arm"},
  {name:"Upper Limb Neurodynamic Test 3 (ULNT3 — Ulnar Bias)",region:"Neurodynamic",purpose:"Assess upper-limb neural mechanosensitivity with an ulnar-nerve-biased sequence.",patient:"Supine, shoulder and arm supported.",therapist:"Stand at tested side and guide wrist, elbow and shoulder without force.",steps:["Extend the wrist and fingers with forearm pronation as tolerated.","Flex the elbow and externally rotate the shoulder.","Gradually abduct the shoulder, bringing the hand toward the ear or face without forcing the position.","Use gentle cervical side-flexion to check structural differentiation."],positive:"Familiar ulnar-sided symptoms that change with structural differentiation; isolated local stretch is not enough.",meaning:"May support neural mechanosensitivity, not a definitive ulnar neuropathy diagnosis.",caution:"Use caution with irritable cubital tunnel symptoms and avoid sustained elbow flexion if provocative.",diagram:"arm"},
  {name:"Slump Test",region:"Neurodynamic",purpose:"Assess neural mechanosensitivity in the spinal and lower-limb neural system.",patient:"Sit near the edge of the plinth, hands behind back if comfortable, feet unsupported or supported as needed.",therapist:"Stand beside the patient to guard balance and guide spinal, neck and leg movement.",steps:["Ask the patient to gently slump through the thoracic and lumbar spine.","Add cervical flexion if tolerated.","Extend one knee and then dorsiflex the ankle as tolerated.","Ease cervical flexion or ankle dorsiflexion to determine whether familiar symptoms change."],positive:"Familiar leg symptoms reproduced and meaningfully modified by structural differentiation, not hamstring stretch alone.",meaning:"Suggests neural mechanosensitivity but cannot establish the exact cause.",caution:"Screen for cauda equina symptoms, progressive neurological deficit, severe irritability and recent trauma; stop if symptoms escalate.",diagram:"leg"},
  {name:"Straight Leg Raise with Structural Differentiation",region:"Neurodynamic",purpose:"Assess sciatic-system mechanosensitivity with a sensitizing/easing movement.",patient:"Supine with pelvis level and opposite leg relaxed.",therapist:"Stand at tested side, support the heel and maintain comfortable knee extension.",steps:["Slowly flex the hip with knee extended until familiar symptoms or first resistance.","Record symptom location and approximate hip angle.","At a fixed hip position, gently add or release ankle dorsiflexion to observe symptom change.","Compare sides and distinguish radiating symptoms from local hamstring stretch."],positive:"Familiar radiating leg symptoms altered by ankle movement or another structural differentiator.",meaning:"May support neural involvement in conjunction with neurological screening and history.",caution:"Do not aggressively provoke radiating pain; screen urgent neurological red flags.",diagram:"leg"},
  {name:"Crossed Straight Leg Raise",region:"Neurodynamic",purpose:"Assess whether raising the unaffected leg reproduces contralateral radicular symptoms.",patient:"Supine with both legs relaxed.",therapist:"Stand beside the leg without primary symptoms; support heel and knee.",steps:["Gently elevate the asymptomatic leg with knee extended.","Observe whether familiar symptoms develop in the opposite symptomatic leg.","Stop when symptoms are reproduced; document distribution and angle."],positive:"Raising the less symptomatic leg reproduces familiar radiating pain in the opposite leg.",meaning:"May support lumbar disc-related nerve-root irritation in an appropriate clinical presentation; not diagnostic alone.",caution:"Avoid repeated strong provocation and refer urgent progressive neurological findings.",diagram:"leg"},
  {name:"Prone Knee Bend / Femoral Nerve Stretch",region:"Neurodynamic",purpose:"Assess anterior-thigh neural mechanosensitivity with a femoral-nerve-biased movement.",patient:"Prone with pelvis supported; pillow under abdomen if needed.",therapist:"Stand beside the tested leg, support ankle and control knee flexion and hip position.",steps:["Gently flex the knee while the hip remains near neutral.","If appropriate, add a small amount of hip extension without excessive lumbar extension.","Compare anterior thigh symptoms and range side to side.","Ease knee flexion or change neck position only if clinically appropriate to help interpret symptoms."],positive:"Reproduction of familiar anterior thigh radiating symptoms rather than quadriceps stretch alone.",meaning:"May suggest femoral nerve or upper lumbar neural mechanosensitivity; further assessment is required.",caution:"Avoid in acute knee injury, significant hip pain or severe lumbar irritability.",diagram:"leg"},
  {name:"Seated Knee Extension Neurodynamic Screen",region:"Neurodynamic",purpose:"Gentle functional screen of neural symptom behavior during seated knee extension.",patient:"Sit upright with hips and knees flexed, feet initially supported.",therapist:"Sit or stand beside patient, observing posture and symptoms.",steps:["Record baseline leg symptoms in comfortable sitting.","Slowly extend one knee with the trunk upright.","If appropriate, compare symptoms with ankle dorsiflexion and slight change in spinal posture.","Compare both sides and document symptom distribution."],positive:"Familiar symptoms that change with neural sensitizing/easing movements, beyond normal muscle stretch.",meaning:"A screening maneuver rather than a standardized stand-alone diagnostic test.",caution:"Do not force knee extension or use with unstable sitting balance.",diagram:"leg"},
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

const posterIndex: Record<string, number> = {
  "Lachman Test": 0, "McMurray Test": 1, "Neer Test": 2,
  "Hawkins–Kennedy Test": 3, "Straight Leg Raise": 4,
  "Phalen Test": 5, "Thomas Test": 6, "Spurling Test": 7,
};
function PosterPanel({name}:{name:string}) {
  const index = posterIndex[name];
  if (index === undefined) return null;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return <figure className="overflow-hidden rounded-xl border bg-white shadow-sm">
    <div className="border-b bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">{name} — illustrated clinical guide</div>
    <div role="img" aria-label={name+" educational infographic showing positioning, procedure, positive and negative examples"}
      className="w-full"
      style={{
        aspectRatio: "3 / 4",
        backgroundImage: "url('/special-tests-complete.png.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "400% 200%",
        backgroundPosition: (col*100/3)+"% "+(row*100)+"%",
      }}/>
    <figcaption className="px-4 py-3 text-xs leading-5 text-slate-600">AI-generated illustration: may contain incorrect anatomy, text or test technique. Use the written guide below and verify with a qualified clinical instructor.</figcaption>
  </figure>;
}

const neuroPosterIndex: Record<string, number> = {
  "Upper Limb Neurodynamic Test 1 (ULNT1 — Median Bias)": 0,
  "Upper Limb Neurodynamic Test 2A (ULNT2A — Median Bias)": 1,
  "Upper Limb Neurodynamic Test 2B (ULNT2B — Radial Bias)": 2,
  "Upper Limb Neurodynamic Test 3 (ULNT3 — Ulnar Bias)": 3,
  "Slump Test": 4,
  "Straight Leg Raise with Structural Differentiation": 5,
  "Crossed Straight Leg Raise": 6,
  "Prone Knee Bend / Femoral Nerve Stretch": 7,
  "Seated Knee Extension Neurodynamic Screen": 8,
};
function NeurodynamicPoster({name}:{name:string}) {
  const index = neuroPosterIndex[name];
  if (index === undefined) return null;
  const top = index < 4;
  const column = top ? index : index - 4;
  const columns = top ? 4 : 5;
  return <figure className="overflow-hidden rounded-xl border bg-white shadow-sm">
    <div className="border-b bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">{name} — illustrated reference</div>
    <div role="img" aria-label={name+" AI-generated infographic panel showing illustrated sitting and lying variations and positive and negative findings"}
      className="w-full"
      style={{
        aspectRatio: top ? "0.78" : "0.67",
        backgroundImage: "url('/neurodynamic-tests.png.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: (columns*100)+"% 200%",
        backgroundPosition: (column*100/(columns-1))+"% "+(top?"0%":"100%"),
      }}/>
    <figcaption className="px-4 py-3 text-xs leading-5 text-slate-600">AI-generated poster, not a validated clinical demonstration. Some illustrated sitting or lying variants may not be standard, and anatomy, labels or positive/negative findings may be incorrect. Follow the written procedure below and qualified clinical instruction.</figcaption>
  </figure>;
}

function Page() {
  const [region,setRegion]=useState("All");
  const [opened,setOpened]=useState<string|null>(null);
  const list=tests.filter(t=>region==="All"||t.region===region);
  return <>
    <PageHeader eyebrow="Clinical skills library" title="Physiotherapy Special Tests" desc="Explore orthopaedic and neurodynamic assessments with patient and therapist positions, step-by-step technique, positive findings, structural differentiation and safety considerations." />
    <Container>
      <div className="mb-7 flex flex-wrap gap-2">{regions.map(x=><button key={x} type="button" onClick={()=>{setRegion(x);setOpened(null)}} className={`rounded-full px-4 py-2 text-sm font-medium ${region===x?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground hover:bg-primary-soft"}`}>{x}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{list.map(t=><Card key={t.name} className="!rounded-xl">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{t.name}</h2><p className="mt-1 text-sm text-muted-foreground">{t.purpose}</p></div><Tag>{t.region}</Tag></div>
        <button type="button" aria-expanded={opened===t.name} onClick={()=>setOpened(opened===t.name?null:t.name)} className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-left text-sm font-semibold text-primary-foreground">{opened===t.name?"− Close detailed guide":"+ Open detailed guide"}</button>
        {opened===t.name&&<div className="mt-5 space-y-4 text-sm leading-6">
          {t.region === "Neurodynamic" ? <NeurodynamicPoster name={t.name}/> : <PosterPanel name={t.name}/> }
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
