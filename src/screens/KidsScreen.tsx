import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp, useLesson } from '../lib/app';
import * as K from '../content/preschool';
import { preschoolFollowups } from '../content/followups';
import { brand } from '../content/brand';
import { Drawing, PaperHouse, Pic, QuestionMark, Robot } from '../components/Art';
import { Followup, PicButton, SampleTag, SpeakButton } from '../components/ui';
import { to } from '../routes';

type Slot = keyof K.StoryPick;

export default function KidsScreen() {
  const { family } = useParams();
  const fam = K.families.find((f) => f.id === family);
  const { band, setBand } = useApp();
  useEffect(() => { if (band !== 'a4') setBand('a4'); }, [band, setBand]);
  const [round, setRound] = useState(0); // «جرّب من جديد» remounts the activity
  if (!fam) return <Navigate to={to.path('a4')} replace />;
  return (
    <>
      <section className="panel kidhead">
        <p className="eyebrow">٤–٦ سنوات · {fam.name}</p>
        <h1>{fam.id === 'story' ? 'نصنع قصة معاً' : fam.id === 'drawing' ? 'نرسم معاً' : fam.id === 'counting' ? 'نلعب ونعدّ' : 'نصنع بيتاً من الأشكال'}</h1>
        <p className="caregiver">للكبير المرافق: اقرأ بصوتك ودع الطفل يشير إلى الصورة. لا يحتاج النشاط إلى كتابة أو ميكروفون أو إنترنت.</p>
        <div className="row">
          <SpeakButton text={brand.kidWelcome} label="ترحيب فَطين" />
          <button type="button" onClick={() => setRound((r) => r + 1)}>↺ جرّب من جديد</button>
          <Link className="btn" to={to.path('a4')}>لعبة أخرى</Link>
        </div>
      </section>
      <div key={`${fam.id}-${round}`}>
        {fam.id === 'story' && <StoryBuilder />}
        {fam.id === 'drawing' && <DrawingGame />}
        {fam.id === 'counting' && <CountingGame />}
        {fam.id === 'shapes' && <ShapesGame />}
        <section className="panel">
          <h2>شنو نسأل بعدها؟</h2>
          <Followup s={preschoolFollowups[fam.id]} lessonKey={`kids-${fam.id}`} kid />
        </section>
      </div>
    </>
  );
}

const slotOrder: Slot[] = ['character', 'place', 'action'];
const slotTitle: Record<Slot, string> = { character: 'اختر حيواناً', place: 'اختر مكاناً', action: 'ماذا يفعل؟' };

function StoryBuilder() {
  const { practise, play, patchCoach } = useApp();
  const [pick, setPick] = useState<Partial<K.StoryPick>>({});
  const [story, setStory] = useState<{ pick: K.StoryPick; sentences: string[] } | null>(null);
  const [prev, setPrev] = useState<{ pick: K.StoryPick; sentences: string[] } | null>(null);
  const [changedSlot, setChangedSlot] = useState<Slot | null>(null);
  const [guess, setGuess] = useState<Slot | null>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const filled = slotOrder.filter((s) => pick[s]).length;
  const nextSlot = slotOrder.find((s) => !pick[s]);
  const complete = filled === 3;
  const built = complete ? K.buildStory(pick as K.StoryPick) : null;

  const material = {
    simpler: 'كل صورة تختارها تغيّر القصة.',
    example: 'اخترنا القطة وبستان النخيل، فصارت القصة عن قطة تمشي بين النخيل.',
    why: 'القصة تتغيّر لأننا قلنا لها: من، وأين، وماذا يفعل.',
    next: ['خلّينا نغيّر المكان ونشوف!', 'شنو لو الحيوان يغنّي؟', 'من بطل القصة؟'],
    hint: nextSlot ? `${slotTitle[nextSlot]}. أنا أشير لك عليه 👇` : story ? 'غيّر صورة واحدة، وشوف شنو يتغيّر بالقصة.' : 'اضغط «احكِ القصة».'
  };
  useLesson({ key: 'kids-story', title: 'قصة العصفور والمكان', kind: 'kids', material }, '/kids/story');
  useEffect(() => { patchCoach({ material }); }, [nextSlot, !!story]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = (s: Slot) => (s === 'character' ? K.storyCharacters : s === 'place' ? K.storyPlaces : K.storyActions);
  const choose = (s: Slot, id: string) => {
    play('click');
    const np = { ...pick, [s]: id };
    setPick(np);
    const label = list(s).find((x) => x.id === id)!.label;
    patchCoach({ lastChoice: label, lastCorrect: true });
    if (story && story.pick[s] !== id && slotOrder.every((x) => np[x])) {
      // One choice changed after the story was told: show the revised story.
      setPrev(story);
      const next = { pick: np as K.StoryPick, sentences: K.buildStory(np as K.StoryPick).sentences };
      setStory(next);
      setChangedSlot(s);
      setGuess(null);
      play('note');
    }
  };
  const tell = () => {
    if (!built) return;
    setStory({ pick: pick as K.StoryPick, sentences: built.sentences });
    practise('task', 'kids-story');
    play('chime');
    setTimeout(() => storyRef.current?.focus(), 0);
  };
  const changedIdx = changedSlot ? K.storyDependencies[changedSlot] : [];
  const actionLabel = (p: Partial<K.StoryPick>) => {
    const a = K.storyActions.find((x) => x.id === p.action);
    const c = K.storyCharacters.find((x) => x.id === p.character);
    return a ? (c?.gender === 'f' ? a.f : a.m) : '';
  };

  return (
    <>
      <section className="panel builder">
        <div className="builder-head">
          <QuestionMark lit={Math.round((filled / 3) * 5)} size={64} label={`اخترت ${filled} من 3`} />
          <div className="bubble learner request" aria-live="polite">
            <span className="who">طلبنا</span>
            <p className="pics">
              {slotOrder.map((s) => {
                const item = list(s).find((x) => x.id === pick[s]);
                return <span key={s} className={`slotchip ${item ? 'on' : ''}`}>{item ? <><Pic name={item.icon} size={34} />{s === 'action' ? actionLabel(pick) : item.label}</> : '؟'}</span>;
              })}
            </p>
            {built && <p className="reqtext">{built.request}</p>}
          </div>
        </div>
        {slotOrder.map((s) => (
          <div key={s} className={`slot ${nextSlot === s ? 'next' : ''}`}>
            <h2 className="slot-title">
              {nextSlot === s && <span className="pointer"><Robot state="hint" size={36} look={-1} /><span className="arrow" aria-hidden="true">👇</span></span>}
              {slotTitle[s]}
            </h2>
            <div className="kidchoices" role="group" aria-label={slotTitle[s]}>
              {list(s).map((x) => (
                <PicButton key={x.id} icon={x.icon} label={s === 'action' ? (K.storyCharacters.find((c) => c.id === pick.character)?.gender === 'f' ? (x as K.StoryAction).f : (x as K.StoryAction).m) : x.label} pressed={pick[s] === x.id} onClick={() => choose(s, x.id)} />
              ))}
            </div>
          </div>
        ))}
        <div className="row">
          {built && <SpeakButton text={built.request} label="اسمع الطلب" />}
          <button type="button" className="action big" disabled={!complete} onClick={tell}>📖 احكِ القصة</button>
          {!complete && <span className="sub">اختر صورة من كل صف.</span>}
        </div>
      </section>

      {story && (
        <section className="panel story" aria-labelledby="story-h">
          <h2 id="story-h">القصة <SampleTag /></h2>
          <div className="story-card" ref={storyRef} tabIndex={-1}>
            <div className="story-pics" aria-hidden="true">
              <Pic name={K.storyPlaces.find((p) => p.id === story.pick.place)!.icon} size={92} />
              <Pic name={K.storyCharacters.find((c) => c.id === story.pick.character)!.icon} size={92} />
              <Pic name={K.storyActions.find((a) => a.id === story.pick.action)!.icon} size={64} />
            </div>
            <ol className="sentences">
              {story.sentences.map((t, i) => <li key={i + t} className={prev && changedIdx.includes(i) ? 'changed' : ''}>{t}{prev && changedIdx.includes(i) && <span className="sr-only"> (تغيّرت)</span>}</li>)}
            </ol>
            <SpeakButton text={story.sentences.join(' ')} label="اسمع القصة" />
          </div>
          {!prev && <p className="caregiver">👆 الآن غيّر صورة واحدة فوق، وشوف شنو يصير بالقصة.</p>}
          {prev && changedSlot && (
            <div className="whatchanged">
              <details><summary>القصة السابقة</summary><ol>{prev.sentences.map((t, i) => <li key={i}>{t}</li>)}</ol></details>
              <h3>شنو تغيّر؟</h3>
              <div className="kidchoices" role="group" aria-label="شنو تغيّر؟">
                {slotOrder.map((s) => (
                  <PicButton key={s} icon={K.slotLabels[s].icon} label={K.slotLabels[s].label} pressed={guess === s} big={false}
                    onClick={() => { setGuess(s); if (s === changedSlot) { practise('followup', 'kids-story'); play('chime'); } else play('soft'); patchCoach({ lastChoice: K.slotLabels[s].label, lastCorrect: s === changedSlot }); }} />
                ))}
              </div>
              {guess && (
                <p className={`feedback ${guess === changedSlot ? 'ok' : 'retry'}`} role="status">
                  {guess === changedSlot
                    ? <>أحسنت! غيّرنا {K.slotLabels[changedSlot].label}، فتغيّر الكلام الملوّن في القصة. <Robot state="feedback" size={30} /></>
                    : 'لنقرأ الجملة الملوّنة مرة ثانية. ماذا صار مختلفاً؟'}
                </p>
              )}
              <p className="caregiver">{changedSlot === 'place' ? K.caregiverCue : `اسأله: شنو تغيّر بالقصة من غيّرنا ${K.slotLabels[changedSlot].label}؟`}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function useKidChoice<T extends string>(initial: Record<string, T | undefined>) {
  const [v, setV] = useState(initial);
  const [changes, setChanges] = useState(0);
  const set = (k: string, val: T) => setV((o) => { if (o[k] && o[k] !== val) setChanges((c) => c + 1); return { ...o, [k]: val }; });
  return [v, set, changes] as const;
}

function DrawingGame() {
  const { practise, play } = useApp();
  const [v, set, changes] = useKidChoice<string>({ obj: undefined, color: undefined, size: undefined });
  const ready = v.obj && v.color && v.size;
  const out = ready ? K.drawingSteps(v.obj!, v.color!, v.size!) : null;
  useLesson({ key: 'kids-drawing', title: 'نرسم معاً', kind: 'kids', material: { simpler: 'اختر ماذا نرسم، وبأي لون، وكم حجمه.', example: 'نخلة خضراء كبيرة.', why: 'اللون والحجم يغيّران الرسمة.', next: ['شنو لو نغيّر اللون؟', 'نخليها صغيرة؟'] } }, '/kids/drawing');
  useEffect(() => { if (ready) { practise('task', 'kids-drawing'); play('note'); } }, [ready, v.obj, v.color, v.size, practise, play]);
  return (
    <section className="panel builder">
      <QuestionMark lit={[v.obj, v.color, v.size].filter(Boolean).length + (ready ? 2 : 0)} size={56} />
      <h2>ماذا نرسم؟</h2>
      <div className="kidchoices">{K.drawObjects.map((o) => <PicButton key={o.id} icon={o.icon} label={o.label} pressed={v.obj === o.id} onClick={() => set('obj', o.id)} />)}</div>
      <h2>بأي لون؟</h2>
      <div className="kidchoices">{K.drawColors.map((o) => <button key={o.id} type="button" className="picbtn" aria-pressed={v.color === o.id} onClick={() => set('color', o.id)}><span className="swatch" style={{ background: o.hex }} aria-hidden="true" /><b>{o.label}</b></button>)}</div>
      <h2>كم حجمها؟</h2>
      <div className="kidchoices">{K.drawSizes.map((o) => <button key={o.id} type="button" className="picbtn" aria-pressed={v.size === o.id} onClick={() => set('size', o.id)}><span className={`sizebox ${o.id}`} aria-hidden="true" /><b>{o.label}</b></button>)}</div>
      {out && (
        <div className="outcome">
          <Drawing obj={v.obj!} color={K.drawColors.find((c) => c.id === v.color)!.hex} big={v.size === 'big'} />
          <div>
            <p className="reqtext">{out.request}</p>
            <ol>{out.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <SpeakButton text={out.steps.join(' ')} label="اسمع الخطوات" />
            <p className="caregiver">{changes ? 'اسأله: شنو تغيّر بالرسمة من غيّرنا اختيارنا؟' : 'غيّرا اللون أو الحجم، وشوفا الرسمة تتغيّر.'}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function CountingGame() {
  const { practise, play } = useApp();
  const [v, set] = useKidChoice<string>({ item: undefined, n: undefined });
  const [ans, setAns] = useState<number | null>(null);
  const n = v.n ? Number(v.n) : 0;
  const it = K.countItems.find((x) => x.id === v.item);
  useLesson({ key: 'kids-counting', title: 'نلعب ونعدّ', kind: 'kids', material: { simpler: 'نعدّ الأشياء بإصبعنا.', example: 'ثلاث تمرات: واحد، اثنان، ثلاثة.', why: 'نغطي واحدة فيبقى أقل بواحد.', next: ['شنو لو صارت خمسة؟', 'نعدّ كرات بدل التمر؟'] } }, '/kids/counting');
  useEffect(() => setAns(null), [v.item, v.n]);
  const options = useMemo(() => (n ? [n - 1, n, n + 1] : []), [n]);
  return (
    <section className="panel builder">
      <h2>ماذا نعدّ؟</h2>
      <div className="kidchoices">{K.countItems.map((o) => <button key={o.id} type="button" className="picbtn big" aria-pressed={v.item === o.id} onClick={() => { play('click'); set('item', o.id); }}><span className="emoji" aria-hidden="true">{o.icon}</span><b>{o.label}</b></button>)}</div>
      <h2>كم واحدة؟</h2>
      <div className="kidchoices">{K.countNumbers.map((c) => <button key={c} type="button" className="picbtn" aria-pressed={v.n === String(c)} onClick={() => { play('click'); set('n', String(c)); }}><span className="emoji" aria-hidden="true">{K.arabicDigits(c)}</span><b>{'●'.repeat(c)}</b></button>)}</div>
      {it && n > 0 && (
        <div className="outcome count">
          <p className="reqtext">العب معي لعبة عدّ فيها {K.countPhrase(it.id, n)}.</p>
          <p className="items" aria-label={K.countPhrase(it.id, n)}>{Array.from({ length: n }, (_, i) => <span key={i} className={i === n - 1 ? 'covered' : ''} aria-hidden="true">{it.icon}</span>)}</p>
          <p><b>هذه {K.countPhrase(it.id, n)}. غطِّ واحدة بإصبعك. كم بقي؟</b></p>
          <div className="kidchoices">{options.map((o) => <button key={o} type="button" className="picbtn" aria-pressed={ans === o} onClick={() => { setAns(o); if (o === n - 1) { practise('verify', 'kids-counting'); play('chime'); } else play('soft'); }}><span className="emoji" aria-hidden="true">{K.arabicDigits(o)}</span><b>{K.countPhrase(it.id, o)}</b></button>)}</div>
          {ans !== null && <p className={`feedback ${ans === n - 1 ? 'ok' : 'retry'}`} role="status">{ans === n - 1 ? `أحسنت! بقي ${K.countPhrase(it.id, n - 1)}. أرجع الواحدة وعدّ من البداية.` : 'عدّ الظاهر فقط، واحدة واحدة. جرّب مرة ثانية.'}</p>}
          <SpeakButton text={`هذه ${K.countPhrase(it.id, n)}. غطِّ واحدة بإصبعك. كم بقي؟`} label="اسمع اللعبة" />
          <p className="caregiver">اسأله: شنو تغيّر باللعبة من غيّرنا العدد؟</p>
        </div>
      )}
    </section>
  );
}

function ShapesGame() {
  const { practise, play } = useApp();
  const [v, set, changes] = useKidChoice<string>({ base: undefined, roof: undefined, extra: undefined });
  const ready = v.base && v.roof && v.extra;
  const d = ready ? K.shapeDescription(v.base!, v.roof!, v.extra!) : null;
  useLesson({ key: 'kids-shapes', title: 'نصنع بيتاً من الأشكال', kind: 'kids', material: { simpler: 'نختار جداراً وسقفاً وشيئاً نضيفه.', example: 'مربّع ومثلّث وباب.', why: 'كل شكل نختاره يغيّر البيت.', next: ['شنو لو السقف نصف دائرة؟', 'نضيف نخلة جنب البيت؟'] } }, '/kids/shapes');
  useEffect(() => { if (ready) { practise('task', 'kids-shapes'); play('note'); } }, [ready, v.base, v.roof, v.extra, practise, play]);
  const row = (k: string, title: string, items: { id: string; label: string; icon: string }[]) => (
    <><h2>{title}</h2><div className="kidchoices">{items.map((o) => <button key={o.id} type="button" className="picbtn" aria-pressed={v[k] === o.id} onClick={() => { play('click'); set(k, o.id); }}><span className="emoji" aria-hidden="true">{o.icon}</span><b>{o.label}</b></button>)}</div></>
  );
  return (
    <section className="panel builder">
      {row('base', 'الجدار', K.shapeBases)}
      {row('roof', 'السقف', K.shapeRoofs)}
      {row('extra', 'نضيف', K.shapeExtras)}
      {d && (
        <div className="outcome">
          <PaperHouse base={v.base!} roof={v.roof!} extra={v.extra!} />
          <div>
            <p className="reqtext">{d.request}</p>
            <ol>{d.lines.map((l) => <li key={l}>{l}</li>)}</ol>
            <SpeakButton text={d.lines.join(' ')} label="اسمع الخطوات" />
            <p className="caregiver">{changes ? 'اسأله: شنو تغيّر بالبيت من غيّرنا الشكل؟' : 'غيّرا السقف أو الجدار، وشوفا البيت يتغيّر.'}</p>
          </div>
        </div>
      )}
    </section>
  );
}
