import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';
import FlashcardActivity from '@/components/FlashcardActivity';
import UnjumbleActivity from '@/components/UnjumbleActivity';
import DialogGapFillActivity from '@/components/DialogGapFillActivity';
import WordCategorisationActivity from '@/components/WordCategorisationActivity';
import TrueFalseActivity from '@/components/TrueFalseActivity';
import McReadingActivity from '@/components/McReadingActivity';
import ReadCompleteActivity from '@/components/ReadCompleteActivity';
import ImageVocabMatchActivity from '@/components/ImageVocabMatchActivity';
import WordFormationActivity from '@/components/WordFormationActivity';
import OddOneOutActivity from '@/components/OddOneOutActivity';
import ClozeActivity from '@/components/ClozeActivity';
import OpenClozeActivity from '@/components/OpenClozeActivity';
import McClozeActivity from '@/components/McClozeActivity';
import DiscussionQuestionsActivity from '@/components/DiscussionQuestionsActivity';
import SentenceTransformationActivity from '@/components/SentenceTransformationActivity';
import ErrorCorrectionActivity from '@/components/ErrorCorrectionActivity';
import GrammarExplainerActivity from '@/components/GrammarExplainerActivity';
import ReadingTextActivity from '@/components/ReadingTextActivity';
import EssayFeedbackActivity from '@/components/EssayFeedbackActivity';
import Spinner from '@/components/Spinner';
import { TRILHAS, TRILHA_NAMES, TRILHA_TOC, LESSON_SLOTS, TEACHERS } from '@/lib/trilhas';

const TYPE_LABELS = {
    quiz:                     'Quiz',
    flashcards:               'Flashcards',
    unjumble:                 'Unjumble',
    dialog_gap_fill:          'Dialog',
    word_categorisation:      'Categorise',
    true_false:               'True / False',
    mc_reading:               'Reading (MC)',
    read_complete:            'Read & Complete',
    image_vocab_match:        'Image Match',
    word_formation:           'Word Formation',
    odd_one_out:              'Odd One Out',
    cloze:                    'Cloze',
    open_cloze:               'Open Cloze',
    mc_cloze:                 'MC Cloze',
    discussion_questions:     'Discussion',
    sentence_transformation:  'Transform',
    error_correction:         'Error Correction',
    grammar_explainer:        'Grammar',
    presentation:             'Presentation',
    reading_text:             'Reading Text',
    essay_feedback:           'Essay Feedback',
};
const TYPE_COLORS = {
    quiz:                    'bg-blue-500/80 text-white',
    flashcards:              'bg-purple-500/80 text-white',
    unjumble:                'bg-orange-500/80 text-white',
    dialog_gap_fill:         'bg-teal-500/80 text-white',
    word_categorisation:     'bg-pink-500/80 text-white',
    true_false:              'bg-indigo-500/80 text-white',
    mc_reading:              'bg-indigo-600/80 text-white',
    read_complete:           'bg-teal-600/80 text-white',
    image_vocab_match:       'bg-cyan-500/80 text-white',
    word_formation:          'bg-lime-500/80 text-white',
    odd_one_out:             'bg-rose-500/80 text-white',
    cloze:                   'bg-amber-500/80 text-white',
    open_cloze:              'bg-amber-600/80 text-white',
    mc_cloze:                'bg-yellow-600/80 text-white',
    discussion_questions:    'bg-sky-500/80 text-white',
    sentence_transformation: 'bg-violet-500/80 text-white',
    error_correction:        'bg-red-500/80 text-white',
    grammar_explainer:       'bg-emerald-500/80 text-white',
    presentation:            'bg-indigo-500/80 text-white',
    reading_text:            'bg-green-600/80 text-white',
    essay_feedback:          'bg-fuchsia-500/80 text-white',
};
const TYPE_FILTERS = [
    'all', 'quiz', 'flashcards', 'unjumble', 'dialog_gap_fill',
    'word_categorisation', 'true_false', 'mc_reading', 'read_complete', 'image_vocab_match',
    'word_formation', 'odd_one_out', 'cloze', 'open_cloze', 'mc_cloze', 'discussion_questions',
    'sentence_transformation', 'error_correction', 'grammar_explainer', 'presentation', 'reading_text', 'essay_feedback',
];

const filterBtnCls = (active) =>
    `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
        active ? 'bg-[#a01789] border-[#a01789] text-white shadow-lg shadow-[#a01789]/25' : 'lg-chip lg-chip-hover text-[#5a1b73] hover:text-[#271d62]'
    }`;

const briefFieldCls = 'bg-[#271d62]/[0.06] border border-[#271d62]/12 text-[#271d62] placeholder:text-[#271d62]/40 rounded-lg px-3 py-2 text-xs w-full resize-y focus:outline-none focus:ring-2 focus:ring-[#a01789]';

const BRIEF_FIELDS = [
    ['target_language', 'Target language', 'e.g. Present continuous — form + one model sentence'],
    ['vocabulary',      'Vocabulary',      '8–15 words/phrases the lesson introduces or recycles'],
    ['level_notes',     'Level notes',     "What students already know; common Portuguese-speaker errors to watch for"],
    ['source',          'Source',          'Coursebook + page range, or "topic prompt only"'],
];

function hasBriefContent(brief) {
    return !!brief && BRIEF_FIELDS.some(([key]) => (brief[key] ?? '').trim() !== '');
}

// Inline editable form for one lesson's brief — expands below its row in the coverage grid.
function LessonBriefEditor({ trilhaName, lessonNum, brief, onSave, onCancel }) {
    const [fields, setFields] = useState(() =>
        Object.fromEntries(BRIEF_FIELDS.map(([key]) => [key, brief?.[key] ?? ''])),
    );
    const [updatedBy, setUpdatedBy] = useState(brief?.updated_by ?? '');
    const [saving, setSaving] = useState(false);
    const toc = TRILHA_TOC[trilhaName]?.[lessonNum] ?? [];

    async function handleSave() {
        setSaving(true);
        try {
            await onSave({ trilha: trilhaName, trilha_lesson: lessonNum, updated_by: updatedBy || null, ...fields });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-3 bg-[#271d62]/[0.05] rounded-xl p-3 mt-1">
            {toc.length > 0 && (
                <div className="bg-[#271d62]/[0.04] border border-[#271d62]/10 rounded-lg p-3">
                    <div className="text-[#271d62]/45 text-[11px] font-semibold uppercase tracking-wide mb-1.5">
                        From the trilha ToC — {trilhaName} · Lesson {lessonNum}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[#271d62]/85 text-xs leading-snug">
                        {toc.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                    <p className="text-[#271d62]/40 text-[10px] mt-2">
                        Reference only — fill in the target language and vocabulary below.
                    </p>
                </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
                {BRIEF_FIELDS.map(([key, label, placeholder]) => (
                    <div key={key} className="flex flex-col gap-1">
                        <label className="text-[#271d62]/55 text-[11px] font-medium">{label}</label>
                        <textarea
                            value={fields[key]}
                            onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            rows={key === 'source' ? 2 : 3}
                            className={briefFieldCls}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-[#271d62]/55 text-[11px] font-medium">Updated by</label>
                <select
                    value={updatedBy}
                    onChange={e => setUpdatedBy(e.target.value)}
                    className="bg-[#271d62]/[0.06] border border-[#271d62]/12 text-[#271d62] text-xs rounded-lg px-2 py-1.5 cursor-pointer"
                >
                    <option value="" className="bg-gray-900">—</option>
                    {TEACHERS.map(t => (
                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                    ))}
                </select>
                <div className="flex-1" />
                <button
                    onClick={onCancel}
                    className="text-[#271d62]/60 hover:text-[#271d62] text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                    Close
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#a01789] hover:bg-[#8a1475] disabled:bg-[#a01789]/30 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                    {saving ? 'Saving…' : 'Save brief'}
                </button>
            </div>
        </div>
    );
}

// Lessons × the 5 baseline slots for one trilha — which slots already have a saved activity,
// plus an inline-editable pedagogical brief per lesson (target language, vocabulary, etc.)
function TrilhaCoverageGrid({ trilhaName, activities, lessonFilter, onSelectLesson, briefs, onSaveBrief }) {
    const meta = TRILHAS[trilhaName];
    const lessons = Array.from({ length: meta.lessons }, (_, i) => i + 1);
    const trilhaActivities = activities.filter(a => a.trilha === trilhaName);
    const [expandedLesson, setExpandedLesson] = useState(null);

    const isFilled = (lessonNum, slot) =>
        trilhaActivities.some(a => a.trilha_lesson === lessonNum && slot.types.includes(a.type));

    const briefFor = (lessonNum) =>
        briefs.find(b => b.trilha === trilhaName && b.trilha_lesson === lessonNum);

    const totalSlots = lessons.length * LESSON_SLOTS.length;
    const filledSlots = lessons.reduce(
        (sum, n) => sum + LESSON_SLOTS.filter(s => isFilled(n, s)).length,
        0,
    );

    return (
        <div className="lg-surface border rounded-2xl p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="font-display text-[#271d62] font-bold text-sm">{meta.label} coverage</h3>
                <span className="text-[#271d62]/60 text-xs shrink-0">{filledSlots} / {totalSlots} slots filled</span>
            </div>
            <table className="w-full text-xs border-separate border-spacing-1 min-w-[480px]">
                <thead>
                    <tr>
                        <th className="text-left text-[#271d62]/55 font-medium pr-2">Lesson</th>
                        {LESSON_SLOTS.map(s => (
                            <th key={s.key} className="text-[#271d62]/55 font-medium px-1 py-1">{s.label}</th>
                        ))}
                        <th className="text-[#271d62]/55 font-medium px-1 py-1">Brief</th>
                    </tr>
                </thead>
                <tbody>
                    {lessons.map(n => {
                        const active = String(n) === lessonFilter;
                        const expanded = expandedLesson === n;
                        const brief = briefFor(n);
                        return (
                            <Fragment key={n}>
                                <tr>
                                    <td>
                                        <button
                                            onClick={() => onSelectLesson(active ? 'all' : String(n))}
                                            className={`text-left font-semibold px-2 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                                                active ? 'bg-[#a01789] text-white' : 'text-[#271d62]/85 hover:bg-[#271d62]/[0.06]'
                                            }`}
                                        >
                                            L{String(n).padStart(2, '0')}
                                        </button>
                                    </td>
                                    {LESSON_SLOTS.map(s => {
                                        const filled = isFilled(n, s);
                                        return (
                                            <td key={s.key} className="text-center">
                                                <span
                                                    title={s.label}
                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-sm ${
                                                        filled ? `${meta.accent} text-white` : 'bg-[#271d62]/[0.04] text-[#271d62]/35 border border-[#271d62]/10'
                                                    }`}
                                                >
                                                    {filled ? '✓' : '·'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td className="text-center">
                                        <button
                                            onClick={() => setExpandedLesson(expanded ? null : n)}
                                            title={hasBriefContent(brief) ? 'Brief started' : 'No brief yet'}
                                            className={`relative inline-flex items-center justify-center w-7 h-7 rounded-md text-sm cursor-pointer transition-colors ${
                                                expanded ? 'bg-[#a01789] text-white' : 'bg-[#271d62]/[0.04] text-[#5a1b73] hover:bg-[#271d62]/10 border border-[#271d62]/10'
                                            }`}
                                        >
                                            📝
                                            {hasBriefContent(brief) && !expanded && (
                                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                                {expanded && (
                                    <tr>
                                        <td colSpan={LESSON_SLOTS.length + 2}>
                                            <LessonBriefEditor
                                                trilhaName={trilhaName}
                                                lessonNum={n}
                                                brief={brief}
                                                onCancel={() => setExpandedLesson(null)}
                                                onSave={onSaveBrief}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function LibraryPage() {
    const [activities, setActivities] = useState([]);
    const [folders, setFolders]       = useState([]);
    const [briefs, setBriefs]         = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [folderFilter, setFolderFilter] = useState('all');
    const [trilhaFilter, setTrilhaFilter] = useState('all'); // 'all' | 'Lights' | 'Glow' | 'Radiant' | '__none__'
    const [lessonFilter, setLessonFilter] = useState('all'); // lesson number as string, or 'all'
    const [launched, setLaunched]     = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);

    useEffect(() => {
        Promise.all([
            axios.get('/api/activities'),
            axios.get('/api/folders'),
            axios.get('/api/trilha-briefs'),
        ])
            .then(([acts, fols, briefsRes]) => {
                setActivities(acts.data);
                setFolders(fols.data);
                setBriefs(briefsRes.data);
            })
            .catch(err => {
                setError(err.response?.data?.message ?? err.message ?? 'Failed to load activities');
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleSaveBrief(payload) {
        const { data } = await axios.put('/api/trilha-briefs', payload);
        setBriefs(prev => {
            const rest = prev.filter(b => !(b.trilha === data.trilha && b.trilha_lesson === data.trilha_lesson));
            return [...rest, data];
        });
    }

    function handleDelete(id) {
        if (!confirm('Delete this activity?')) return;
        axios.delete(`/api/activities/${id}`)
            .then(() => setActivities(prev => prev.filter(a => a.id !== id)))
            .catch(() => alert('Could not delete the activity. Please try again.'));
    }

    if (launched) {
        const props = { activity: launched, onClose: () => setLaunched(null) };
        if (launched.type === 'quiz')                    return <QuizActivity quiz={launched} onClose={props.onClose} />;
        if (launched.type === 'flashcards')              return <FlashcardActivity {...props} />;
        if (launched.type === 'unjumble')                return <UnjumbleActivity {...props} />;
        if (launched.type === 'dialog_gap_fill')         return <DialogGapFillActivity {...props} />;
        if (launched.type === 'word_categorisation')     return <WordCategorisationActivity {...props} />;
        if (launched.type === 'true_false')              return <TrueFalseActivity {...props} />;
        if (launched.type === 'mc_reading')              return <McReadingActivity {...props} />;
        if (launched.type === 'read_complete')           return <ReadCompleteActivity {...props} />;
        if (launched.type === 'image_vocab_match')       return <ImageVocabMatchActivity {...props} />;
        if (launched.type === 'word_formation')          return <WordFormationActivity {...props} />;
        if (launched.type === 'odd_one_out')             return <OddOneOutActivity {...props} />;
        if (launched.type === 'cloze')                   return <ClozeActivity {...props} />;
        if (launched.type === 'open_cloze')              return <OpenClozeActivity {...props} />;
        if (launched.type === 'mc_cloze')                return <McClozeActivity {...props} />;
        if (launched.type === 'discussion_questions')    return <DiscussionQuestionsActivity {...props} />;
        if (launched.type === 'sentence_transformation') return <SentenceTransformationActivity {...props} />;
        if (launched.type === 'error_correction')        return <ErrorCorrectionActivity {...props} />;
        if (launched.type === 'grammar_explainer')       return <GrammarExplainerActivity {...props} />;
        if (launched.type === 'presentation')            return <GrammarExplainerActivity {...props} />;
        if (launched.type === 'reading_text')            return <ReadingTextActivity {...props} onDerive={setLaunched} />;
        if (launched.type === 'essay_feedback')           return <EssayFeedbackActivity {...props} />;
    }

    const hasTrilhaActivities = activities.some(a => a.trilha);

    function selectTrilha(t) {
        setTrilhaFilter(t);
        setLessonFilter('all');
    }

    const filtered = activities.filter(a => {
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        if (folderFilter !== 'all') {
            if (folderFilter === '__none__') return !a.folder;
            if (a.folder !== folderFilter) return false;
        }
        if (trilhaFilter !== 'all') {
            if (trilhaFilter === '__none__') {
                if (a.trilha) return false;
            } else {
                if (a.trilha !== trilhaFilter) return false;
                if (lessonFilter !== 'all' && String(a.trilha_lesson) !== lessonFilter) return false;
            }
        }
        return true;
    });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display lg-shell-text text-3xl font-bold text-[#271d62]">Activity Library</h2>
                <p className="lg-shell-text text-[#271d62]/80 mt-1 text-sm">Your saved activities — relaunch them any time.</p>
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(f => (
                    <button key={f} onClick={() => setTypeFilter(f)} className={filterBtnCls(typeFilter === f)}>
                        {f === 'all' ? 'All types' : TYPE_LABELS[f]}
                    </button>
                ))}
            </div>

            {/* Trilha filter — only shown once at least one trilha activity has been saved */}
            {hasTrilhaActivities && (
                <div className="flex flex-wrap gap-2 border-t border-[#271d62]/10 pt-4">
                    <span className="text-[#271d62]/45 text-xs self-center mr-1">Trilha:</span>
                    <button onClick={() => selectTrilha('all')} className={filterBtnCls(trilhaFilter === 'all')}>
                        All
                    </button>
                    {TRILHA_NAMES.map(t => (
                        <button key={t} onClick={() => selectTrilha(t)} className={filterBtnCls(trilhaFilter === t)}>
                            {TRILHAS[t].label}
                        </button>
                    ))}
                    <button onClick={() => selectTrilha('__none__')} className={filterBtnCls(trilhaFilter === '__none__')}>
                        One-off
                    </button>
                </div>
            )}

            {/* Coverage grid — which of the trilha's lessons already have each of the 5 baseline activities */}
            {trilhaFilter !== 'all' && trilhaFilter !== '__none__' && (
                <TrilhaCoverageGrid
                    trilhaName={trilhaFilter}
                    activities={activities}
                    lessonFilter={lessonFilter}
                    onSelectLesson={setLessonFilter}
                    briefs={briefs}
                    onSaveBrief={handleSaveBrief}
                />
            )}

            {/* Folder filter — only shown if there are any folders */}
            {folders.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-[#271d62]/10 pt-4">
                    <span className="text-[#271d62]/45 text-xs self-center mr-1">Folder:</span>
                    <button onClick={() => setFolderFilter('all')} className={filterBtnCls(folderFilter === 'all')}>
                        All
                    </button>
                    {folders.map(f => (
                        <button key={f} onClick={() => setFolderFilter(f)} className={filterBtnCls(folderFilter === f)}>
                            {f}
                        </button>
                    ))}
                    <button onClick={() => setFolderFilter('__none__')} className={filterBtnCls(folderFilter === '__none__')}>
                        No folder
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-12">
                    <Spinner message="Loading activities…" color="text-[#5a1b73]" textColor="text-[#271d62]/55" />
                </div>
            )}

            {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="lg-shell-text text-center py-20 text-[#271d62]/80">
                    <p className="text-lg">No saved activities yet.</p>
                    <p className="text-sm mt-1">Generate an activity and click Save to add it here.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(a => (
                    <div
                        key={a.id}
                        className="lg-surface lg-surface-hover border rounded-2xl p-5 flex flex-col gap-3 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display text-xl font-bold text-[#271d62] leading-snug min-w-0 break-words">{a.name}</h3>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${TYPE_COLORS[a.type]}`}>
                                {TYPE_LABELS[a.type]}
                            </span>
                        </div>

                        {(a.trilha || a.book || a.lesson) && (
                            <div className="flex gap-2 flex-wrap">
                                {a.trilha && (
                                    <span className={`text-xs font-semibold text-white px-2.5 py-1 rounded-full ${TRILHAS[a.trilha]?.accent ?? 'bg-[#271d62]/[0.06]'}`}>
                                        {TRILHAS[a.trilha]?.label ?? a.trilha}{a.trilha_lesson ? ` · L${String(a.trilha_lesson).padStart(2, '0')}` : ''}
                                    </span>
                                )}
                                {a.book && (
                                    <span className="text-xs bg-[#271d62]/[0.06] text-[#271d62]/90 px-2.5 py-1 rounded-full border border-[#271d62]/10">
                                        {a.book}
                                    </span>
                                )}
                                {a.lesson && (
                                    <span className="text-xs bg-[#271d62]/[0.06] text-[#271d62]/90 px-2.5 py-1 rounded-full border border-[#271d62]/10">
                                        {a.lesson}
                                    </span>
                                )}
                            </div>
                        )}

                        {a.folder && (
                            <p className="text-xs text-[#271d62]/85">📁 {a.folder}</p>
                        )}

                        {a.built_by && (
                            <p className="text-xs text-[#271d62]/60">👤 Built by {a.built_by}</p>
                        )}

                        <p className="text-xs text-[#5a1b73] mt-auto">
                            {new Date(a.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </p>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setLaunched(a.content)}
                                className="flex-1 bg-[#a01789] hover:bg-[#8a1475] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer border border-[#a01789]"
                            >
                                Launch
                            </button>
                            <button
                                onClick={() => handleDelete(a.id)}
                                className="bg-[#271d62]/[0.06] hover:bg-red-500 text-[#271d62]/60 hover:text-white text-sm px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-[#271d62]/12"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
