import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// "Use it!" — the target-language checklist on speaking activities (Aurora Lessons Phase 1, step 2).
// Teacher: ticks each item as the student uses it live, picks "Who's this with?" once per teaching
// session (sessionStorage, so it follows the teacher from activity to activity in one tab), and saves
// the ticks to that student's progress. Student app: the same list, read-only, as "Try to use".
// Targets live in `activity.targets`; a teacher can add or edit them (PATCHed when the activity is saved).

const LIVE_STUDENT_KEY = 'aurora.liveStudent';

export function readLiveStudent() {
    try { return JSON.parse(sessionStorage.getItem(LIVE_STUDENT_KEY)) || null; } catch { return null; }
}
export function writeLiveStudent(s) {
    try {
        if (s) sessionStorage.setItem(LIVE_STUDENT_KEY, JSON.stringify(s));
        else sessionStorage.removeItem(LIVE_STUDENT_KEY);
    } catch { /* ignore */ }
}

const isStudentApp = () => window.__AURORA_USER__?.role === 'student';

export default function UseItChecklist({ targets = [], savedId = null, onTargetsChange }) {
    if (isStudentApp()) {
        if (targets.length === 0) return null;
        return (
            <aside aria-label="Try to use" className="rounded-2xl bg-black/35 border border-white/15 backdrop-blur-sm p-4 flex flex-col gap-2">
                <p className="font-display font-semibold text-white text-lg">Try to use</p>
                <ul className="flex flex-col gap-1.5">
                    {targets.map(t => (
                        <li key={t} className="text-white/90 text-base rounded-xl border border-dashed border-white/25 px-3 py-2">{t}</li>
                    ))}
                </ul>
            </aside>
        );
    }
    return <TeacherChecklist targets={targets} savedId={savedId} onTargetsChange={onTargetsChange} />;
}

function TeacherChecklist({ targets, savedId, onTargetsChange }) {
    const [open, setOpen]         = useState(true);
    const [used, setUsed]         = useState(() => new Set());
    const [students, setStudents] = useState([]);
    const [student, setStudent]   = useState(readLiveStudent);
    const [attemptId, setAttemptId] = useState(null);
    const [savedKey, setSavedKey] = useState(null);   // the ticks as last saved, to know when there's something new
    const [status, setStatus]     = useState('idle'); // idle | saving | error
    const [editing, setEditing]   = useState(false);
    const [draft, setDraft]       = useState('');
    const [editErr, setEditErr]   = useState('');

    useEffect(() => {
        axios.get('/api/students')
            .then(({ data }) => {
                const active = data.filter(s => s.is_active !== false);
                setStudents(active);
                // A remembered student this login doesn't have (another account signed in on this tab,
                // or the student was removed) is forgotten rather than left to fail on save.
                setStudent(cur => {
                    if (cur && !active.some(s => s.id === cur.id)) { writeLiveStudent(null); return null; }
                    return cur;
                });
            })
            .catch(() => setStudents([]));
    }, []);

    // A new target list (edited, or a different activity) starts a fresh check.
    useEffect(() => { setUsed(new Set()); setAttemptId(null); setSavedKey(null); }, [targets.join('\n')]);

    const ticksKey = useMemo(() => targets.map((_, i) => (used.has(i) ? 1 : 0)).join(''), [targets, used]);
    const usedCount = used.size;

    function toggle(i) {
        setUsed(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    }

    function pickStudent(e) {
        const s = students.find(x => String(x.id) === e.target.value)
            ?? (student && String(student.id) === e.target.value ? student : null);
        const live = s ? { id: s.id, name: s.name } : null;
        setStudent(live);
        writeLiveStudent(live);
        setAttemptId(null);   // a different student gets their own record
        setSavedKey(null);
    }

    async function save() {
        if (!student || !savedId) return;
        setStatus('saving');
        const body = { targets: targets.map((label, i) => ({ label, used: used.has(i) })) };
        try {
            if (attemptId) {
                await axios.patch(`/api/students/${student.id}/speaking-checks/${attemptId}`, body);
            } else {
                const { data } = await axios.post(`/api/students/${student.id}/speaking-checks`, { activity_id: savedId, ...body });
                setAttemptId(data.id);
            }
            setSavedKey(ticksKey);
            setStatus('idle');
        } catch {
            setStatus('error');
        }
    }

    function startEdit() {
        setDraft(targets.join('\n'));
        setEditErr('');
        setEditing(true);
    }

    async function saveTargets(e) {
        e.preventDefault();
        const next = [...new Set(draft.split('\n').map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 12);
        if (next.some(t => t.length > 80)) { setEditErr('Keep each item under 80 characters.'); return; }
        try {
            if (savedId) await axios.patch(`/api/activities/${savedId}`, { targets: next });
            onTargetsChange?.(next);
            setEditing(false);
        } catch {
            setEditErr('Could not save the list. Please try again.');
        }
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded="false"
                className="self-start rounded-xl bg-black/40 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 cursor-pointer hover:bg-black/55"
            >
                Use it! {targets.length > 0 && <span className="text-[#5be0a4]">{usedCount} / {targets.length}</span>}
            </button>
        );
    }

    const name = student?.name;
    const dirty = savedKey !== ticksKey;
    const canSave = Boolean(student && savedId && targets.length > 0 && dirty && status !== 'saving');

    return (
        <aside aria-label="Use it! checklist" className="rounded-2xl bg-black/40 border border-white/15 backdrop-blur-sm p-4 flex flex-col gap-3 text-white">
            <div className="flex items-center gap-2">
                <p className="font-display font-semibold text-lg flex-1">Use it!</p>
                {targets.length > 0 && <p className="text-sm font-bold text-[#5be0a4] tabular-nums" data-testid="useit-count">{usedCount} / {targets.length}</p>}
                <button type="button" onClick={() => setOpen(false)} aria-expanded="true" aria-label="Hide the checklist"
                    className="text-white/50 hover:text-white text-sm px-2 py-1 cursor-pointer">Hide</button>
            </div>

            <label className="flex flex-col gap-1 text-xs text-white/60">
                Who’s this with?
                <select
                    value={student ? String(student.id) : ''}
                    onChange={pickStudent}
                    className="bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-2 text-sm cursor-pointer"
                >
                    <option value="" className="text-black bg-white">Nobody — don’t save</option>
                    {/* The remembered student shows straight away, before (or even without) the list loading —
                        otherwise the box reads "Nobody" while the ticks would still save to them. */}
                    {student && !students.some(s => s.id === student.id) && (
                        <option value={student.id} className="text-black bg-white">{student.name}</option>
                    )}
                    {students.map(s => <option key={s.id} value={s.id} className="text-black bg-white">{s.name}</option>)}
                </select>
            </label>

            {editing ? (
                <form onSubmit={saveTargets} className="flex flex-col gap-2">
                    <label htmlFor="useit-targets" className="text-xs text-white/60">One item per line — a structure, a phrase or a word group</label>
                    <textarea
                        id="useit-targets"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        rows={6}
                        autoFocus
                        placeholder={'Have you ever…?\nI’ve never…'}
                        className="bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-lg px-3 py-2 text-sm"
                    />
                    {editErr && <p className="text-red-300 text-xs">{editErr}</p>}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setEditing(false)} className="text-white/60 hover:text-white text-sm px-3 py-2 cursor-pointer">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Save list</button>
                    </div>
                </form>
            ) : targets.length === 0 ? (
                <button type="button" onClick={startEdit}
                    className="rounded-xl border border-dashed border-white/30 text-white/80 hover:text-white text-sm px-3 py-3 cursor-pointer">
                    + Add the target language to listen for
                </button>
            ) : (
                <>
                    <p className="text-xs text-white/55">Tick each one when the student uses it.</p>
                    <div className="flex flex-col gap-1.5">
                        {targets.map((t, i) => (
                            <button
                                key={t}
                                type="button"
                                aria-pressed={used.has(i)}
                                onClick={() => toggle(i)}
                                className={`flex items-center gap-2.5 text-left min-h-11 px-3 py-2 rounded-xl text-[15px] cursor-pointer transition-colors ${
                                    used.has(i) ? 'bg-[#1f5c45] border border-[#3fae82] text-white' : 'border border-dashed border-white/30 text-white/90 hover:bg-white/5'
                                }`}
                            >
                                <span className="w-4 shrink-0 font-bold">{used.has(i) ? '✓' : ''}</span>
                                <span>{t}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={save}
                        disabled={!canSave}
                        className="bg-[#e0521f] hover:bg-[#c9461a] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                        {status === 'saving' ? 'Saving…' : name ? `${attemptId ? 'Update' : 'Save to'} ${name}’s progress` : 'Save to progress'}
                    </button>
                    <p className="text-xs text-white/55 -mt-1" role="status">
                        {status === 'error' ? <span className="text-red-300">Could not save. Please try again.</span>
                            : !savedId ? 'Save the activity to the Library first to record ticks.'
                            : !student ? 'Pick a student to save the ticks.'
                            : attemptId && !dirty ? `Saved — ${usedCount} of ${targets.length} used.`
                            : null}
                    </p>
                    <button type="button" onClick={startEdit} className="self-start text-xs text-white/50 hover:text-white underline cursor-pointer">Edit the list</button>
                </>
            )}
        </aside>
    );
}
