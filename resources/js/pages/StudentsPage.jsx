import { useEffect, useState } from 'react';
import axios from 'axios';
import { TRILHA_NAMES, TRILHAS } from '@/lib/trilhas';
import { relativeTime } from '@/lib/time';
import { activityMeta } from '@/student/lib/activityMeta';
import { IS_LOCAL } from '@/components/EnvBadge';

const inputCls = 'w-full bg-white/8 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#fc6840]';

// Same edge-stripping the server applies (App\Support\Credentials): whitespace, Unicode spaces
// and zero-width characters — so the hand-over card shows the password that was really saved.
const cleanSecret = s => s.replace(/^[\s\p{Z}​-‍⁠﻿]+|[\s\p{Z}​-‍⁠﻿]+$/gu, '');

// Fields whose text a phone keyboard or browser must not "help" with.
const plainText = { autoComplete: 'off', autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false };

function Handover({ info, onClose }) {
    const [copied, setCopied] = useState(false);
    const loginUrl = `${window.location.origin}/login`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(`Login: ${loginUrl}\nEmail: ${info.email}\nPassword: ${info.password}`);
            setCopied(true);
        } catch { /* clipboard blocked — the details are on screen to copy by hand */ }
    }

    return (
        <div className="rounded-2xl border border-[#3ecf8e]/40 bg-[#3ecf8e]/10 p-4 flex flex-col gap-2">
            <p className="text-[#5be0a4] text-sm font-display font-semibold">{info.heading}</p>
            <dl className="text-sm text-white/90 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-all">
                <dt className="text-white/50">Login</dt><dd>{loginUrl}</dd>
                <dt className="text-white/50">Email</dt><dd>{info.email}</dd>
                <dt className="text-white/50">Password</dt><dd className="font-mono">{info.password}</dd>
            </dl>
            {IS_LOCAL && (
                <p className="text-[#f5b400] text-xs font-semibold">
                    ⚠ You are on your LOCAL test site. This account does not exist on the live site — a student can't use it. Create it on the Railway address instead.
                </p>
            )}
            <p className="text-white/45 text-xs">This is exactly what was saved — no spaces before or after. It won't be shown again.</p>
            <div className="flex gap-2">
                <button onClick={copy} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#e0521f] hover:bg-[#c9461a] text-white transition-colors cursor-pointer">
                    {copied ? 'Copied ✓' : 'Copy details'}
                </button>
                <button onClick={onClose} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    Done
                </button>
            </div>
        </div>
    );
}

function NewStudentForm({ onCreated }) {
    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [trilha, setTrilha]     = useState('Lights');
    const [password, setPassword] = useState('');
    const [busy, setBusy]         = useState(false);
    const [err, setErr]           = useState('');
    const [handover, setHandover] = useState(null);

    async function submit(e) {
        e.preventDefault();
        setBusy(true); setErr(''); setHandover(null);
        try {
            const { data } = await axios.post('/api/students', { name, email, trilha, password });
            onCreated(data);
            setHandover({ heading: `${data.name} is ready to log in`, email: data.email, password: cleanSecret(password) });
            setName(''); setEmail(''); setPassword(''); setTrilha('Lights');
        } catch (e2) {
            setErr(e2.response?.data?.message ?? Object.values(e2.response?.data?.errors ?? {})[0]?.[0] ?? 'Could not create the student.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <form onSubmit={submit} className="lg-surface border rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="font-display text-white font-bold text-sm">New student</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                    <input className={inputCls} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
                    <input className={inputCls} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required {...plainText} />
                    <select className={`${inputCls} cursor-pointer`} value={trilha} onChange={e => setTrilha(e.target.value)}>
                        {TRILHA_NAMES.map(t => <option key={t} value={t} className="bg-[#1c1540]">{TRILHAS[t].label}</option>)}
                    </select>
                    <input className={inputCls} type="text" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required {...plainText} />
                </div>
                {err && <p className="text-red-300 text-xs">{err}</p>}
                <button disabled={busy} className="self-start bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                    {busy ? 'Creating…' : 'Create student'}
                </button>
                <p className="text-white/40 text-xs">You set the password and hand it over. The student logs in at the same page you do.</p>
            </form>
            {handover && <Handover info={handover} onClose={() => setHandover(null)} />}
        </div>
    );
}

function ProgressScoreBadge({ item }) {
    const hasScore = item.score != null && item.max_score;
    return (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#3ecf8e]/15 text-[#5be0a4] px-2 py-0.5 text-[11px] font-display font-bold">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M5 13l4 4L19 7" /></svg>
            {hasScore && `${item.score}/${item.max_score}`}
        </span>
    );
}

// Fetched lazily — only when a teacher actually expands a student's row, so
// the page doesn't fire N progress queries just to render the student list.
function StudentProgressPanel({ studentId }) {
    const [data, setData]   = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;
        axios.get(`/api/students/${studentId}/progress`)
            .then(({ data }) => { if (alive) setData(data); })
            .catch(() => { if (alive) setError('Could not load progress.'); });
        return () => { alive = false; };
    }, [studentId]);

    if (error) return <p className="text-red-300 text-xs px-1">{error}</p>;
    if (!data) return <p className="text-white/40 text-xs px-1">Loading…</p>;

    const pct = data.activities_total > 0 ? Math.round((data.activities_done / data.activities_total) * 100) : 0;

    // Every lesson the trilha actually has (not just every *existing* activity)
    // must be fully done — same rule as the student's own Progress page, so the
    // two sides never disagree about what "complete" means.
    const lessonsTotal = TRILHAS[data.trilha]?.lessons ?? 0;
    const allLessonsDone = lessonsTotal > 0 && Array.from({ length: lessonsTotal }, (_, i) => i + 1)
        .every(n => {
            const l = data.lessons.find(x => x.lesson === n);
            return l && l.total > 0 && l.done === l.total;
        });

    return (
        <div className="flex flex-col gap-4">
            {allLessonsDone && (
                <p className="text-sm font-display font-semibold text-[#fc6840]">
                    🎉 Every lesson complete — consider moving them to the next trilha (dropdown above).
                </p>
            )}
            <div className="flex items-center gap-4">
                <p className="font-display font-bold text-white text-lg shrink-0">
                    {data.activities_done}<span className="text-white/40 text-sm">/{data.activities_total} done</span>
                </p>
                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#e0521f] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-white/50 text-xs shrink-0">{pct}%</p>
            </div>

            {data.lessons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {data.lessons.map(l => (
                        <span
                            key={l.lesson}
                            title={`Lesson ${l.lesson}: ${l.done}/${l.total}`}
                            className={`text-[11px] font-display font-bold rounded-lg px-2 py-1 ${
                                l.done === l.total ? 'bg-[#3ecf8e]/15 text-[#5be0a4]' : 'bg-white/8 text-white/60'
                            }`}
                        >
                            L{l.lesson} · {l.done}/{l.total}
                        </span>
                    ))}
                </div>
            )}

            {data.recent.length === 0 ? (
                <p className="text-white/40 text-xs">No activities completed yet.</p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {data.recent.slice(0, 8).map(item => {
                        const meta = activityMeta(item.type);
                        return (
                            <div key={item.id} className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2">
                                <span className="shrink-0 text-sm">{meta.icon}</span>
                                <span className="flex-1 min-w-0 text-white/85 text-xs truncate">{item.name}</span>
                                <span className="text-white/35 text-[11px] shrink-0">{relativeTime(item.completed_at)}</span>
                                <ProgressScoreBadge item={item} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Assigned activities for one student (Aurora Homework Phase H2) — deliberately
// its own panel, not folded into StudentProgressPanel above: trilha progress is
// "how they're doing on the shared curriculum," homework is "stuff I personally
// handed them," and mixing the two lists would blur that distinction for the
// teacher exactly the way we're avoiding on the student side too.
function HomeworkPanel({ studentId }) {
    const [homework, setHomework] = useState(null);
    const [error, setError]       = useState(null);
    const [library, setLibrary]   = useState(null);
    const [activityId, setActivityId] = useState('');
    const [note, setNote]         = useState('');
    const [busy, setBusy]         = useState(false);
    const [assignErr, setAssignErr] = useState('');

    useEffect(() => {
        let alive = true;
        axios.get(`/api/students/${studentId}/assignments`)
            .then(({ data }) => { if (alive) setHomework(data.homework); })
            .catch(() => { if (alive) setError('Could not load homework.'); });
        axios.get('/api/activities')
            .then(({ data }) => { if (alive) setLibrary(data); })
            .catch(() => {});
        return () => { alive = false; };
    }, [studentId]);

    async function assign(e) {
        e.preventDefault();
        if (!activityId) return;
        setBusy(true); setAssignErr('');
        try {
            const { data } = await axios.post(`/api/students/${studentId}/assignments`, {
                activity_id: Number(activityId),
                note: note || null,
            });
            const activity = library.find(a => a.id === Number(activityId));
            setHomework(prev => [
                { id: data.id, activity_id: activity.id, name: activity.name, type: activity.type, note: data.note, done: false },
                ...(prev ?? []).filter(h => h.activity_id !== activity.id),
            ]);
            setActivityId(''); setNote('');
        } catch {
            setAssignErr('Could not assign that activity.');
        } finally {
            setBusy(false);
        }
    }

    async function unassign(assignmentId) {
        setHomework(prev => prev.filter(h => h.id !== assignmentId));
        axios.delete(`/api/students/${studentId}/assignments/${assignmentId}`).catch(() => {});
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={assign} className="flex flex-col sm:flex-row gap-2">
                <select
                    value={activityId}
                    onChange={e => setActivityId(e.target.value)}
                    className="flex-1 min-w-0 bg-white/8 border border-white/15 text-white text-xs rounded-lg px-2.5 py-2 cursor-pointer"
                >
                    <option value="" className="bg-[#1c1540]">
                        {library === null ? 'Loading your library…' : 'Choose an activity to assign…'}
                    </option>
                    {library?.map(a => (
                        <option key={a.id} value={a.id} className="bg-[#1c1540]">{a.name}</option>
                    ))}
                </select>
                <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Note (optional)"
                    maxLength={255}
                    className="sm:w-40 bg-white/8 border border-white/15 text-white text-xs rounded-lg px-2.5 py-2 placeholder-white/35"
                />
                <button
                    disabled={busy || !activityId}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
                >
                    Assign
                </button>
            </form>
            {assignErr && <p className="text-red-300 text-xs">{assignErr}</p>}

            {error && <p className="text-red-300 text-xs px-1">{error}</p>}
            {!error && homework === null && <p className="text-white/40 text-xs px-1">Loading…</p>}
            {homework?.length === 0 && <p className="text-white/40 text-xs">Nothing assigned yet.</p>}
            {homework?.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {homework.map(item => {
                        const meta = activityMeta(item.type);
                        return (
                            <div key={item.id} className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2">
                                <span className="shrink-0 text-sm">{meta.icon}</span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-white/85 text-xs truncate">{item.name}</span>
                                    {item.note && <span className="block text-white/40 text-[11px] truncate mt-0.5">{item.note}</span>}
                                </span>
                                <span className={`shrink-0 text-[11px] font-display font-bold rounded-full px-2 py-0.5 ${
                                    item.done ? 'bg-[#3ecf8e]/15 text-[#5be0a4]' : 'bg-white/8 text-white/50'
                                }`}>
                                    {item.done ? 'Done' : 'Not done'}
                                </span>
                                <button
                                    onClick={() => unassign(item.id)}
                                    className="shrink-0 text-white/30 hover:text-red-300 text-xs transition-colors cursor-pointer"
                                    title="Unassign"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StudentRow({ s, onChange, onRemoved }) {
    const [busy, setBusy]       = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetErr, setResetErr] = useState('');
    const [handover, setHandover] = useState(null);
    const [confirmingRemove, setConfirmingRemove] = useState(false);
    const [removeErr, setRemoveErr] = useState('');

    async function remove() {
        setBusy(true); setRemoveErr('');
        try {
            await axios.delete(`/api/students/${s.id}`);
            onRemoved(s.id);
        } catch (e2) {
            setRemoveErr(e2.response?.data?.message ?? 'Could not remove the student.');
            setBusy(false);
        }
    }

    async function patch(payload) {
        setBusy(true);
        try {
            const { data } = await axios.patch(`/api/students/${s.id}`, payload);
            onChange(data);
        } finally {
            setBusy(false);
        }
    }

    async function resetPassword(e) {
        e.preventDefault();
        setResetErr('');
        try {
            await patch({ password: newPassword });
            setHandover({ heading: `New password saved for ${s.name}`, email: s.email, password: cleanSecret(newPassword) });
            setResetting(false); setNewPassword('');
        } catch (e2) {
            setResetErr(Object.values(e2.response?.data?.errors ?? {})[0]?.[0] ?? e2.response?.data?.message ?? 'Could not change the password.');
        }
    }

    return (
        <div className={`lg-surface border rounded-2xl overflow-hidden ${s.is_active ? '' : 'opacity-55'}`}>
            <div className="p-4 flex flex-wrap items-center gap-3">
                {/* Its own full-width line: with five buttons on the row a flex-1 name shrank to a couple of letters. */}
                <div className="min-w-0 basis-full">
                    <p className="font-display font-semibold text-white text-sm break-words">{s.name}</p>
                    {/* wraps instead of "…": the email is exactly what the student has to type, so show all of it */}
                    <p className="text-white/50 text-xs break-all">{s.email}</p>
                </div>
                <select
                    value={s.trilha}
                    disabled={busy}
                    onChange={e => patch({ trilha: e.target.value })}
                    className="bg-white/8 border border-white/15 text-white text-xs rounded-lg px-2 py-1.5 cursor-pointer"
                >
                    {TRILHA_NAMES.map(t => <option key={t} value={t} className="bg-[#1c1540]">{TRILHAS[t].label}</option>)}
                </select>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    {expanded ? 'Hide progress & homework' : 'Progress & Homework'}
                </button>
                <button
                    disabled={busy}
                    onClick={() => patch({ is_active: !s.is_active })}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    {s.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
                <button
                    disabled={busy}
                    onClick={() => { setResetting(r => !r); setResetErr(''); setHandover(null); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    Reset password
                </button>
                <button
                    disabled={busy}
                    onClick={() => { setConfirmingRemove(c => !c); setRemoveErr(''); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-400/30 text-red-300/80 hover:text-red-200 hover:bg-red-500/15 transition-colors cursor-pointer"
                >
                    Remove
                </button>
            </div>
            {confirmingRemove && (
                <div className="border-t border-red-400/20 bg-red-500/10 px-4 py-3 flex flex-col gap-2">
                    <p className="text-red-100 text-xs leading-relaxed">
                        Remove <strong>{s.name}</strong> for good? Their login, progress and assigned homework are deleted and this can't be undone.
                        Your activities are not touched. (To just pause the login and keep the history, use <em>Deactivate</em>.)
                    </p>
                    <div className="flex gap-2">
                        <button disabled={busy} onClick={remove} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors cursor-pointer">
                            {busy ? 'Removing…' : 'Yes, remove'}
                        </button>
                        <button disabled={busy} onClick={() => setConfirmingRemove(false)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                            Cancel
                        </button>
                    </div>
                    {removeErr && <p className="text-red-300 text-xs">{removeErr}</p>}
                </div>
            )}
            {resetting && (
                <form onSubmit={resetPassword} className="border-t border-white/10 bg-black/15 px-4 py-3 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        <input
                            className={`${inputCls} flex-1 min-w-[12rem]`}
                            type="text"
                            placeholder="New password (min 8 chars)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            minLength={8}
                            required
                            autoFocus
                            {...plainText}
                        />
                        <button disabled={busy} className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-40 text-white transition-colors cursor-pointer">
                            Save password
                        </button>
                    </div>
                    {resetErr && <p className="text-red-300 text-xs">{resetErr}</p>}
                </form>
            )}
            {handover && (
                <div className="border-t border-white/10 bg-black/15 px-4 py-3">
                    <Handover info={handover} onClose={() => setHandover(null)} />
                </div>
            )}
            {expanded && (
                <div className="border-t border-white/10 bg-black/15 px-4 py-4 flex flex-col gap-5">
                    <div>
                        <p className="font-display font-semibold text-[11px] tracking-wide uppercase text-white/40 mb-2.5">Trilha progress</p>
                        <StudentProgressPanel studentId={s.id} />
                    </div>
                    <div className="border-t border-white/10 pt-4">
                        <p className="font-display font-semibold text-[11px] tracking-wide uppercase text-white/40 mb-2.5">Homework — assigned directly, outside the trilha</p>
                        <HomeworkPanel studentId={s.id} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
        axios.get('/api/students')
            .then(({ data }) => setStudents(data))
            .catch(e => setError(e.response?.status === 403 ? 'Only teacher accounts can manage students.' : 'Failed to load students.'))
            .finally(() => setLoading(false));
    }, []);

    function upsert(s) {
        setStudents(prev => {
            const rest = prev.filter(p => p.id !== s.id);
            return [...rest, s].sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    function removeStudent(id) {
        setStudents(prev => prev.filter(p => p.id !== id));
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div>
                <h2 className="font-display lg-shell-text text-3xl font-bold text-white">Students</h2>
                <p className="lg-shell-text text-[#c6b8e6] mt-1 text-sm">
                    Create logins for your students and put each one on a trilha. They practise its activities from home.
                </p>
            </div>

            <NewStudentForm onCreated={upsert} />

            {loading && <p className="text-white/50 text-sm">Loading…</p>}
            {error && <div className="rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-sm text-red-300">{error}</div>}

            {!loading && !error && (
                students.length === 0
                    ? <p className="lg-shell-text text-[#c6b8e6] text-sm">No students yet — create one above.</p>
                    : <div className="flex flex-col gap-2.5">
                        {students.map(s => <StudentRow key={s.id} s={s} onChange={upsert} onRemoved={removeStudent} />)}
                      </div>
            )}
        </div>
    );
}
