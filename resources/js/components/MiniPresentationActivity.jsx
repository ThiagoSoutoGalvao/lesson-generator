import { useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';

const TITLE_SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const STEP_SIZES  = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];

// Mini presentation (production): a topic and a speaking structure. "Prepare" gives a notes box per step;
// "Present" hides the notes and shows only the structure. A suggested length, never a timer — removing
// time pressure is a standing rule in this app (DET Practice).
export default function MiniPresentationActivity(props) {
    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.topics}
            label="Mini presentation"
            itemNoun="Topic"
            nextLabel="Next topic"
            renderItem={(topic, i) => <PresentationCard topic={topic} index={i} minutes={props.activity.minutes ?? 2} />}
        />
    );
}

function PresentationCard({ topic, index, minutes }) {
    const [presenting, setPresenting] = useState(false);
    const [notes, setNotes] = useState({});
    const { sizeIdx, textColor } = useDisplay();
    const seg = on => `px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${on ? 'bg-[#e0521f] text-white' : 'text-white/70 hover:text-white'}`;

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-white/55 text-xs font-bold tracking-[0.12em]">PRESENT · ABOUT {minutes} {minutes === 1 ? 'MINUTE' : 'MINUTES'} · NO TIMER</p>
                    <h2 className={`${TITLE_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{topic.title}</h2>
                </div>
                <div className="flex gap-1 bg-black/30 border border-white/15 rounded-xl p-1" role="group" aria-label="Mode">
                    <button type="button" aria-pressed={!presenting} onClick={() => setPresenting(false)} className={seg(!presenting)}>Prepare</button>
                    <button type="button" aria-pressed={presenting} onClick={() => setPresenting(true)} className={seg(presenting)}>Present</button>
                </div>
            </div>

            {presenting ? (
                <>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" aria-label="Presentation structure">
                        {topic.steps.map((st, i) => (
                            <li key={i} className="rounded-2xl bg-black/30 border border-white/15 px-5 py-4 flex flex-col gap-1.5">
                                <span className="w-9 h-9 rounded-full bg-white/15 text-white font-bold grid place-items-center">{i + 1}</span>
                                <span className={`${STEP_SIZES[sizeIdx]} font-semibold ${textColor}`}>{st.name}</span>
                                {st.hint && <span className="text-white/65 text-base">{st.hint}</span>}
                            </li>
                        ))}
                    </ol>
                    <p className="text-white/60 text-base">Notes are hidden while presenting — speak from the structure.</p>
                </>
            ) : (
                <ol className="flex flex-col gap-3" aria-label="Prepare your notes">
                    {topic.steps.map((st, i) => (
                        <li key={i} className="rounded-2xl bg-black/30 border border-white/15 px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
                            <div className="md:w-56 shrink-0">
                                <p className="text-white font-bold text-lg">{i + 1} · {st.name}</p>
                                {st.hint && <p className="text-white/60 text-sm">{st.hint}</p>}
                            </div>
                            <label className="sr-only" htmlFor={`notes-${index}-${i}`}>{st.name} notes</label>
                            <input
                                id={`notes-${index}-${i}`}
                                value={notes[i] ?? ''}
                                onChange={e => setNotes(n => ({ ...n, [i]: e.target.value }))}
                                placeholder="A few words, not sentences"
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
