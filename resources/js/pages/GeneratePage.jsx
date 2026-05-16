import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';
import FlashcardActivity from '@/components/FlashcardActivity';
import UnjumbleActivity from '@/components/UnjumbleActivity';
import DialogGapFillActivity from '@/components/DialogGapFillActivity';
import WordFormationActivity from '@/components/WordFormationActivity';
import TrueFalseActivity from '@/components/TrueFalseActivity';
import OddOneOutActivity from '@/components/OddOneOutActivity';
import ClozeActivity from '@/components/ClozeActivity';
import DiscussionQuestionsActivity from '@/components/DiscussionQuestionsActivity';
import SentenceTransformationActivity from '@/components/SentenceTransformationActivity';
import ErrorCorrectionActivity from '@/components/ErrorCorrectionActivity';
import GrammarExplainerActivity from '@/components/GrammarExplainerActivity';
import Spinner from '@/components/Spinner';

const ACTIVITY_TYPES = [
    { value: 'quiz',                 label: 'Quiz' },
    { value: 'flashcards',           label: 'Flashcards' },
    { value: 'unjumble',             label: 'Unjumble' },
    { value: 'dialog_gap_fill',      label: 'Dialog' },
    { value: 'word_formation',       label: 'Word Formation' },
    { value: 'true_false',           label: 'True / False' },
    { value: 'odd_one_out',            label: 'Odd One Out' },
    { value: 'cloze',                  label: 'Cloze' },
    { value: 'discussion_questions',    label: 'Discussion' },
    { value: 'sentence_transformation', label: 'Transform' },
    { value: 'error_correction',        label: 'Error Correction' },
    { value: 'grammar_explainer',        label: 'Grammar' },
];

const DEFAULT_PROMPTS = {
    quiz:                'Generate 5 multiple choice questions about the key vocabulary and grammar from this page. Vary the question types — include meaning, usage in context, and grammatical form.',
    flashcards:          'Create 8 flashcards for the most important vocabulary words on this page. For each word include a clear student-friendly definition and a natural example sentence.',
    unjumble:            'Make 6 unjumble sentences using key language from this page. Focus on the main grammar structures being practised. Each sentence should be 6–10 words long.',
    dialog_gap_fill:     'Write a natural 10–12 line dialogue between two people on the topic of this page. Create 3 gaps spread throughout the conversation for students to complete. Make the wrong options plausible but clearly not the best fit.',
    word_formation:      'Create a word formation activity with 8 items using key vocabulary from this page. For each item, give a root word in capitals and a sentence with a gap. The student must form the correct derivative to complete the sentence. Cover a mix of word classes: nouns, verbs, adjectives, and adverbs.',
    true_false:          'Generate a True / False / Not Given activity from this page. Write a reading passage of 80–120 words and 6 statements — 2 True, 2 False, and 2 Not Given. Vary the order and make sure Not Given statements are genuinely absent from the passage.',
    odd_one_out:           'Create an Odd One Out activity using vocabulary from this page. Make 6 groups of 4 words — in each group, 3 words share a clear connection and 1 does not belong. Include a clear explanation for each group.',
    cloze:                 'Create a fill-in-the-blanks activity using a short passage from this page. Remove 6–8 key vocabulary or grammar words and provide them as a word bank. Make sure the remaining context gives students enough clues to find each answer.',
    discussion_questions:  'Generate 6 open-ended discussion questions based on the topics and themes from this page. Include 2 follow-up prompts for each question to keep the conversation going. Vary the types: personal, opinion, and hypothetical questions.',
    sentence_transformation: 'Create 6 sentence transformation items using grammar structures from this page. Each item gives the student an original sentence and a key word — they must rewrite the sentence keeping the same meaning. Cover different grammar points: tenses, passive voice, modal verbs, reported speech, or comparatives.',
    error_correction:        'Create 8 error correction sentences based on the grammar and vocabulary from this page. Each sentence must contain exactly one realistic mistake that a B1-B2 learner might make. Cover different error types: wrong tense, subject-verb agreement, prepositions, articles, word form, or vocabulary confusion.',
    grammar_explainer:       'Create a Grammar Explainer presentation for the main grammar structure on this page. Include 4–6 slides covering: the form (positive, negative, question), when and how to use it, common mistakes, and 2–3 natural example sentences per slide. Use simple B1-B2 language.',
};

const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-colors';

export default function GeneratePage() {
    const [searchParams] = useSearchParams();
    const [documents, setDocuments]   = useState([]);
    const [documentId, setDocumentId] = useState('');
    const [activityType, setActivityType] = useState('quiz');
    const [prompt, setPrompt]         = useState(DEFAULT_PROMPTS.quiz);
    const [status, setStatus]         = useState('idle');
    const [activity, setActivity]     = useState(null);
    const [errorMsg, setErrorMsg]     = useState('');
    const [pageFrom, setPageFrom]     = useState('');
    const [pageTo, setPageTo]         = useState('');
    const [sectionFocus, setSectionFocus] = useState(null);

    useEffect(() => {
        axios.get('/api/documents')
            .then(({ data }) => {
                setDocuments(data);
                const preselect = searchParams.get('doc');
                if (preselect) setDocumentId(preselect);
            })
            .catch(() => setErrorMsg('Could not load your documents. Please refresh the page.'));
    }, []);

    const selectedDoc = documents.find(d => d.id === Number(documentId));
    const pageCount   = selectedDoc?.page_count ?? null;

    function handleDocumentChange(e) {
        setDocumentId(e.target.value);
        setPageFrom('');
        setPageTo('');
        setSectionFocus(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('loading');
        setActivity(null);
        setErrorMsg('');

        try {
            const { data } = await axios.post('/api/generate', {
                document_id: documentId,
                prompt,
                type: activityType,
                page_from:     pageFrom ? Number(pageFrom) : null,
                page_to:       pageTo   ? Number(pageTo)   : null,
                section_focus: sectionFocus ?? undefined,
            });
            setActivity(data);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Something went wrong. Please try again.');
            setStatus('error');
        }
    }

    function handleClose() {
        setActivity(null);
        setStatus('idle');
    }

    if (activity?.type === 'quiz')               return <QuizActivity quiz={activity} onClose={handleClose} />;
    if (activity?.type === 'flashcards')         return <FlashcardActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'unjumble')           return <UnjumbleActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'dialog_gap_fill')    return <DialogGapFillActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'word_formation')       return <WordFormationActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'true_false')         return <TrueFalseActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'odd_one_out')          return <OddOneOutActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'cloze')                return <ClozeActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'discussion_questions')   return <DiscussionQuestionsActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'sentence_transformation') return <SentenceTransformationActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'error_correction')        return <ErrorCorrectionActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'grammar_explainer')       return <GrammarExplainerActivity activity={activity} onClose={handleClose} />;

    return (
        <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Generate an Activity</h2>
                <p className="text-white/60 mt-1 text-sm">Select a document, choose an activity type, and describe what you want.</p>
            </div>

            <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Course book */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-white/80">Course book</label>
                        <div className="relative">
                            <select
                                value={documentId}
                                onChange={handleDocumentChange}
                                required
                                className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                            >
                                <option value="" className="bg-gray-900 text-white">Select a document…</option>
                                {documents.map((doc) => (
                                    <option key={doc.id} value={doc.id} className="bg-gray-900 text-white">
                                        {doc.source_type === 'audio' ? '🎧 ' : ''}{doc.original_name}{doc.page_count ? ` (${doc.page_count} pages)` : ''}
                                    </option>
                                ))}
                            </select>
                            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Page range */}
                    {pageCount && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-white/80">
                                Page range
                                <span className="text-white/35 font-normal ml-1">— leave blank to use the whole document</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={pageFrom} onChange={e => setPageFrom(e.target.value)}
                                    placeholder="From"
                                    className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                                />
                                <span className="text-white/40 text-sm">to</span>
                                <input
                                    type="number"
                                    value={pageTo} onChange={e => setPageTo(e.target.value)}
                                    placeholder="To"
                                    className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                                />
                                <span className="text-white/40 text-sm">of {pageCount}</span>
                            </div>
                        </div>
                    )}

                    {/* Section focus */}
                    {documentId && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-white/80">
                                Section focus
                                <span className="text-white/35 font-normal ml-1">— optional</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['Vocabulary', 'Grammar', 'Listening', 'Reading'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSectionFocus(prev => prev === s ? null : s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                            sectionFocus === s
                                                ? 'bg-purple-500 border-purple-400 text-white'
                                                : 'bg-white/8 border-white/15 text-white/65 hover:bg-white/15 hover:text-white'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity type */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-white/80">Activity type</label>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {ACTIVITY_TYPES.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => { setActivityType(value); setPrompt(DEFAULT_PROMPTS[value]); }}
                                    className={`flex-1 min-w-[90px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer border ${
                                        activityType === value
                                            ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white/8 border-white/15 text-white/65 hover:bg-white/15 hover:text-white hover:border-white/30'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-white/80">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            required
                            rows={4}
                            placeholder="Describe what you want…"
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="self-start bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                        Generate
                    </button>
                </form>
            </div>

            {status === 'loading' && (
                <div className="flex justify-center py-8">
                    <Spinner message="Generating your activity… this can take up to 20 seconds" color="text-blue-400" textColor="text-white/60" />
                </div>
            )}

            {status === 'error' && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-300">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}
