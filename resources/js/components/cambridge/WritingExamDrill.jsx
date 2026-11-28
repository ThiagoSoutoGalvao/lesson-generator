import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePracticeBack } from '@/hooks/usePracticeBack';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import essayItems from '@/data/cambridge/b2/writingEssay.json';
import genreSets from '@/data/cambridge/b2/writingGenre.json';

// B2 First Writing — exam mode (2026-11-28). The one timed screen in the practice modes, and only because a student
// asked to practise "just like in the exam": 80 minutes for both parts, Part 1 the essay, Part 2 a choice of three
// tasks (a report always among them — what he is practising), 140–190 words each with a live count. Handing in saves
// both texts to the student's account (POST /api/student/writing) for the teacher to correct in class — no AI marking.
// The exam survives a reload or leaving the screen: it is kept on this device (localStorage) until handed in, and the
// clock runs from the start time, so it keeps going while the student is away, as in a real exam.

const LIMIT = 80 * 60;
const KEY = 'aurora.cambridge.writingExam.b2';
const PART2 = ['article', 'email', 'review']; // + report, always

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
export const countWords = t => (t.trim().match(/\S+/g) ?? []).filter(w => /[\p{L}\p{N}]/u.test(w)).length;

function essayPrompt(e) {
    return `${e.context}\n\n${e.question}\n\nNotes — write about:\n1. ${e.points[0]}\n2. ${e.points[1]}\n3. ……… (your own idea)`;
}

function newExam() {
    const e = rand(essayItems);
    const genres = shuffle(['report', ...shuffle(PART2).slice(0, 2)]);
    return {
        startedAt: Date.now(),
        essay: { task_id: e.id, prompt: essayPrompt(e) },
        part2: genres.map(id => {
            const g = genreSets.find(x => x.id === id);
            const it = rand(g.items);
            return { task_id: it.id, genre: g.genre, prompt: it.prompt, model: it.model ?? null };
        }),
        choice: null,
        text1: '',
        text2: '',
    };
}

const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return v?.startedAt ? v : null; } catch { return null; } };
const store = v => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* private mode: the exam still works, it just won't survive a reload */ } };
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const btn = 'px-6 py-3 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default';
const primary = `${btn} bg-[#e0521f] hover:bg-[#c9461a] text-white`;
const quiet = `${btn} bg-white/10 border border-white/20 hover:bg-white/20 text-white`;

function WordCount({ n }) {
    const cls = n === 0 ? 'text-white/40' : n < 140 ? 'text-amber-300' : n <= 190 ? 'text-emerald-300' : 'text-amber-300';
    const note = n === 0 ? '' : n < 140 ? ' · under 140' : n <= 190 ? ' · good length' : ' · over 190';
    return <span className={`text-sm font-semibold tabular-nums ${cls}`} data-testid="word-count">{n} words{note}</span>;
}

function TaskText({ text }) {
    return <p className="text-white/90 text-[17px] leading-relaxed whitespace-pre-line">{text}</p>;
}

function ModelAnswer({ text }) {
    return (
        <div className="rounded-2xl bg-white/95 text-[#1c1540] px-6 py-5 text-left" data-testid="model-answer">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9A3412] mb-3">Model answer — compare after you hand in</p>
            {text.split('\n\n').map((block, i) => {
                const [head, ...rest] = block.split('\n');
                return i === 0 && rest.length === 0
                    ? <p key={i} className="font-bold text-lg mb-3">{head}</p>
                    : <div key={i} className="mb-3">{rest.length ? <><p className="font-bold">{head}</p><p className="leading-relaxed">{rest.join(' ')}</p></> : <p className="leading-relaxed">{head}</p>}</div>;
            })}
        </div>
    );
}

export default function WritingExamDrill() {
    const navigate = useNavigate();
    const backTo = usePracticeBack({ path: '/practice', state: { tab: 'cambridge' } });
    const isStudent = typeof window !== 'undefined' && window.__AURORA_USER__?.role === 'student';

    const [exam, setExam] = useState(load);          // the exam in progress (kept on this device)
    const [phase, setPhase] = useState(() => (load() ? 'resume' : 'intro')); // intro | resume | writing | done
    const [tab, setTab] = useState(1);
    const [now, setNow] = useState(Date.now());
    const [confirming, setConfirming] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);      // { exam, seconds, timedOut, saved }

    const elapsed = exam ? Math.floor((now - exam.startedAt) / 1000) : 0;
    const left = Math.max(0, LIMIT - elapsed);

    useEffect(() => {
        if (phase !== 'writing') return undefined;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [phase]);

    useEffect(() => { if (phase === 'writing') store(exam); }, [exam, phase]);

    // Time's up: hand in what is there, like the exam room.
    useEffect(() => {
        if (phase === 'writing' && left === 0 && !sending) handIn(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [left, phase]);

    const update = patch => setExam(e => ({ ...e, ...patch }));
    const words1 = useMemo(() => countWords(exam?.text1 ?? ''), [exam?.text1]);
    const words2 = useMemo(() => countWords(exam?.text2 ?? ''), [exam?.text2]);
    const chosen = exam?.choice != null ? exam.part2[exam.choice] : null;

    function start() {
        const e = newExam();
        setExam(e); store(e); setNow(Date.now()); setTab(1); setResult(null); setError('');
        setPhase('writing');
    }

    async function handIn(timedOut = false) {
        if (!exam) return;
        setConfirming(false); setError('');
        const seconds = Math.min(LIMIT, Math.floor((Date.now() - exam.startedAt) / 1000));
        const parts = [{ part: 1, task_id: exam.essay.task_id, genre: 'Essay', prompt: exam.essay.prompt, text: exam.text1 }];
        if (chosen) parts.push({ part: 2, task_id: chosen.task_id, genre: chosen.genre, prompt: chosen.prompt, text: exam.text2 });
        if (isStudent) {
            setSending(true);
            try {
                await axios.post('/api/student/writing', { exam: 'b2-first', parts, seconds_used: seconds, timed_out: timedOut });
            } catch {
                setSending(false);
                setError('Could not send it — check your connection and press Hand in again. Your text is still here.');
                if (timedOut) setPhase('writing');
                return;
            }
            setSending(false);
        }
        store(null);
        setResult({ exam, seconds, timedOut, saved: isStudent });
        setPhase('done');
    }

    function leave() { navigate(backTo.path, { state: backTo.state }); }

    // ---------- intro / resume ----------
    if (phase === 'intro' || phase === 'resume') {
        const resumeLeft = exam ? Math.max(0, LIMIT - Math.floor((Date.now() - exam.startedAt) / 1000)) : 0;
        return (
            <PracticeSessionShell watermark={<CambridgeWatermark />} title="Writing — exam mode" subtitle="B2 First · Writing · 1 hour 20 minutes" onBack={leave} displayControls={false}>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-8">
                    <div className="max-w-2xl mx-auto flex flex-col gap-5 text-white">
                        <h1 className="text-3xl font-bold">Writing, like the real exam</h1>
                        <ul className="list-disc pl-5 flex flex-col gap-2 text-white/85 text-[17px] leading-relaxed">
                            <li><b>80 minutes</b> for both parts. The clock starts when you press Start and keeps running if you leave this screen.</li>
                            <li><b>Part 1 — Essay</b> (compulsory): answer the question using both notes and an idea of your own.</li>
                            <li><b>Part 2</b>: choose <b>one</b> of three tasks — an article, email / letter, report or review.</li>
                            <li>Write <b>140–190 words</b> for each part. The word count is under each box.</li>
                            <li>When you finish, press <b>Hand in</b>. {isStudent ? 'Your teacher gets both texts and will go through them with you in class.' : 'Teacher preview: nothing is saved.'}</li>
                        </ul>
                        {phase === 'resume' && exam && resumeLeft > 0 && (
                            <div className="rounded-2xl bg-amber-400/15 border border-amber-300/40 px-5 py-4 flex flex-wrap items-center gap-3" data-testid="resume">
                                <span className="flex-1">You have an exam in progress — <b>{clock(resumeLeft)}</b> left.</span>
                                <button type="button" className={primary} onClick={() => { setNow(Date.now()); setPhase('writing'); }}>Continue</button>
                            </div>
                        )}
                        {phase === 'resume' && exam && resumeLeft === 0 && (
                            <div className="rounded-2xl bg-amber-400/15 border border-amber-300/40 px-5 py-4 flex flex-wrap items-center gap-3">
                                <span className="flex-1">Time ran out on your last exam while you were away. Hand it in as it is?</span>
                                <button type="button" className={primary} disabled={sending} onClick={() => handIn(true)}>{sending ? 'Sending…' : 'Hand it in'}</button>
                            </div>
                        )}
                        {error && <p className="text-amber-300" role="alert">{error}</p>}
                        <div className="flex flex-wrap gap-3">
                            <button type="button" className={phase === 'resume' ? quiet : primary} onClick={start}>{phase === 'resume' ? 'Start a new exam instead' : 'Start — 80 minutes'}</button>
                        </div>
                    </div>
                </div>
            </PracticeSessionShell>
        );
    }

    // ---------- done ----------
    if (phase === 'done' && result) {
        const r = result.exam;
        const c = r.choice != null ? r.part2[r.choice] : null;
        return (
            <PracticeSessionShell watermark={<CambridgeWatermark />} title="Writing — exam mode" subtitle="Handed in" onBack={leave} displayControls={false}>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-8">
                    <div className="max-w-3xl mx-auto flex flex-col gap-5 text-white">
                        <h1 className="text-3xl font-bold" data-testid="handed-in">{result.saved ? 'Handed in ✓' : 'Finished — teacher preview, not saved'}</h1>
                        <p className="text-white/80 text-[17px]">
                            {result.timedOut ? 'Time was up, so your exam was handed in automatically. ' : ''}
                            Time used: <b>{clock(result.seconds)}</b> of 80:00. {result.saved && 'Your teacher will go through it with you in class.'}
                        </p>
                        {[{ n: 1, label: 'Part 1 · Essay', text: r.text1 }, ...(c ? [{ n: 2, label: `Part 2 · ${c.genre}`, text: r.text2 }] : [])].map(p => (
                            <section key={p.n} className="rounded-2xl bg-black/30 border border-white/15 px-5 py-4 flex flex-col gap-2">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h2 className="font-bold">{p.label}</h2>
                                    <WordCount n={countWords(p.text)} />
                                </div>
                                <p className="text-white/85 whitespace-pre-wrap leading-relaxed">{p.text || '(nothing written)'}</p>
                            </section>
                        ))}
                        {!c && <p className="text-amber-300">You didn’t choose a Part 2 task.</p>}
                        {c?.model && <ModelAnswer text={c.model} />}
                        <div className="flex flex-wrap gap-3">
                            <button type="button" className={primary} onClick={start}>Start another exam</button>
                            <button type="button" className={quiet} onClick={leave}>Back</button>
                        </div>
                    </div>
                </div>
            </PracticeSessionShell>
        );
    }

    // ---------- writing ----------
    const warn = left <= 5 * 60 ? 'Less than 5 minutes left — finish your sentence and check your work.' : left <= 10 * 60 ? '10 minutes left.' : '';
    const textCls = 'w-full min-h-[45vh] md:min-h-[55vh] rounded-2xl bg-black/30 border border-white/20 focus:border-[#fc6840] focus:outline-none text-white text-[17px] leading-relaxed px-4 py-3 resize-y';
    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title="Writing — exam mode"
            subtitle="B2 First · Part 1 essay + Part 2 (choose one)"
            progressLabel={<span className={`text-base tabular-nums ${left <= 5 * 60 ? 'text-amber-300' : 'text-white'}`} data-testid="exam-clock">⏱ {clock(left)}</span>}
            onBack={leave}
            displayControls={false}
        >
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-5">
                <div className="max-w-6xl mx-auto flex flex-col gap-4 text-white">
                    {warn && <p className="rounded-xl bg-amber-400/15 border border-amber-300/40 px-4 py-2 text-amber-200 font-semibold" role="status" data-testid="time-warning">{warn}</p>}
                    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Exam parts">
                        {[1, 2].map(n => (
                            <button key={n} type="button" role="tab" aria-selected={tab === n} onClick={() => setTab(n)}
                                className={`px-5 py-2.5 rounded-xl font-semibold border cursor-pointer ${tab === n ? 'bg-white text-[#1c1540] border-white' : 'bg-white/5 border-white/20 hover:bg-white/15'}`}>
                                {n === 1 ? `Part 1 · Essay · ${words1}w` : `Part 2 · ${chosen ? `${chosen.genre} · ${words2}w` : 'choose a task'}`}
                            </button>
                        ))}
                        <span className="flex-1" />
                        {!confirming && <button type="button" className={primary} disabled={sending} onClick={() => setConfirming(true)}>Hand in</button>}
                    </div>
                    {confirming && (
                        <div className="rounded-2xl bg-white/10 border border-white/25 px-5 py-4 flex flex-wrap items-center gap-3" data-testid="confirm-hand-in">
                            <span className="flex-1">Hand in now? You still have <b>{clock(left)}</b>.{!chosen && ' You haven’t chosen a Part 2 task yet.'}</span>
                            <button type="button" className={primary} disabled={sending} onClick={() => handIn(false)}>{sending ? 'Sending…' : 'Yes, hand in'}</button>
                            <button type="button" className={quiet} onClick={() => setConfirming(false)}>Keep writing</button>
                        </div>
                    )}
                    {error && <p className="text-amber-300" role="alert">{error}</p>}

                    {tab === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
                            <section className="rounded-2xl bg-black/30 border border-white/15 px-5 py-4 flex flex-col gap-3" aria-label="Part 1 task">
                                <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">Part 1 · Essay · compulsory</p>
                                <TaskText text={exam.essay.prompt} />
                                <p className="text-white/50 text-sm">Write your essay using all the notes and giving reasons for your point of view. 140–190 words.</p>
                            </section>
                            <div className="flex flex-col gap-2">
                                <textarea aria-label="Part 1 essay" value={exam.text1} onChange={e => update({ text1: e.target.value })} className={textCls} spellCheck={false} autoCorrect="off" autoCapitalize="sentences" />
                                <WordCount n={words1} />
                            </div>
                        </div>
                    )}

                    {tab === 2 && !chosen && (
                        <div className="flex flex-col gap-3">
                            <p className="text-white/70">Choose <b>one</b> task. You can change your mind until you start writing.</p>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                {exam.part2.map((t, i) => (
                                    <button key={t.task_id} type="button" onClick={() => update({ choice: i })} data-testid="part2-option"
                                        className="text-left rounded-2xl bg-black/30 border border-white/15 hover:border-[#fc6840] px-5 py-4 flex flex-col gap-2 cursor-pointer">
                                        <span className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">Question {i + 2} · {t.genre}</span>
                                        <TaskText text={t.prompt} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 2 && chosen && (
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
                            <section className="rounded-2xl bg-black/30 border border-white/15 px-5 py-4 flex flex-col gap-3" aria-label="Part 2 task">
                                <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">Part 2 · {chosen.genre}</p>
                                <TaskText text={chosen.prompt} />
                                <p className="text-white/50 text-sm">140–190 words.</p>
                                {exam.text2.trim() === '' && <button type="button" className={`${quiet} self-start`} onClick={() => update({ choice: null })}>Choose another task</button>}
                            </section>
                            <div className="flex flex-col gap-2">
                                <textarea aria-label={`Part 2 ${chosen.genre}`} value={exam.text2} onChange={e => update({ text2: e.target.value })} className={textCls} spellCheck={false} autoCorrect="off" autoCapitalize="sentences" />
                                <WordCount n={words2} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PracticeSessionShell>
    );
}
