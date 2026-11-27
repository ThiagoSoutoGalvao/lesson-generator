import { useEffect, useState } from 'react';
import axios from 'axios';

// "Mark 4B as taught" on an Aurora Business lesson page (2026-11-28). The student app opens lessons only up to
// each student's mark (App\Support\TaughtUpTo); this is how the teacher moves it after class. Every student on
// the course is listed, ticked when they haven't reached this lesson yet — untick one who missed the class.
// The server only moves a mark forward; the Students page can set any lesson.

const rankOf = (l, p) => l * 10 + (String(p || 'A').charCodeAt(0) - 64);
export const markLabel = s => `${s.taught_lesson ?? 1}${s.taught_part ?? 'A'}`;

export default function TaughtMarker({ trilha, lesson, part }) {
    const code = `${lesson}${part}`;
    const [students, setStudents] = useState(null);
    const [open, setOpen] = useState(false);
    const [ticked, setTicked] = useState(new Set());
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        let alive = true;
        axios.get('/api/students')
            .then(({ data }) => { if (alive) setStudents((data ?? []).filter(s => s.trilha === trilha && s.is_active !== false)); })
            .catch(() => { if (alive) setStudents([]); });
        return () => { alive = false; };
    }, [trilha]);

    useEffect(() => { setOpen(false); setMsg(''); }, [code]);

    if (!students) return null;
    const behind = s => rankOf(s.taught_lesson ?? 1, s.taught_part ?? 'A') < rankOf(lesson, part);
    const openFor = students.filter(s => !behind(s));

    function start() {
        setTicked(new Set(students.filter(behind).map(s => s.id)));
        setMsg(''); setOpen(true);
    }
    function toggle(id) {
        setTicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    async function save() {
        setBusy(true); setMsg('');
        try {
            const { data } = await axios.post('/api/students/taught', { trilha, lesson, part, student_ids: [...ticked] });
            const byId = new Map(data.students.map(s => [s.id, s]));
            setStudents(prev => prev.map(s => byId.get(s.id) ?? s));
            setOpen(false);
            setMsg(ticked.size ? `✓ ${code} is open in the student app for ${data.students.map(s => s.name.split(' ')[0]).join(', ')}.` : 'Nobody was ticked, so nothing changed.');
        } catch (e) {
            setMsg(e.response?.data?.message ?? 'Could not save it. Please try again.');
        } finally { setBusy(false); }
    }

    return (
        <section className="ui-card border rounded-2xl px-4 py-3 flex flex-col gap-2" aria-label="Student app" data-testid="taught-marker">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-ui-ink text-sm font-semibold">Student app</span>
                <span className="text-ui-muted text-sm flex-1 min-w-[12rem]">
                    {students.length === 0 ? 'No students on this course yet.'
                        : openFor.length === students.length ? `${code} is open for all ${students.length} students.`
                        : openFor.length ? `${code} is open for ${openFor.length} of ${students.length} students.`
                        : `Students see lessons up to the last one marked as taught — ${code} isn’t open yet.`}
                </span>
                {students.length > 0 && !open && (
                    <button type="button" onClick={start} className="bg-[#e0521f] hover:bg-[#c9461a] text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                        Mark {code} as taught
                    </button>
                )}
            </div>
            {open && (
                <div className="flex flex-col gap-2 pt-1">
                    <p className="text-ui-muted text-sm">Who was in class? They can open every lesson up to {code}.</p>
                    <ul className="flex flex-col gap-1">
                        {students.map(s => (
                            <li key={s.id}>
                                <label className="flex items-center gap-2.5 text-sm text-ui-ink min-h-9 cursor-pointer">
                                    <input type="checkbox" checked={ticked.has(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4 accent-[#e0521f]" />
                                    <span className="font-semibold">{s.name}</span>
                                    <span className="text-ui-muted">· up to {markLabel(s)}{behind(s) ? '' : ' (already here)'}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={save} className="bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">{busy ? 'Saving…' : `Open ${code} for them`}</button>
                        <button type="button" disabled={busy} onClick={() => setOpen(false)} className="border border-ui-line text-ui-ink hover:bg-ui-sel text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Cancel</button>
                    </div>
                </div>
            )}
            {msg && <p className="text-sm text-ui-ink" role="status">{msg}</p>}
        </section>
    );
}
