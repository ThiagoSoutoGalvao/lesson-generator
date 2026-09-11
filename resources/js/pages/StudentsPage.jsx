import { useEffect, useState } from 'react';
import axios from 'axios';
import { TRILHA_NAMES, TRILHAS } from '@/lib/trilhas';
import { relativeTime } from '@/lib/time';
import { activityMeta } from '@/student/lib/activityMeta';

const inputCls = 'w-full bg-white/8 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#fc6840]';

function NewStudentForm({ onCreated }) {
    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [trilha, setTrilha]     = useState('Lights');
    const [password, setPassword] = useState('');
    const [busy, setBusy]         = useState(false);
    const [err, setErr]           = useState('');

    async function submit(e) {
        e.preventDefault();
        setBusy(true); setErr('');
        try {
            const { data } = await axios.post('/api/students', { name, email, trilha, password });
            onCreated(data);
            setName(''); setEmail(''); setPassword(''); setTrilha('Lights');
        } catch (e2) {
            setErr(e2.response?.data?.message ?? Object.values(e2.response?.data?.errors ?? {})[0]?.[0] ?? 'Could not create the student.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} className="lg-surface border rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="font-display text-white font-bold text-sm">New student</h3>
            <div className="grid sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
                <input className={inputCls} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <select className={`${inputCls} cursor-pointer`} value={trilha} onChange={e => setTrilha(e.target.value)}>
                    {TRILHA_NAMES.map(t => <option key={t} value={t} className="bg-[#1c1540]">{TRILHAS[t].label}</option>)}
                </select>
                <input className={inputCls} type="text" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
            </div>
            {err && <p className="text-red-300 text-xs">{err}</p>}
            <button disabled={busy} className="self-start bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                {busy ? 'Creating…' : 'Create student'}
            </button>
            <p className="text-white/40 text-xs">You set the password and hand it over. The student logs in at the same page you do.</p>
        </form>
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

function StudentRow({ s, onChange }) {
    const [busy, setBusy]       = useState(false);
    const [expanded, setExpanded] = useState(false);

    async function patch(payload) {
        setBusy(true);
        try {
            const { data } = await axios.patch(`/api/students/${s.id}`, payload);
            onChange(data);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={`lg-surface border rounded-2xl overflow-hidden ${s.is_active ? '' : 'opacity-55'}`}>
            <div className="p-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-white text-sm truncate">{s.name}</p>
                    <p className="text-white/50 text-xs truncate">{s.email}</p>
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
                    {expanded ? 'Hide progress' : 'View progress'}
                </button>
                <button
                    disabled={busy}
                    onClick={() => patch({ is_active: !s.is_active })}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    {s.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
            </div>
            {expanded && (
                <div className="border-t border-white/10 bg-black/15 px-4 py-4">
                    <StudentProgressPanel studentId={s.id} />
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
                        {students.map(s => <StudentRow key={s.id} s={s} onChange={upsert} />)}
                      </div>
            )}
        </div>
    );
}
