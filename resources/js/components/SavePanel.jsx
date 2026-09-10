import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    TRILHAS, TRILHA_NAMES, TEACHERS, TYPE_LABELS, composeActivityName,
} from '@/lib/trilhas';
import { getLessonSession, setLessonSession } from '@/lib/lessonSession';

const fieldCls = 'bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';
const selectCls = `${fieldCls} appearance-none cursor-pointer`;
const labelCls = 'text-white/70 text-xs font-medium';

const LS_TRILHA = 'aurora.save.trilha';
const LS_BUILT_BY = 'aurora.save.builtBy';

function lsGet(key) {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export default function SavePanel({ activity, onDone }) {
    const [mode, setMode] = useState('trilha'); // 'trilha' | 'freeform'
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Trilha mode — pre-filled from the active lesson session if there is one
    // (the teacher is mid-way through building a lesson), else just the last
    // trilha used.
    const session = getLessonSession();
    const [trilha, setTrilha]     = useState(() => session?.trilha ?? lsGet(LS_TRILHA));
    const [lesson, setLesson]     = useState(() => (session ? String(session.lesson) : ''));
    const [focus, setFocus]       = useState('');
    const [builtBy, setBuiltBy]   = useState(() => lsGet(LS_BUILT_BY));

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

    const composedName = useMemo(
        () => composeActivityName({ trilha, lesson, type: activity.type, focus }),
        [trilha, lesson, activity.type, focus],
    );

    const trilhaValid = trilha && lesson && focus.trim() && builtBy;

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
                built_by: builtBy,
            }
            : {
                name,
                type: activity.type,
                content: activity,
                book: book.trim() || null,
                lesson: freeLesson.trim() || null,
                folder: folder.trim() || null,
            };

        try {
            await axios.post('/api/activities', payload);
            if (mode === 'trilha') {
                lsSet(LS_TRILHA, trilha);
                lsSet(LS_BUILT_BY, builtBy);
                setLessonSession(trilha, Number(lesson));
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
            <form
                onSubmit={handleSave}
                className="bg-gray-900/95 backdrop-blur border border-white/20 rounded-2xl px-6 py-5 shadow-2xl flex flex-col gap-3.5 w-full max-w-md"
            >
                {/* Mode toggle */}
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                    {[['trilha', 'Trilha activity'], ['freeform', 'One-off']].map(([m, label]) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
                                mode === m ? 'bg-blue-600 text-white' : 'text-white/55 hover:text-white'
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
                                <label className={labelCls}>Trilha</label>
                                <select
                                    value={trilha}
                                    onChange={e => { setTrilha(e.target.value); setLesson(''); }}
                                    required
                                    className={selectCls}
                                >
                                    <option value="" className="bg-gray-900">Choose…</option>
                                    {TRILHA_NAMES.map(t => (
                                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className={labelCls}>Lesson</label>
                                <select
                                    value={lesson}
                                    onChange={e => setLesson(e.target.value)}
                                    required
                                    disabled={!trilha}
                                    className={`${selectCls} disabled:opacity-40`}
                                >
                                    <option value="" className="bg-gray-900">—</option>
                                    {Array.from({ length: lessonCount }, (_, i) => i + 1).map(n => (
                                        <option key={n} value={n} className="bg-gray-900">Lesson {n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={labelCls}>Focus — the specific language point</label>
                            <input
                                value={focus}
                                onChange={e => setFocus(e.target.value)}
                                required
                                maxLength={60}
                                autoFocus
                                placeholder="e.g. Present continuous & everyday verbs"
                                className={fieldCls}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={labelCls}>Built by</label>
                            <select
                                value={builtBy}
                                onChange={e => setBuiltBy(e.target.value)}
                                required
                                className={selectCls}
                            >
                                <option value="" className="bg-gray-900">Choose your name…</option>
                                {TEACHERS.map(t => (
                                    <option key={t} value={t} className="bg-gray-900">{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                            <p className="text-white/40 text-[10px] uppercase tracking-wide mb-0.5">Saves as</p>
                            <p className="text-white/90 text-xs font-mono break-words">
                                {composedName || `${typeLabel} · …`}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-white/45 text-xs">For experiments and non-trilha material.</p>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            autoFocus
                            placeholder="Activity name"
                            className={fieldCls}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                value={book}
                                onChange={e => setBook(e.target.value)}
                                placeholder="Book (optional)"
                                className={fieldCls}
                            />
                            <input
                                value={freeLesson}
                                onChange={e => setFreeLesson(e.target.value)}
                                placeholder="Lesson (optional)"
                                className={fieldCls}
                            />
                        </div>
                        <input
                            value={folder}
                            onChange={e => setFolder(e.target.value)}
                            list="folder-list"
                            placeholder="Folder (optional)"
                            className={fieldCls}
                        />
                        <datalist id="folder-list">
                            {folders.map(f => <option key={f} value={f} />)}
                        </datalist>
                    </>
                )}

                {status === 'error' && (
                    <p className="text-red-400 text-xs">{errorMsg}</p>
                )}

                <div className="flex gap-2 justify-end pt-0.5">
                    <button
                        type="button"
                        onClick={onDone}
                        className="text-white/60 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={status === 'saving' || (mode === 'trilha' && !trilhaValid)}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        {status === 'saving' ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}
