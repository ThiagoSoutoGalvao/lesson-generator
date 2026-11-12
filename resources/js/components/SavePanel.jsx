import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    TRILHAS, TRILHA_NAMES, TEACHERS, TYPE_LABELS, composeActivityName, trilhaParts,
} from '@/lib/trilhas';
import { getLessonSession, setLessonSession } from '@/lib/lessonSession';
import { tidyText, collapse, tidyFocus, focusHints, wordCount, MAX_FOCUS_WORDS } from '@/lib/naming';
import { STAGES, defaultStage } from '@/lib/stages';
import { useIsLightUi } from '@/lib/uiTheme';

const fieldCls = 'bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';
const selectCls = `${fieldCls} appearance-none cursor-pointer`;
const labelCls = 'text-white/70 text-xs font-medium';
// Aurora Business light theme (2026-11-12): the same panel in white, indigo text and the coral accent — the dark one
// looked out of place over the light screens. Dark strings above are unchanged.
const fieldClsL = 'bg-white border border-[#C6CCD6] text-[#271D62] placeholder:text-[#8A93A3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E0521F]/35 focus:border-[#E0521F] w-full';
const selectClsL = `${fieldClsL} appearance-none cursor-pointer`;
const labelClsL = 'text-[#4A5163] text-xs font-semibold';

const LS_TRILHA = 'aurora.save.trilha';
const LS_BUILT_BY = 'aurora.save.builtBy';

function lsGet(key) {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export default function SavePanel({ activity, onDone, onSaved }) {
    const light = useIsLightUi();
    const k = (dark, lite) => (light ? lite : dark);
    const fieldC = k(fieldCls, fieldClsL), selectC = k(selectCls, selectClsL), labelC = k(labelCls, labelClsL);
    const [mode, setMode] = useState('trilha'); // 'trilha' | 'freeform'
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Trilha mode — pre-filled from the active lesson session if there is one
    // (the teacher is mid-way through building a lesson), else just the last
    // trilha used.
    const session = getLessonSession();
    const [trilha, setTrilha]     = useState(() => session?.trilha ?? lsGet(LS_TRILHA));
    const [lesson, setLesson]     = useState(() => (session ? String(session.lesson) : ''));
    // Which lesson of the unit (1A / 1B / 1C) — from the lesson pack the teacher came from, else A.
    const [part, setPart]         = useState(() => session?.part ?? 'A');
    const [focus, setFocus]       = useState('');
    const [builtBy, setBuiltBy]   = useState(() => lsGet(LS_BUILT_BY));
    // Lesson-pack stage — pre-picked from the type (lib/stages.js); the teacher confirms or changes it.
    const [stage, setStage]       = useState(() => session?.stage ?? defaultStage(activity.type));

    // Freeform mode
    const [name, setName]       = useState('');
    const [book, setBook]       = useState('');
    const [freeLesson, setFreeLesson] = useState('');
    const [folder, setFolder]   = useState('');
    const [folders, setFolders] = useState([]);

    useEffect(() => {
        axios.get('/api/folders').then(({ data }) => setFolders(data)).catch(() => null);
    }, []);

    const typeLabel = TYPE_LABELS[activity.type] ?? activity.type;
    const lessonCount = trilha ? TRILHAS[trilha].lessons : 0;
    const parts = trilhaParts(trilha);
    const savedPart = parts.includes(part) ? part : null;

    // What is saved is the tidied Focus (single spaces, no underscores or " · ", sentence case) — see lib/naming.js.
    const cleanFocus  = useMemo(() => tidyFocus(focus), [focus]);
    const focusWords  = wordCount(cleanFocus);
    const hints       = useMemo(() => focusHints(focus, { typeLabel }), [focus, typeLabel]);
    const cleanName   = tidyText(name);

    const composedName = useMemo(
        () => composeActivityName({ trilha, lesson, part: savedPart, type: activity.type, focus: cleanFocus }),
        [trilha, lesson, savedPart, activity.type, cleanFocus],
    );

    const trilhaValid = trilha && lesson && stage && cleanFocus && builtBy;

    async function handleSave(e) {
        e.preventDefault();
        setStatus('saving');

        const payload = mode === 'trilha'
            ? {
                name: composedName,
                type: activity.type,
                content: activity,
                trilha,
                trilha_lesson: Number(lesson),
                trilha_part: savedPart,
                stage,
                built_by: builtBy,
            }
            : {
                name: cleanName,
                type: activity.type,
                content: activity,
                book: collapse(book) || null,
                lesson: collapse(freeLesson) || null,
                folder: collapse(folder) || null,
            };

        try {
            const { data } = await axios.post('/api/activities', payload);
            onSaved?.(data);
            if (mode === 'trilha') {
                lsSet(LS_TRILHA, trilha);
                lsSet(LS_BUILT_BY, builtBy);
                setLessonSession(trilha, Number(lesson), null, savedPart);
            }
            setStatus('saved');
            setTimeout(onDone, 1200);
        } catch (err) {
            // Show what actually failed. A bare "please try again" hid a real
            // validation error (an activity type missing from the store()
            // validator) behind what looked like a flaky network.
            setErrorMsg(err.response?.data?.message ?? 'Failed to save. Please try again.');
            setStatus('error');
        }
    }

    if (status === 'saved') {
        return (
            <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-6">
                <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                    ✓ Activity saved!
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-4 px-4">
            {/* Never taller than the screen: it sits over a full-screen activity that doesn't scroll, so on a short
                window the Save button would otherwise end up below the edge, out of reach. */}
            <form
                onSubmit={handleSave}
                className={k('bg-gray-900/95 backdrop-blur border border-white/20 rounded-2xl px-6 py-5 shadow-2xl flex flex-col gap-3.5 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain', 'bg-white border border-[#DDE1E8] text-[#271D62] rounded-2xl px-6 py-5 shadow-[0_20px_50px_rgba(39,29,98,0.25)] flex flex-col gap-3.5 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain')}
            >
                {/* Mode toggle */}
                <div className={k('flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1', 'flex gap-1 bg-[#F1F2F5] border border-[#DDE1E8] rounded-lg p-1')}>
                    {[['trilha', 'Trilha activity'], ['freeform', 'One-off']].map(([m, label]) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
                                mode === m ? k('bg-blue-600 text-white', 'bg-[#E0521F] text-white') : k('text-white/55 hover:text-white', 'text-[#4A5163] hover:text-[#271D62]')
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {mode === 'trilha' ? (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <label className={labelC}>Trilha</label>
                                <select
                                    value={trilha}
                                    onChange={e => { setTrilha(e.target.value); setLesson(''); }}
                                    required
                                    className={selectC}
                                >
                                    <option value="" className={k('bg-gray-900', 'bg-white text-[#271D62]')}>Choose…</option>
                                    {TRILHA_NAMES.map(t => (
                                        <option key={t} value={t} className={k('bg-gray-900', 'bg-white text-[#271D62]')}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={labelC}>{parts.length ? 'Unit' : 'Lesson'}</label>
                                <select
                                    value={lesson}
                                    onChange={e => setLesson(e.target.value)}
                                    required
                                    disabled={!trilha}
                                    className={`${selectC} disabled:opacity-40`}
                                >
                                    <option value="" className={k('bg-gray-900', 'bg-white text-[#271D62]')}>—</option>
                                    {Array.from({ length: lessonCount }, (_, i) => i + 1).map(n => (
                                        <option key={n} value={n} className={k('bg-gray-900', 'bg-white text-[#271D62]')}>{parts.length ? 'Unit' : 'Lesson'} {n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {parts.length > 0 && (
                            <fieldset className="flex flex-col gap-1">
                                <legend className={`${labelC} mb-1`}>Lesson of the unit</legend>
                                <div className={k('grid grid-cols-3 gap-1 bg-white/5 border border-white/10 rounded-lg p-1', 'grid grid-cols-3 gap-1 bg-[#F1F2F5] border border-[#DDE1E8] rounded-lg p-1')}>
                                    {parts.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            aria-pressed={part === p}
                                            onClick={() => setPart(p)}
                                            className={`text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
                                                part === p ? k('bg-blue-600 text-white', 'bg-[#E0521F] text-white') : k('text-white/55 hover:text-white', 'text-[#4A5163] hover:text-[#271D62]')
                                            }`}
                                        >
                                            {lesson || '#'}{p}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        <fieldset className="flex flex-col gap-1">
                            <legend className={`${labelC} mb-1`}>Stage in the lesson</legend>
                            <div className={k('grid grid-cols-4 gap-1 bg-white/5 border border-white/10 rounded-lg p-1', 'grid grid-cols-4 gap-1 bg-[#F1F2F5] border border-[#DDE1E8] rounded-lg p-1')}>
                                {STAGES.map(s => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        aria-pressed={stage === s.key}
                                        title={s.hint}
                                        onClick={() => setStage(s.key)}
                                        className={`text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
                                            stage === s.key ? k('bg-blue-600 text-white', 'bg-[#E0521F] text-white') : k('text-white/55 hover:text-white', 'text-[#4A5163] hover:text-[#271D62]')
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            <p className={k('text-white/40 text-[11px]', 'text-[#5B6472] text-[11px]')}>{STAGES.find(s => s.key === stage)?.hint}</p>
                        </fieldset>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between gap-2">
                                <label htmlFor="save-focus" className={labelC}>Focus — the specific language point</label>
                                <span className={`text-[11px] tabular-nums ${focusWords > MAX_FOCUS_WORDS ? k('text-amber-300', 'text-[#92400E]') : k('text-white/35', 'text-[#5B6472]')}`}>
                                    {focusWords} / {MAX_FOCUS_WORDS} words
                                </span>
                            </div>
                            <input
                                id="save-focus"
                                value={focus}
                                onChange={e => setFocus(e.target.value)}
                                required
                                maxLength={60}
                                autoFocus
                                autoComplete="off"
                                placeholder="e.g. Present continuous & everyday verbs"
                                className={fieldC}
                            />
                            {hints.length > 0 && (
                                <ul data-testid="focus-hints" className={k('text-amber-300 text-[11px] leading-snug list-disc pl-4 space-y-0.5', 'text-[#92400E] text-[11px] leading-snug list-disc pl-4 space-y-0.5')}>
                                    {hints.map(h => <li key={h}>{h}</li>)}
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={labelC}>Built by</label>
                            <select
                                value={builtBy}
                                onChange={e => setBuiltBy(e.target.value)}
                                required
                                className={selectC}
                            >
                                <option value="" className={k('bg-gray-900', 'bg-white text-[#271D62]')}>Choose your name…</option>
                                {TEACHERS.map(t => (
                                    <option key={t} value={t} className={k('bg-gray-900', 'bg-white text-[#271D62]')}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className={k('rounded-lg bg-white/5 border border-white/10 px-3 py-2', 'rounded-lg bg-[#F6F7F9] border border-[#DDE1E8] px-3 py-2')}>
                            <p className={k('text-white/40 text-[10px] uppercase tracking-wide mb-0.5', 'text-[#5B6472] text-[10px] uppercase tracking-wide mb-0.5')}>Saves as</p>
                            <p className={k('text-white/90 text-xs font-mono break-words', 'text-[#271D62] text-xs font-mono break-words')}>
                                {composedName || `${typeLabel} · …`}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <p className={k('text-white/45 text-xs', 'text-[#5B6472] text-xs')}>For experiments and non-trilha material.</p>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            autoFocus
                            autoComplete="off"
                            placeholder="Activity name"
                            className={fieldC}
                        />
                        {cleanName && cleanName !== name && (
                            <p className={k('text-white/45 text-[11px] -mt-1.5', 'text-[#5B6472] text-[11px] -mt-1.5')}>Saves as: <span className={k('font-mono text-white/70', 'font-mono text-[#271D62]')}>{cleanName}</span></p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                value={book}
                                onChange={e => setBook(e.target.value)}
                                placeholder="Book (optional)"
                                className={fieldC}
                            />
                            <input
                                value={freeLesson}
                                onChange={e => setFreeLesson(e.target.value)}
                                placeholder="Lesson (optional)"
                                className={fieldC}
                            />
                        </div>
                        <input
                            value={folder}
                            onChange={e => setFolder(e.target.value)}
                            list="folder-list"
                            placeholder="Folder (optional)"
                            className={fieldC}
                        />
                        <datalist id="folder-list">
                            {folders.map(f => <option key={f} value={f} />)}
                        </datalist>
                    </>
                )}

                {status === 'error' && (
                    <p className={k('text-red-400 text-xs', 'text-[#B42318] text-xs')}>{errorMsg}</p>
                )}

                <div className="flex gap-2 justify-end pt-0.5">
                    <button
                        type="button"
                        onClick={onDone}
                        className={k('text-white/60 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer', 'text-[#4A5163] hover:text-[#271D62] hover:bg-[#F1F2F5] text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={status === 'saving' || (mode === 'trilha' ? !trilhaValid : !cleanName)}
                        className={k('bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer', 'bg-[#E0521F] hover:bg-[#C9461A] disabled:bg-[#E0521F]/40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer')}
                    >
                        {status === 'saving' ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}
