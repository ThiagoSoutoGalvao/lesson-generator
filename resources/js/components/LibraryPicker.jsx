import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { TRILHAS, TYPE_LABELS, composeActivityName, partOf, focusFromName } from '@/lib/trilhas';
import { STAGE_LABELS } from '@/lib/stages';
import { tidyFocus } from '@/lib/naming';

// "+ From Library" on a lesson pack: pick any activity of this account and a COPY of it goes into this lesson +
// stage. The original never moves — an older one-off stays available as homework or an extra, and an activity
// already in another lesson keeps its place there. Nothing is generated (no AI credits).

const FILTERS = [
    { key: 'all',    label: 'All' },
    { key: 'oneoff', label: 'Not in a lesson' },
    { key: 'course', label: 'Other lessons of this course' },
    { key: 'other',  label: 'Other courses' },
];

// Never lesson material: essay feedback is about one student's own writing.
const HIDDEN_TYPES = ['essay_feedback'];

export default function LibraryPicker({ library, trilha, lesson, part, stage, onCopied, onClose }) {
    const [query, setQuery]   = useState('');
    const [filter, setFilter] = useState('all');
    const [status, setStatus] = useState({}); // activity id → 'busy' | 'done' | error message

    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const code = `${lesson}${part ?? ''}`;
    const isHere = a => a.trilha === trilha && a.trilha_lesson === lesson && (!part || partOf(a) === part);

    const where = a => {
        if (!a.trilha || !a.trilha_lesson) return ['One-off', a.folder && `folder “${a.folder}”`].filter(Boolean).join(' · ');
        const label = TRILHAS[a.trilha]?.label ?? a.trilha;
        const lessonCode = `${a.trilha_lesson}${TRILHAS[a.trilha]?.parts?.length ? partOf(a) : ''}`;
        return [`${label} · Lesson ${lessonCode}`, a.stage && STAGE_LABELS[a.stage]].filter(Boolean).join(' · ');
    };

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return library
            .filter(a => !HIDDEN_TYPES.includes(a.type) && !isHere(a))
            .filter(a => {
                if (filter === 'oneoff') return !a.trilha || !a.trilha_lesson;
                if (filter === 'course') return a.trilha === trilha && a.trilha_lesson;
                if (filter === 'other')  return a.trilha && a.trilha !== trilha && a.trilha_lesson;
                return true;
            })
            .filter(a => !q || a.name.toLowerCase().includes(q) || (TYPE_LABELS[a.type] ?? a.type).toLowerCase().includes(q));
    }, [library, query, filter, trilha, lesson, part]);

    async function copy(a) {
        setStatus(s => ({ ...s, [a.id]: 'busy' }));
        try {
            const focus = tidyFocus(focusFromName(a.name)).split(' ').slice(0, 8).join(' ') || TYPE_LABELS[a.type] || a.type;
            const { data } = await axios.post(`/api/activities/${a.id}/copy`, {
                name: composeActivityName({ trilha, lesson, part, type: a.type, focus }),
                trilha, trilha_lesson: lesson, trilha_part: part ?? 'A', stage,
            });
            onCopied(data);
            setStatus(s => ({ ...s, [a.id]: 'done' }));
        } catch (err) {
            setStatus(s => ({ ...s, [a.id]: err.response?.data?.message ?? 'Could not copy it. Please try again.' }));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-[#0a061c]/75 px-4 py-6 sm:py-12" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="library-picker-title" data-testid="library-picker"
                className="w-full max-w-3xl bg-[#241a5c] border border-white/15 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[#ffb59a] text-[11px] font-bold tracking-[0.12em] uppercase">Add from Library</p>
                        <h2 id="library-picker-title" className="font-display text-xl font-bold text-white mt-1">
                            {TRILHAS[trilha]?.label ?? trilha} · Lesson {code} · {STAGE_LABELS[stage]}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 grid place-items-center rounded-xl border border-white/20 text-white hover:bg-white/10 cursor-pointer">✕</button>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="library-search" className="text-white/70 text-sm">Search your Library</label>
                    <input id="library-search" type="search" value={query} onChange={e => setQuery(e.target.value)} autoFocus autoComplete="off"
                        placeholder="A name or a type, e.g. present perfect, quiz"
                        className="bg-black/25 border border-white/20 text-white placeholder:text-white/35 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc6840]" />
                </div>

                <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}
                            className={`text-sm px-3.5 py-1.5 rounded-full border cursor-pointer text-white ${filter === f.key ? 'bg-[#fc6840]/25 border-[#fc6840] font-semibold' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                <ul className="flex flex-col gap-2" aria-label="Activities">
                    {rows.length === 0 && <li className="text-white/55 text-sm py-6 text-center">Nothing matches.</li>}
                    {rows.map(a => {
                        const st = status[a.id];
                        return (
                            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-black/25 border border-white/10 px-4 py-3" data-testid="library-row">
                                <div className="flex-1 min-w-[14rem]">
                                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#ffb59a]">{TYPE_LABELS[a.type] ?? a.type}</span>
                                    <p className="text-white text-sm font-medium break-words">{a.name}</p>
                                    <p className="text-white/55 text-xs mt-0.5">{where(a)}</p>
                                </div>
                                {st === 'done' ? (
                                    <span role="status" className="text-sm font-semibold text-[#5be0a4]">Copied to {code} ✓</span>
                                ) : (
                                    <button type="button" onClick={() => copy(a)} disabled={st === 'busy'}
                                        className="bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-60 disabled:cursor-wait text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                                        {st === 'busy' ? 'Copying…' : 'Copy here'}
                                    </button>
                                )}
                                {st && st !== 'busy' && st !== 'done' && <p className="basis-full text-red-300 text-xs" role="alert">{st}</p>}
                            </li>
                        );
                    })}
                </ul>

                <p className="text-white/65 text-xs border-t border-white/10 pt-3">
                    The original stays where it is: an older activity can still be set as homework or used as an extra.
                    Only activities saved on this login are listed.
                </p>
            </div>
        </div>
    );
}
