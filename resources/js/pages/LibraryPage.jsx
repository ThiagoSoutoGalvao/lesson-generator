import { useEffect, useState } from 'react';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';
import FlashcardActivity from '@/components/FlashcardActivity';
import UnjumbleActivity from '@/components/UnjumbleActivity';
import DialogGapFillActivity from '@/components/DialogGapFillActivity';
import WordCategorisationActivity from '@/components/WordCategorisationActivity';
import TrueFalseActivity from '@/components/TrueFalseActivity';
import ImageVocabMatchActivity from '@/components/ImageVocabMatchActivity';
import WordFormationActivity from '@/components/WordFormationActivity';
import OddOneOutActivity from '@/components/OddOneOutActivity';
import ClozeActivity from '@/components/ClozeActivity';
import DiscussionQuestionsActivity from '@/components/DiscussionQuestionsActivity';
import SentenceTransformationActivity from '@/components/SentenceTransformationActivity';
import ErrorCorrectionActivity from '@/components/ErrorCorrectionActivity';
import GrammarExplainerActivity from '@/components/GrammarExplainerActivity';
import Spinner from '@/components/Spinner';

const TYPE_LABELS = {
    quiz:                     'Quiz',
    flashcards:               'Flashcards',
    unjumble:                 'Unjumble',
    dialog_gap_fill:          'Dialog',
    word_categorisation:      'Categorise',
    true_false:               'True / False',
    image_vocab_match:        'Image Match',
    word_formation:           'Word Formation',
    odd_one_out:              'Odd One Out',
    cloze:                    'Cloze',
    discussion_questions:     'Discussion',
    sentence_transformation:  'Transform',
    error_correction:         'Error Correction',
    grammar_explainer:        'Grammar',
};
const TYPE_COLORS = {
    quiz:                    'bg-blue-500/80 text-white',
    flashcards:              'bg-purple-500/80 text-white',
    unjumble:                'bg-orange-500/80 text-white',
    dialog_gap_fill:         'bg-teal-500/80 text-white',
    word_categorisation:     'bg-pink-500/80 text-white',
    true_false:              'bg-indigo-500/80 text-white',
    image_vocab_match:       'bg-cyan-500/80 text-white',
    word_formation:          'bg-lime-500/80 text-white',
    odd_one_out:             'bg-rose-500/80 text-white',
    cloze:                   'bg-amber-500/80 text-white',
    discussion_questions:    'bg-sky-500/80 text-white',
    sentence_transformation: 'bg-violet-500/80 text-white',
    error_correction:        'bg-red-500/80 text-white',
    grammar_explainer:       'bg-emerald-500/80 text-white',
};
const TYPE_FILTERS = [
    'all', 'quiz', 'flashcards', 'unjumble', 'dialog_gap_fill',
    'word_categorisation', 'true_false', 'image_vocab_match',
    'word_formation', 'odd_one_out', 'cloze', 'discussion_questions',
    'sentence_transformation', 'error_correction', 'grammar_explainer',
];

const filterBtnCls = (active) =>
    `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
        active ? 'bg-white/25 text-white' : 'bg-white/8 text-white/55 hover:bg-white/15 hover:text-white border border-white/10'
    }`;

export default function LibraryPage() {
    const [activities, setActivities] = useState([]);
    const [folders, setFolders]       = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [folderFilter, setFolderFilter] = useState('all');
    const [launched, setLaunched]     = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);

    useEffect(() => {
        Promise.all([
            axios.get('/api/activities'),
            axios.get('/api/folders'),
        ])
            .then(([acts, fols]) => {
                setActivities(acts.data);
                setFolders(fols.data);
            })
            .catch(err => {
                setError(err.response?.data?.message ?? err.message ?? 'Failed to load activities');
            })
            .finally(() => setLoading(false));
    }, []);

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
        if (launched.type === 'image_vocab_match')       return <ImageVocabMatchActivity {...props} />;
        if (launched.type === 'word_formation')          return <WordFormationActivity {...props} />;
        if (launched.type === 'odd_one_out')             return <OddOneOutActivity {...props} />;
        if (launched.type === 'cloze')                   return <ClozeActivity {...props} />;
        if (launched.type === 'discussion_questions')    return <DiscussionQuestionsActivity {...props} />;
        if (launched.type === 'sentence_transformation') return <SentenceTransformationActivity {...props} />;
        if (launched.type === 'error_correction')        return <ErrorCorrectionActivity {...props} />;
        if (launched.type === 'grammar_explainer')       return <GrammarExplainerActivity {...props} />;
    }

    const filtered = activities.filter(a => {
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        if (folderFilter !== 'all') {
            if (folderFilter === '__none__') return !a.folder;
            if (a.folder !== folderFilter) return false;
        }
        return true;
    });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Activity Library</h2>
                <p className="text-white/60 mt-1 text-sm">Your saved activities — relaunch them any time.</p>
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(f => (
                    <button key={f} onClick={() => setTypeFilter(f)} className={filterBtnCls(typeFilter === f)}>
                        {f === 'all' ? 'All types' : TYPE_LABELS[f]}
                    </button>
                ))}
            </div>

            {/* Folder filter — only shown if there are any folders */}
            {folders.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                    <span className="text-white/35 text-xs self-center mr-1">Folder:</span>
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
                    <Spinner message="Loading activities…" color="text-white/70" textColor="text-white/50" />
                </div>
            )}

            {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-20 text-white/40">
                    <p className="text-lg">No saved activities yet.</p>
                    <p className="text-sm mt-1">Generate an activity and click Save to add it here.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(a => (
                    <div
                        key={a.id}
                        className="bg-white/8 backdrop-blur-md border border-white/12 rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/12 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xl font-bold text-white leading-snug min-w-0 break-words">{a.name}</h3>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${TYPE_COLORS[a.type]}`}>
                                {TYPE_LABELS[a.type]}
                            </span>
                        </div>

                        {(a.book || a.lesson) && (
                            <div className="flex gap-2 flex-wrap">
                                {a.book && (
                                    <span className="text-xs bg-white/10 text-white/90 px-2.5 py-1 rounded-full border border-white/10">
                                        {a.book}
                                    </span>
                                )}
                                {a.lesson && (
                                    <span className="text-xs bg-white/10 text-white/90 px-2.5 py-1 rounded-full border border-white/10">
                                        {a.lesson}
                                    </span>
                                )}
                            </div>
                        )}

                        {a.folder && (
                            <p className="text-xs text-white/80">📁 {a.folder}</p>
                        )}

                        <p className="text-xs text-white/70 mt-auto">
                            {new Date(a.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </p>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setLaunched(a.content)}
                                className="flex-1 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer border border-white/15"
                            >
                                Launch
                            </button>
                            <button
                                onClick={() => handleDelete(a.id)}
                                className="bg-white/8 hover:bg-red-500/50 text-white/60 hover:text-white text-sm px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-white/10"
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
