import { useEffect, useState } from 'react';
import axios from 'axios';
import ActivityRenderer from '@/components/ActivityRenderer';
import { readLiveStudent, writeLiveStudent } from '@/components/UseItChecklist';
import { useFullscreen } from '@/hooks/useFullscreen';
import { STAGES } from '@/lib/stages';
import { TYPE_LABELS } from '@/lib/trilhas';

// Lesson mode — "Teach now" (Aurora Lessons Phase 1, step 6). Plays a lesson pack's placed activities in
// stage order (Warmer → Presentation → Practice → Production): an "Up next" screen, the activity fullscreen,
// back to "Up next" for the following one, then "Lesson complete". The whole lesson is listed on the side
// and any item can be jumped to. "Who's this with?" is asked once and shared with every "Use it!" checklist
// through the same sessionStorage the checklist uses. During an activity a small "Next activity" pill (md+)
// moves on without closing first. Fullscreen is document-wide, so it carries across activities.

const GRADIENT = 'linear-gradient(135deg, #1a1033 0%, #2a1560 45%, #4a1a5c 100%)';
const STAGE_ORDER = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));
const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.key, s.label]));

export function lessonSequence(activities) {
    return activities
        .filter(a => a.stage && STAGE_ORDER[a.stage] !== undefined)
        .sort((a, b) => (STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]) || (a.id - b.id));
}

export default function LessonPlayer({ title, items, skipped = 0, focusOf, onExit, onTargetsChange }) {
    const [index, setIndex]   = useState(0);
    const [phase, setPhase]   = useState('intro'); // intro | activity | done
    const [done, setDone]     = useState(() => new Set());
    const [students, setStudents] = useState([]);
    const [student, setStudent]   = useState(readLiveStudent);
    // The pill floats over whatever the activity draws at the bottom-left; it can shrink to a small button.
    const [pillSmall, setPillSmall] = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    useEffect(() => {
        axios.get('/api/students').then(({ data }) => setStudents(data.filter(s => s.is_active !== false))).catch(() => null);
    }, []);

    const current = items[index];

    // Moves on to the next activity. Only an activity that was actually run is ticked — a skipped one stays ○.
    function advance(markDone) {
        if (markDone) setDone(prev => new Set(prev).add(current.id));
        if (index + 1 >= items.length) setPhase('done');
        else { setIndex(i => i + 1); setPhase('intro'); }
    }
    const finishCurrent = () => advance(true);

    function jump(i) {
        setIndex(i);
        setPhase('intro');
    }

    function exit() {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => null);
        onExit();
    }

    function pickStudent(e) {
        const s = students.find(x => String(x.id) === e.target.value);
        const live = s ? { id: s.id, name: s.name } : null;
        setStudent(live);
        writeLiveStudent(live);
    }

    if (phase === 'activity' && current) {
        return (
            <>
                <ActivityRenderer
                    key={current.id}
                    content={current.content}
                    savedId={current.id}
                    onClose={finishCurrent}
                    onTargetsChange={targets => onTargetsChange?.(current.id, targets)}
                />
                {pillSmall ? (
                    <button type="button" onClick={() => setPillSmall(false)} aria-label="Show the lesson controls"
                        className="hidden md:grid fixed bottom-4 left-4 z-[60] place-items-center w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white text-lg opacity-60 hover:opacity-100 cursor-pointer">
                        ›
                    </button>
                ) : (
                <div className="hidden md:flex fixed bottom-4 left-4 z-[60] items-center gap-2 rounded-full bg-black/60 border border-white/20 backdrop-blur-md pl-1.5 pr-1.5 py-1.5 text-white text-sm shadow-lg opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity" role="group" aria-label="Lesson mode">
                    <button type="button" onClick={() => setPillSmall(true)} aria-label="Make the lesson controls smaller"
                        className="w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer">‹</button>
                    <span className="text-white/70">{STAGE_LABEL[current.stage]} · {index + 1} / {items.length}</span>
                    <button type="button" onClick={() => setPhase('intro')} className="px-3 py-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">Overview</button>
                    <button type="button" onClick={finishCurrent} className="px-4 py-1.5 rounded-full bg-[#e0521f] hover:bg-[#c9461a] font-semibold cursor-pointer">
                        {index + 1 >= items.length ? 'Finish lesson' : 'Next activity →'}
                    </button>
                </div>
                )}
            </>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col text-white" style={{ background: GRADIENT }}>
            <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 sm:px-8 py-4">
                <span className="text-[11px] font-bold tracking-[0.12em] text-[#ffb59a] bg-[#e0521f]/20 px-2.5 py-1 rounded-full">LESSON MODE</span>
                <h1 className="font-display text-lg font-semibold flex-1 min-w-0 truncate">{title}</h1>
                <button type="button" onClick={toggleFullscreen} className="text-white/60 hover:text-white text-sm cursor-pointer">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
                <button type="button" onClick={exit} className="text-white/80 hover:text-white text-sm border border-white/25 rounded-lg px-3 py-1.5 cursor-pointer">Exit lesson</button>
            </header>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 px-6 sm:px-8 pb-8 overflow-y-auto md:overflow-hidden">
                <main className="shrink-0 md:shrink md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col items-center justify-start md:pt-10">
                    {phase === 'done' ? (
                        <div className="text-center flex flex-col items-center gap-5 py-10">
                            <h2 className="text-5xl font-bold">Lesson complete</h2>
                            <p className="text-white/70 text-lg">{done.size} of {items.length} activities done{student ? ` with ${student.name}` : ''}.</p>
                            {student && <p className="text-white/55 text-sm max-w-md">Anything you saved from a “Use it!” checklist is on {student.name}’s Progress & Homework panel.</p>}
                            <button type="button" onClick={exit} autoFocus className="bg-[#e0521f] hover:bg-[#c9461a] text-white font-semibold px-8 py-3 rounded-xl text-lg cursor-pointer">Back to the lesson pack</button>
                        </div>
                    ) : current && (
                        <section aria-label="Up next" className="w-full max-w-2xl flex flex-col gap-6 py-6">
                            <p className="text-white/55 text-xs font-bold tracking-[0.14em]">
                                {index === 0 && done.size === 0 ? 'FIRST UP' : 'UP NEXT'} · {STAGE_LABEL[current.stage].toUpperCase()} · {index + 1} OF {items.length}
                            </p>
                            <div>
                                <p className="text-white/60 text-sm uppercase tracking-wide font-semibold">{TYPE_LABELS[current.type] ?? current.type}</p>
                                <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mt-1">{focusOf(current)}</h2>
                            </div>
                            {index === 0 && done.size === 0 && (
                                <label className="flex flex-col gap-1.5 text-sm text-white/70 max-w-xs">
                                    Who’s this lesson with?
                                    <select value={student ? String(student.id) : ''} onChange={pickStudent}
                                        className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-base cursor-pointer">
                                        <option value="" className="text-black bg-white">Nobody — don’t save ticks</option>
                                        {student && !students.some(s => s.id === student.id) && <option value={student.id} className="text-black bg-white">{student.name}</option>}
                                        {students.map(s => <option key={s.id} value={s.id} className="text-black bg-white">{s.name}</option>)}
                                    </select>
                                </label>
                            )}
                            <div className="flex flex-wrap gap-3">
                                <button type="button" autoFocus onClick={() => setPhase('activity')}
                                    className="bg-[#e0521f] hover:bg-[#c9461a] text-white font-semibold px-10 py-3.5 rounded-xl text-xl cursor-pointer">
                                    Start ▶
                                </button>
                                <button type="button" onClick={() => advance(false)}
                                    className="text-white/70 hover:text-white border border-white/20 px-5 py-3.5 rounded-xl cursor-pointer">
                                    Skip
                                </button>
                            </div>
                            {skipped > 0 && <p className="text-amber-200/80 text-sm">{skipped} {skipped === 1 ? 'activity has' : 'activities have'} no stage yet and {skipped === 1 ? 'isn’t' : 'aren’t'} in this lesson.</p>}
                        </section>
                    )}
                </main>

                <aside aria-label="The whole lesson" className="shrink-0 md:w-80 md:min-h-0 md:overflow-y-auto rounded-2xl bg-black/25 border border-white/12 p-4 flex flex-col gap-4">
                    {STAGES.map(st => {
                        const rows = items.map((a, i) => ({ a, i })).filter(({ a }) => a.stage === st.key);
                        return (
                            <div key={st.key}>
                                <p className="text-white/50 text-[11px] font-bold tracking-[0.12em] uppercase mb-1.5">{st.label}</p>
                                {rows.length === 0 ? (
                                    <p className="text-white/35 text-sm">—</p>
                                ) : (
                                    <ol className="flex flex-col gap-1">
                                        {rows.map(({ a, i }) => {
                                            const isDone = done.has(a.id);
                                            const isCurrent = i === index && phase !== 'done';
                                            return (
                                                <li key={a.id}>
                                                    <button type="button" onClick={() => jump(i)} aria-current={isCurrent ? 'step' : undefined}
                                                        className={`w-full text-left flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer ${isCurrent ? 'bg-white/12' : 'hover:bg-white/6'}`}>
                                                        <span className={`shrink-0 w-5 text-center font-bold ${isDone ? 'text-[#5be0a4]' : isCurrent ? 'text-[#ffb59a]' : 'text-white/35'}`}>{isDone ? '✓' : isCurrent ? '▶' : '○'}</span>
                                                        <span className="min-w-0">
                                                            <span className={`block text-sm leading-snug ${isDone ? 'text-white/55' : 'text-white'}`}>{focusOf(a)}</span>
                                                            <span className="block text-[11px] text-white/45">{TYPE_LABELS[a.type] ?? a.type}</span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </div>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
}
