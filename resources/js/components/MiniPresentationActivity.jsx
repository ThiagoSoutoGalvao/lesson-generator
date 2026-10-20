import { useEffect, useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';

const TITLE_SIZES   = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const SLIDE_SIZES   = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
const KEYWORD_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];

// Mini presentation (production): a topic and a speaking structure. "Prepare" gives a key-words box per step
// (steps can be moved up/down); "Present" shows one step at a time, big, with the student's key words — the
// presentation itself. A suggested length, never a timer — removing time pressure is a standing rule in this
// app (DET Practice). Notes and step order live here, per topic, so moving between topics keeps them.
export default function MiniPresentationActivity(props) {
    const [notes, setNotes] = useState({});   // { [topicIdx]: { [stepIdx]: 'key, words' } } — stepIdx = original index
    const [orders, setOrders] = useState({}); // { [topicIdx]: [original step indexes in display order] }

    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.topics}
            label="Mini presentation"
            itemNoun="Topic"
            nextLabel="Next topic"
            renderItem={(topic, i) => (
                <PresentationCard
                    topic={topic}
                    minutes={props.activity.minutes ?? 2}
                    notes={notes[i] ?? {}}
                    setNote={(step, value) => setNotes(n => ({ ...n, [i]: { ...n[i], [step]: value } }))}
                    order={orders[i] ?? topic.steps.map((_, s) => s)}
                    setOrder={list => setOrders(o => ({ ...o, [i]: list }))}
                    topicIndex={i}
                />
            )}
        />
    );
}

const keywordsOf = text => (text ?? '').split(/[,;\n]/).map(w => w.trim()).filter(Boolean);

function PresentationCard({ topic, minutes, notes, setNote, order, setOrder, topicIndex }) {
    const [presenting, setPresenting] = useState(false);
    const [slide, setSlide] = useState(0);
    const { sizeIdx, textColor } = useDisplay();
    const steps = order.map(s => ({ ...topic.steps[s], key: s }));
    const last = steps.length - 1;
    const seg = on => `px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${on ? 'bg-[#e0521f] text-white' : 'text-white/70 hover:text-white'}`;

    // While presenting, arrows / Space move between steps. Capture phase on window, so the shell's arrow keys
    // (next / previous topic) don't also fire.
    useEffect(() => {
        if (!presenting) return;
        function onKey(e) {
            const forward = e.code === 'ArrowRight' || e.code === 'Space';
            if (!forward && e.code !== 'ArrowLeft') return;
            e.preventDefault();
            e.stopPropagation();
            setSlide(s => forward ? Math.min(last, s + 1) : Math.max(0, s - 1));
        }
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [presenting, last]);

    function startPresenting() {
        setSlide(0);
        setPresenting(true);
    }

    function move(pos, delta) {
        const list = [...order];
        [list[pos], list[pos + delta]] = [list[pos + delta], list[pos]];
        setOrder(list);
    }

    const current = steps[slide];
    const words = current ? keywordsOf(notes[current.key]) : [];

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-white/55 text-xs font-bold tracking-[0.12em]">PRESENT · ABOUT {minutes} {minutes === 1 ? 'MINUTE' : 'MINUTES'} · NO TIMER</p>
                    <h2 className={`${TITLE_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{topic.title}</h2>
                </div>
                <div className="flex gap-1 bg-black/30 border border-white/15 rounded-xl p-1" role="group" aria-label="Mode">
                    <button type="button" aria-pressed={!presenting} onClick={() => setPresenting(false)} className={seg(!presenting)}>Prepare</button>
                    <button type="button" aria-pressed={presenting} onClick={startPresenting} className={seg(presenting)}>Present</button>
                </div>
            </div>

            {presenting ? (
                <section aria-label="Presentation" className="flex flex-col gap-5">
                    <ol className="flex flex-wrap gap-2" aria-label="Steps">
                        {steps.map((st, i) => (
                            <li key={st.key}>
                                <button
                                    type="button"
                                    onClick={() => setSlide(i)}
                                    aria-current={i === slide ? 'step' : undefined}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer border ${i === slide ? 'bg-white text-[#1e3a5f] border-white' : i < slide ? 'bg-white/20 text-white border-white/20' : 'text-white/60 border-white/20 hover:text-white'}`}
                                >
                                    {i + 1} · {st.name}
                                </button>
                            </li>
                        ))}
                    </ol>

                    <div className="rounded-3xl bg-black/30 border border-white/15 px-6 sm:px-10 py-8 sm:py-10 flex flex-col gap-6 min-h-[16rem]">
                        <p className="text-white/55 text-sm font-bold tracking-[0.12em]">STEP {slide + 1} OF {steps.length}</p>
                        <h3 className={`${SLIDE_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{current.name}</h3>
                        {words.length > 0 ? (
                            <ul className="flex flex-wrap gap-3" aria-label="Key words">
                                {words.map((w, k) => (
                                    <li key={k} className={`${KEYWORD_SIZES[sizeIdx]} font-semibold px-5 py-2.5 rounded-2xl bg-[#e0521f]/25 border border-[#fc6840]/50 ${textColor}`}>{w}</li>
                                ))}
                            </ul>
                        ) : current.hint ? (
                            <p className={`${KEYWORD_SIZES[sizeIdx]} text-white/80`}>{current.hint}</p>
                        ) : null}
                        {words.length > 0 && current.hint && <p className="text-white/55 text-base">{current.hint}</p>}
                    </div>

                    <div className="flex justify-center gap-3">
                        <button type="button" onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0} className="bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-2.5 rounded-xl text-base transition-colors cursor-pointer">← Previous step</button>
                        {slide < last ? (
                            <button type="button" onClick={() => setSlide(s => s + 1)} className="bg-[#e0521f] hover:bg-[#c94716] text-white font-semibold px-6 py-2.5 rounded-xl text-base transition-colors cursor-pointer">Next step →</button>
                        ) : (
                            <button type="button" onClick={() => setPresenting(false)} className="bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-2.5 rounded-xl text-base transition-colors cursor-pointer">Back to notes</button>
                        )}
                    </div>
                    <p className="text-white/50 text-sm text-center">← → or Space move between steps</p>
                </section>
            ) : (
                <ol className="flex flex-col gap-3" aria-label="Prepare your notes">
                    {steps.map((st, i) => (
                        <li key={st.key} className="rounded-2xl bg-black/30 border border-white/15 px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-start gap-3 md:w-64 shrink-0">
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${st.name} up`} className="w-7 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-default text-white text-xs cursor-pointer">▲</button>
                                    <button type="button" onClick={() => move(i, 1)} disabled={i === last} aria-label={`Move ${st.name} down`} className="w-7 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-default text-white text-xs cursor-pointer">▼</button>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white font-bold text-lg">{i + 1} · {st.name}</p>
                                    {st.hint && <p className="text-white/60 text-sm">{st.hint}</p>}
                                </div>
                            </div>
                            <label className="sr-only" htmlFor={`notes-${topicIndex}-${st.key}`}>{st.name} key words</label>
                            <input
                                id={`notes-${topicIndex}-${st.key}`}
                                value={notes[st.key] ?? ''}
                                onChange={e => setNote(st.key, e.target.value)}
                                placeholder="Key words, separated by commas"
                                autoComplete="off"
                                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-lg px-3 py-2.5 text-base"
                            />
                        </li>
                    ))}
                </ol>
            )}
        </>
    );
}
