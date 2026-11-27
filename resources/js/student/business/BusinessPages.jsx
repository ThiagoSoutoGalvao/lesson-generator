import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { TRILHAS, TRILHA_TOC, focusFromName } from '@/lib/trilhas';
import { relativeTime } from '@/lib/time';
import { activityMeta } from '@/student/lib/activityMeta';
import { useStudentLessons } from '@/student/lib/useStudentLessons';
import { logout } from '@/student/lib/logout';

// The clean student app for Aurora Business (AuroraBusiness.md §5, mockup "Student app · My course"): two tabs —
// Course and Progress — light theme, homework first. No Cambridge / DET practice (decided 2026-11-10: "as clean
// as possible"). StudentShell picks these pages for a student whose course is a business one.

const card = 'bg-white border border-[#DDE1E8] rounded-2xl';
const eyebrow = 'text-[13px] font-semibold text-[#4A5163] uppercase tracking-[0.05em]';

/** "Hello, I'm… — introduce myself…" → { title: "Hello, I'm…", goal: "introduce myself…" } */
function unitInfo(trilha, n) {
    const first = TRILHA_TOC[trilha]?.[n]?.[0] ?? '';
    const [title, goal] = first.split(' — ');
    return { title: title || `Unit ${n}`, goal: goal ?? '' };
}

/** The unit to work on: the first one that has activities left to do, else the last one with activities, else 1. */
function currentUnit(lessons, total) {
    const units = Array.from({ length: total }, (_, i) => i + 1);
    const open = units.find(n => (lessons?.[n] ?? []).some(a => !a.done));
    if (open) return open;
    const started = units.filter(n => (lessons?.[n] ?? []).length > 0);
    return started.at(-1) ?? 1;
}

// "Taught up to" (2026-11-28): the teacher marks each lesson as taught; lessons after the mark are locked here
// (the server doesn't send their activities either). taught = { lesson, part } — 1A until the first mark.
const rankOf = (n, p) => n * 10 + (String(p || 'A').charCodeAt(0) - 64);
const isOpen = (taught, n, p) => !taught || rankOf(n, p) <= rankOf(taught.lesson, taught.part);

function Lock() {
    return <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
}

function Check({ className = 'w-4 h-4' }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L19 7" /></svg>;
}
function Chevron() {
    return <svg className="w-4 h-4 text-[#9AA3B2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>;
}

/** A 1A / 1B / 1C line: done (green tick), to do (coral ring) or nothing yet. */
function PartRow({ n, part, items, locked }) {
    if (locked) {
        return (
            <div className="flex items-center gap-3 px-4 min-h-[52px] border-t border-[#ECEEF2] text-[17px] text-[#4A5163]" data-testid="unit-part">
                <span className="w-7 h-7 rounded-full bg-[#F1F2F5] grid place-items-center shrink-0"><Lock /></span>
                <span className="flex-1">Lesson {n}{part}</span>
                <span className="text-[14px]">Opens after class</span>
            </div>
        );
    }
    const done = items.filter(a => a.done).length;
    const state = items.length === 0 ? 'empty' : done === items.length ? 'done' : 'todo';
    return (
        <Link to={`/s/lesson/${n}#part-${part}`} className="flex items-center gap-3 px-4 min-h-[52px] border-t border-[#ECEEF2] text-[17px]" data-testid="unit-part">
            {state === 'done'
                ? <span className="w-7 h-7 rounded-full bg-[#1E7A4C] text-white grid place-items-center shrink-0"><Check /></span>
                : <span className={`w-7 h-7 rounded-full border-2 shrink-0 ${state === 'todo' ? 'border-[#E0521F]' : 'border-[#C6CCD6]'}`} />}
            <span className={`flex-1 ${state === 'todo' ? 'font-semibold' : ''} ${state === 'empty' ? 'text-[#4A5163]' : ''}`}>Lesson {n}{part}</span>
            <span className={`text-[14px] font-semibold ${state === 'done' ? 'text-[#1E7A4C]' : state === 'todo' ? 'text-[#9A3412]' : 'text-[#4A5163] font-normal'}`}>
                {state === 'done' ? 'Done' : state === 'todo' ? `${done} / ${items.length}` : 'Coming soon'}
            </span>
        </Link>
    );
}

function HomeworkCard({ item }) {
    const meta = activityMeta(item.type);
    return (
        <Link to={`/s/activity/${item.activity_id}`} state={{ from: '/s' }}
            className={`${card} ${item.done ? '' : 'border-2 border-[#E0521F]'} p-4 flex flex-col gap-2`} data-testid="homework-card">
            <span className={`self-start rounded-full px-3 py-1 text-[13px] font-semibold ${item.done ? 'bg-[#E5F4EC] text-[#14532D]' : 'bg-[#FDEEE7] text-[#9A3412]'}`}>
                {item.done ? 'Homework · done' : 'Homework · to do'}
            </span>
            <span className="text-[19px] font-semibold leading-snug">{focusFromName(item.name)}</span>
            <span className="text-[15px] text-[#4A5163]">{meta.label}{item.note ? ` · ${item.note}` : ''}</span>
            {!item.done && <span className="mt-1 h-[52px] rounded-xl bg-[#E0521F] text-white text-[17px] font-semibold grid place-items-center">Start</span>}
        </Link>
    );
}

export function BusinessHomePage({ user }) {
    const meta = TRILHAS[user.trilha];
    const total = meta?.lessons ?? 0;
    const firstName = (user.name || '').trim().split(/\s+/)[0] || 'there';
    const { loading, error, lessons, taught } = useStudentLessons();
    const [homework, setHomework] = useState(null);

    useEffect(() => {
        let alive = true;
        axios.get('/api/student/homework')
            .then(({ data }) => { if (alive) setHomework(data.homework ?? []); })
            .catch(() => { if (alive) setHomework([]); });
        return () => { alive = false; };
    }, []);

    const all = Object.values(lessons ?? {}).flat();
    const done = all.filter(a => a.done).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    const now = taught ? taught.lesson : currentUnit(lessons, total); // the unit the class is on
    const nowInfo = unitInfo(user.trilha, now);
    const parts = meta?.parts?.length ? meta.parts : ['A'];
    const todo = (homework ?? []).filter(h => !h.done);
    const doneHw = (homework ?? []).filter(h => h.done).slice(0, 2);

    return (
        <div className="px-4 pt-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <img src="/brand/aurora-symbol.png" alt="" aria-hidden="true" className="w-10 h-10 object-contain" />
                <div>
                    <h1 className="font-display text-[22px] font-semibold leading-tight">Hi, {firstName}</h1>
                    <p className="text-[15px] text-[#4A5163]">{meta?.label ? titleCase(meta.label) : user.trilha} · Aurora Business</p>
                </div>
            </div>

            <section aria-label="Homework" className="flex flex-col gap-3">
                {homework === null ? null : todo.length === 0 ? (
                    <div className={`${card} p-4 flex items-center gap-3`}>
                        <span className="w-8 h-8 rounded-full bg-[#E5F4EC] text-[#1E7A4C] grid place-items-center shrink-0"><Check /></span>
                        <span className="text-[16px]">No homework right now.</span>
                    </div>
                ) : todo.map(item => <HomeworkCard key={item.id} item={item} />)}
                {doneHw.map(item => <HomeworkCard key={item.id} item={item} />)}
            </section>

            <section aria-label="Your course" className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[15px]"><span className="font-semibold">Your course</span><span className="text-[#4A5163]">Unit {now} of {total}</span></div>
                    <div className="h-2 rounded bg-[#E6E9EE] overflow-hidden" role="progressbar" aria-label="Activities done" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-2 bg-[#E0521F]" style={{ width: `${Math.max(pct, all.length ? 2 : 0)}%` }} />
                    </div>
                </div>

                {error && <div className={`${card} p-4 text-[15px] text-[#4A5163]`}>{error}</div>}
                {!error && (
                    <div className={`${card} overflow-hidden`} data-testid="current-unit">
                        <Link to={`/s/lesson/${now}`} className="block p-4">
                            <span className={eyebrow}>Unit {now}</span>
                            <span className="block text-[20px] font-semibold leading-snug mt-0.5">{nowInfo.title}</span>
                            {nowInfo.goal && <span className="block text-[15px] text-[#4A5163] mt-1">Goal: {nowInfo.goal}</span>}
                        </Link>
                        {loading ? <p className="px-4 pb-4 text-[15px] text-[#4A5163]">Loading…</p>
                            : parts.map(p => <PartRow key={p} n={now} part={p} locked={!isOpen(taught, now, p)} items={(lessons?.[now] ?? []).filter(a => (a.part ?? 'A') === p)} />)}
                    </div>
                )}
            </section>

            <section aria-label="All units" className="flex flex-col gap-2">
                <p className={eyebrow}>All units</p>
                <ul className={`${card} overflow-hidden`}>
                    {Array.from({ length: total }, (_, i) => i + 1).map(n => {
                        const items = lessons?.[n] ?? [];
                        const d = items.filter(a => a.done).length;
                        const finished = items.length > 0 && d === items.length;
                        if (!isOpen(taught, n, 'A')) {
                            return (
                                <li key={n} className="border-t border-[#ECEEF2] first:border-t-0 flex items-center gap-3 px-4 min-h-[56px] py-2 text-[#4A5163]" data-testid="locked-unit">
                                    <span className="w-8 h-8 rounded-lg grid place-items-center text-[15px] font-semibold shrink-0 bg-[#F1F2F5]">{n}</span>
                                    <span className="flex-1 min-w-0 text-[16px] truncate">{unitInfo(user.trilha, n).title}</span>
                                    <span aria-label="Opens after class"><Lock /></span>
                                </li>
                            );
                        }
                        return (
                            <li key={n} className="border-t border-[#ECEEF2] first:border-t-0">
                                <Link to={`/s/lesson/${n}`} className="flex items-center gap-3 px-4 min-h-[56px] py-2">
                                    <span className={`w-8 h-8 rounded-lg grid place-items-center text-[15px] font-semibold shrink-0 ${n === now ? 'bg-[#FDEEE7] text-[#9A3412]' : 'bg-[#F1F2F5] text-[#4A5163]'}`}>{n}</span>
                                    <span className="flex-1 min-w-0 text-[16px] truncate">{unitInfo(user.trilha, n).title}</span>
                                    {finished ? <span className="text-[#1E7A4C]" aria-label="Done"><Check /></span>
                                        : items.length > 0 ? <span className="text-[13px] text-[#4A5163]">{d} / {items.length}</span> : null}
                                    <Chevron />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}

function titleCase(label) {
    return label.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function ActivityRow({ item }) {
    const meta = activityMeta(item.type);
    const score = item.done && item.last_score != null && item.last_max ? `${item.last_score} / ${item.last_max}` : null;
    return (
        <Link to={`/s/activity/${item.id}`} className="flex items-center gap-3 px-4 min-h-[60px] py-2.5 border-t border-[#ECEEF2] first:border-t-0">
            {item.done
                ? <span className="w-7 h-7 rounded-full bg-[#1E7A4C] text-white grid place-items-center shrink-0"><Check /></span>
                : <span className="w-7 h-7 rounded-full border-2 border-[#C6CCD6] shrink-0" />}
            <span className="flex-1 min-w-0">
                <span className="block text-[17px] font-semibold leading-snug break-words">{focusFromName(item.name)}</span>
                <span className="block text-[14px] text-[#4A5163]">{meta.label}</span>
            </span>
            {score && <span className="text-[14px] font-semibold text-[#1E7A4C] shrink-0">{score}</span>}
            <Chevron />
        </Link>
    );
}

export function BusinessLessonPage({ user }) {
    const n = Number(useParams().n);
    const meta = TRILHAS[user.trilha];
    const valid = Number.isInteger(n) && n >= 1 && n <= (meta?.lessons ?? 0);
    const { loading, error, lessons, taught } = useStudentLessons();
    const info = unitInfo(user.trilha, n);
    const learn = (TRILHA_TOC[user.trilha]?.[n] ?? []).slice(1);
    const items = lessons?.[n] ?? [];
    const parts = meta?.parts?.length ? meta.parts : ['A'];
    const { hash } = useLocation();

    // "Lesson 1B" on the Course tab links to #part-B: scroll there once the activities are on the page.
    useEffect(() => {
        if (!loading && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    }, [loading, hash]);

    return (
        <div className="px-4 pt-5 flex flex-col gap-5">
            <Link to="/s" className="self-start inline-flex items-center gap-1.5 min-h-11 text-[15px] font-semibold text-[#4A5163]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                Your course
            </Link>
            {!valid ? <p className="text-[16px] text-[#4A5163]">That unit doesn’t exist in your course.</p> : (
                <>
                    <div>
                        <p className={eyebrow}>Unit {n}</p>
                        <h1 className="font-display text-[26px] font-semibold leading-tight mt-1">{info.title}</h1>
                        {info.goal && <p className="text-[16px] text-[#4A5163] mt-1.5">Goal: {info.goal}</p>}
                    </div>
                    {learn.length > 0 && (
                        <section aria-label="What you’ll learn" className={`${card} p-4 flex flex-col gap-2`}>
                            <p className={eyebrow}>What you’ll learn</p>
                            <ul className="flex flex-col gap-1.5 text-[16px]">
                                {learn.map(l => <li key={l} className="flex gap-2"><span className="text-[#E0521F]" aria-hidden="true">•</span><span>{l}</span></li>)}
                            </ul>
                        </section>
                    )}
                    {loading && <p className="text-[15px] text-[#4A5163]">Loading…</p>}
                    {error && <p className={`${card} p-4 text-[15px] text-[#4A5163]`}>{error}</p>}
                    {!loading && !error && parts.map(p => {
                        if (!isOpen(taught, n, p)) {
                            return (
                                <section key={p} id={`part-${p}`} aria-label={`Lesson ${n}${p}`} className="flex flex-col gap-2 scroll-mt-4" data-testid="student-part">
                                    <h2 className="font-display text-[20px] font-semibold text-[#4A5163]">Lesson {n}{p}</h2>
                                    <p className="rounded-2xl border border-dashed border-[#C6CCD6] px-4 py-4 text-[15px] text-[#4A5163] flex items-center gap-2"><Lock /> Opens after your class.</p>
                                </section>
                            );
                        }
                        const mine = items.filter(a => (a.part ?? 'A') === p);
                        const d = mine.filter(a => a.done).length;
                        return (
                            <section key={p} id={`part-${p}`} aria-label={`Lesson ${n}${p}`} className="flex flex-col gap-2 scroll-mt-4" data-testid="student-part">
                                <div className="flex items-baseline justify-between">
                                    <h2 className="font-display text-[20px] font-semibold">Lesson {n}{p}</h2>
                                    {mine.length > 0 && <span className={`text-[14px] font-semibold ${d === mine.length ? 'text-[#1E7A4C]' : 'text-[#4A5163]'}`}>{d === mine.length ? 'Done' : `${d} / ${mine.length}`}</span>}
                                </div>
                                {mine.length === 0
                                    ? <p className="rounded-2xl border border-dashed border-[#C6CCD6] px-4 py-4 text-[15px] text-[#4A5163]">Nothing here yet — your teacher adds it after the class.</p>
                                    : <div className={`${card} overflow-hidden`}>{mine.map(a => <ActivityRow key={a.id} item={a} />)}</div>}
                            </section>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export function BusinessProgressPage({ user }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const meta = TRILHAS[user.trilha];

    useEffect(() => {
        let alive = true;
        axios.get('/api/student/progress')
            .then(({ data }) => { if (alive) setData(data); })
            .catch(() => { if (alive) setError('Could not load your progress. Try again later.'); });
        return () => { alive = false; };
    }, []);

    const pct = data && data.activities_total > 0 ? Math.round((data.activities_done / data.activities_total) * 100) : 0;

    return (
        <div className="px-4 pt-6 flex flex-col gap-5">
            <div>
                <h1 className="font-display text-[26px] font-semibold leading-tight">Your progress</h1>
                <p className="text-[15px] text-[#4A5163] mt-1">{meta?.label ? titleCase(meta.label) : user.trilha}</p>
            </div>
            {error && <p className={`${card} p-4 text-[15px] text-[#4A5163]`}>{error}</p>}
            {!error && !data && <p className="text-[15px] text-[#4A5163]">Loading…</p>}
            {data && (
                <>
                    <section aria-label="Activities completed" className={`${card} p-5`}>
                        <div className="flex items-end justify-between">
                            <p className="font-display text-[34px] font-semibold leading-none">{data.activities_done}<span className="text-[#4A5163] text-[20px]"> / {data.activities_total}</span></p>
                            <p className="font-display text-[22px] font-semibold text-[#9A3412]">{pct}%</p>
                        </div>
                        <p className="text-[14px] text-[#4A5163] mt-1.5">Activities completed</p>
                        <div className="h-2 rounded bg-[#E6E9EE] overflow-hidden mt-3"><div className="h-2 bg-[#E0521F]" style={{ width: `${pct}%` }} /></div>
                    </section>

                    <section aria-label="Recent activity" className="flex flex-col gap-2">
                        <p className={eyebrow}>Recent activity</p>
                        {data.recent.length === 0
                            ? <p className="rounded-2xl border border-dashed border-[#C6CCD6] px-4 py-4 text-[15px] text-[#4A5163]">Nothing yet. Your results show up here after your first activity.</p>
                            : (
                                <ul className={`${card} overflow-hidden`}>
                                    {data.recent.map(item => (
                                        <li key={item.id} className="border-t border-[#ECEEF2] first:border-t-0">
                                            <Link to={`/s/activity/${item.activity_id}`} className="flex items-center gap-3 px-4 min-h-[60px] py-2.5">
                                                <span className="flex-1 min-w-0">
                                                    <span className="block text-[16px] font-semibold truncate">{focusFromName(item.name)}</span>
                                                    <span className="block text-[13px] text-[#4A5163]">Unit {item.lesson} · {relativeTime(item.completed_at)}</span>
                                                </span>
                                                {item.score != null && item.max_score
                                                    ? <span className="text-[14px] font-semibold text-[#1E7A4C]">{item.score} / {item.max_score}</span>
                                                    : <span className="text-[#1E7A4C]" aria-label="Done"><Check /></span>}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                    </section>

                    {data.speaking?.length > 0 && (
                        <section aria-label="Speaking in class" className="flex flex-col gap-2">
                            <p className={eyebrow}>Speaking in class</p>
                            <ul className={`${card} overflow-hidden`}>
                                {data.speaking.map(item => {
                                    const used = item.targets.filter(t => t.used).map(t => t.label);
                                    return (
                                        <li key={item.id} className="border-t border-[#ECEEF2] first:border-t-0 px-4 py-3 flex items-start gap-3">
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[16px] font-semibold truncate">{focusFromName(item.name)}</span>
                                                <span className="block text-[13px] text-[#4A5163]">{relativeTime(item.completed_at)}</span>
                                                {used.length > 0 && <span className="block text-[14px] text-[#14532D] mt-1">You used: {used.join(' · ')}</span>}
                                            </span>
                                            <span className="text-[13px] font-semibold rounded-lg px-2 py-1 bg-[#E5F4EC] text-[#14532D] shrink-0">{item.used} / {item.total}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </>
            )}

            <div className={`${card} p-4 flex items-center gap-3 mt-2`}>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#4A5163]">Signed in as</p>
                    <p className="text-[16px] font-semibold truncate">{user?.name}</p>
                </div>
                <button type="button" onClick={logout} className="shrink-0 h-11 px-4 rounded-xl border border-[#DDE1E8] bg-white hover:bg-[#F1F2F5] text-[15px] font-semibold cursor-pointer">Log out</button>
            </div>
        </div>
    );
}
