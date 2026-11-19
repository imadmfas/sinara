import { useState } from 'react';
import { guideConcepts, levelFor } from '../content/guide';
import { useApp, useLesson } from '../lib/app';
import { SampleTag } from '../components/ui';

export default function GuideScreen() {
  const { band, practise } = useApp();
  const level = levelFor(band);
  useLesson({ key: 'guide', title: 'دليل البداية', kind: 'guide', material: {
    simpler: guideConcepts[0].text[level],
    example: guideConcepts[4].demo[level].choices[0].result,
    why: 'الذكاء الاصطناعي يقترح أنماطاً شائعة، وقد يخطئ بثقة. لذلك نتحقق.',
    next: ['كيف أتأكد من جواب فيه رقم؟', 'ما الفرق بين التعرّف والتوليد؟']
  } }, '/guide');
  return (
    <section className="panel">
      <h1>دليل البداية</h1>
      <p className="sub">خمسة مفاهيم، ولكل مفهوم تجربة قصيرة تناسب فئتك العمرية. التجارب أمثلة مكتوبة مسبقاً.</p>
      {guideConcepts.map((c) => <Concept key={c.id} c={c} level={level} onTry={() => c.id === 'check' && practise('verify', 'guide')} />)}
    </section>
  );
}

function Concept({ c, level, onTry }: { c: (typeof guideConcepts)[number]; level: ReturnType<typeof levelFor>; onTry: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const d = c.demo[level];
  return (
    <details className="concept">
      <summary><span aria-hidden="true">{c.icon}</span> {c.title}</summary>
      <p>{c.text[level]}</p>
      <div className="demo">
        <p><b>جرّب:</b> {d.prompt}</p>
        <div className="row">{d.choices.map((ch, i) => <button key={ch.label} type="button" aria-pressed={pick === i} onClick={() => { setPick(i); onTry(); }}>{ch.label}</button>)}</div>
        {pick !== null && <p className="bubble sample" role="status"><SampleTag /> {d.choices[pick].result}</p>}
      </div>
    </details>
  );
}
