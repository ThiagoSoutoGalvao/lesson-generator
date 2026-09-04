import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
import ReadingTextActivity from '@/components/ReadingTextActivity';
import EssayFeedbackActivity from '@/components/EssayFeedbackActivity';
import Spinner from '@/components/Spinner';

// What a teacher is trying to get students to practise. This is the first choice
// on the page — templates are shown grouped under whichever goal is picked.
const GOALS = [
    { id: 'vocabulary', label: 'Vocabulary', hint: 'Learn and practise words' },
    { id: 'grammar',    label: 'Grammar',    hint: 'Practise structures & accuracy' },
    { id: 'reading',    label: 'Reading',    hint: 'Read a text and respond' },
    { id: 'speaking',   label: 'Speaking',   hint: 'Get students talking' },
];

// One entry per format the teacher can generate. `id` is the picker key;
// `type` (defaults to `id`) is what the API/renderer sees. `goals` decides which
// goal(s) it shows under. `blurb` is the one-line "use this when…".
const TEMPLATES = [
    {
        id: 'flashcards', label: 'Flashcards', goals: ['vocabulary'],
        blurb: 'Flip cards — word, definition, examples. Introduce or revise a set of words.',
        defaultPrompt: 'Create 8 flashcards for the key vocabulary. For each word include a clear student-friendly definition and two natural example sentences.',
    },
    {
        id: 'odd_one_out', label: 'Odd One Out', goals: ['vocabulary'],
        blurb: "Groups of 4 words — spot the one that doesn't belong. Tests word relationships.",
        defaultPrompt: 'Create an Odd One Out activity with 6 groups of 4 words. In each group, 3 words share a clear connection and 1 does not belong. Add a short explanation for each group.',
    },
    {
        id: 'word_formation', label: 'Word Formation', goals: ['vocabulary', 'grammar'],
        blurb: 'Given a root word in capitals, form the right word to fill the gap.',
        defaultPrompt: 'Create a word formation activity with 8 items. For each, give a root word in capitals and a sentence with a gap; the student forms the correct derivative. Mix nouns, verbs, adjectives and adverbs.',
    },
    {
        id: 'quiz', label: 'Multiple Choice Quiz', goals: ['grammar', 'vocabulary', 'reading'],
        blurb: 'A question and 4 options with instant feedback. Works for grammar, vocab or comprehension.',
        defaultPrompt: 'Generate 6 multiple choice questions. Vary the focus: meaning, use in context, and form.',
    },
    {
        id: 'cloze', label: 'Cloze (gap-fill + word bank)', goals: ['grammar', 'vocabulary'],
        blurb: 'A short passage with words removed and a word bank to choose from.',
        defaultPrompt: 'Create a gap-fill activity: a short passage with 6–8 key words removed, provided as a word bank. Make sure the context gives enough clues for each gap.',
    },
    {
        id: 'sentence_transformation', label: 'Sentence Transformation', goals: ['grammar'],
        blurb: 'Rewrite a sentence with a given key word, keeping the meaning. Exam-style grammar.',
        defaultPrompt: 'Create 6 sentence transformation items. Each gives an original sentence and a key word; the student rewrites it keeping the same meaning. Cover different grammar points.',
    },
    {
        id: 'error_correction', label: 'Error Correction — sentences', goals: ['grammar'],
        blurb: 'Separate sentences, each with one mistake to find and correct.',
        defaultPrompt: 'Create 8 error correction sentences, each with exactly one realistic B1–B2 mistake. Cover a range: tense, agreement, prepositions, articles, word form, vocabulary.',
    },
    {
        id: 'error_correction_passage', type: 'error_correction', label: 'Error Correction — passage', goals: ['grammar', 'reading'],
        blurb: 'One connected text with several mistakes embedded. Students read and correct as they go.',
        defaultPrompt: 'Write a short connected text of 2 short paragraphs on the topic, with 6 mistakes embedded for students to find and correct. Make it a passage, not separate sentences.',
    },
    {
        id: 'unjumble', label: 'Unjumble', goals: ['grammar'],
        blurb: 'Scrambled words to reorder into a correct sentence. Good for word order.',
        defaultPrompt: 'Make 6 unjumble sentences using the target structures. Each sentence should be 6–10 words long.',
    },
    {
        id: 'dialog_gap_fill', label: 'Dialogue Gap-Fill', goals: ['grammar', 'speaking'],
        blurb: 'A short conversation with gaps; pick the best line from 3 options. Functional language.',
        defaultPrompt: 'Write a natural 10–12 line dialogue between two people on the topic, with 3 gaps to complete. Wrong options should be plausible but clearly not the best fit.',
    },
    {
        id: 'true_false', label: 'True / False / Not Given', goals: ['reading'],
        blurb: 'A reading passage and 6 statements to judge. Trains close reading and inference.',
        defaultPrompt: 'Write a reading passage of 90–130 words and 6 statements — 2 True, 2 False, 2 Not Given. Vary the order.',
    },
    {
        id: 'discussion_questions', label: 'Discussion Questions', goals: ['speaking'],
        blurb: 'Open questions with follow-up prompts to get students talking.',
        defaultPrompt: 'Generate 6 open-ended discussion questions on the topic, each with 2 follow-up prompts. Vary between personal, opinion and hypothetical.',
    },
];

const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-colors';

export default function GeneratePage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [documents, setDocuments]   = useState([]);
    const [documentId, setDocumentId] = useState('');
    const [goal, setGoal]             = useState(null);
    const [templateId, setTemplateId] = useState(null);
    const [prompt, setPrompt]         = useState('');
    const [sourceMode, setSourceMode] = useState('topic'); // 'topic' | 'document'
    const [topic, setTopic]           = useState('');
    const [pageFrom, setPageFrom]     = useState('');
    const [pageTo, setPageTo]         = useState('');
    const [status, setStatus]         = useState(location.state?.activity ? 'success' : 'idle');
    const [activity, setActivity]     = useState(location.state?.activity ?? null);
    const [errorMsg, setErrorMsg]     = useState('');

    useEffect(() => {
        axios.get('/api/documents')
            .then(({ data }) => {
                setDocuments(data);
                const preselect = searchParams.get('doc');
                if (preselect) { setDocumentId(preselect); setSourceMode('document'); }
            })
            .catch(() => setErrorMsg('Could not load your documents. Please refresh the page.'));
    }, []);

    const template     = TEMPLATES.find(t => t.id === templateId) ?? null;
    const goalTemplates = goal ? TEMPLATES.filter(t => t.goals.includes(goal)) : [];
    const selectedDoc  = documents.find(d => d.id === Number(documentId));
    const pageCount    = selectedDoc?.page_count ?? null;

    function pickGoal(g) {
        setGoal(g);
        setTemplateId(null);
        setPrompt('');
    }

    function pickTemplate(t) {
        setTemplateId(t.id);
        setPrompt(t.defaultPrompt);
    }

    const canSubmit = template
        && status !== 'loading'
        && (sourceMode === 'topic' ? topic.trim() !== '' : documentId !== '');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        setStatus('loading');
        setActivity(null);
        setErrorMsg('');

        const body = { type: template.type ?? template.id, prompt };
        if (sourceMode === 'topic') {
            body.topic = topic.trim();
        } else {
            body.document_id = documentId;
            if (pageFrom) body.page_from = Number(pageFrom);
            if (pageTo)   body.page_to   = Number(pageTo);
        }

        try {
            const { data } = await axios.post('/api/generate', body);
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
    if (activity?.type === 'presentation')            return <GrammarExplainerActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'reading_text')            return <ReadingTextActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'essay_feedback')          return <EssayFeedbackActivity activity={activity} onClose={handleClose} />;

    return (
        <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="lg-shell-text text-3xl font-bold text-white">Generate an Activity</h2>
                <p className="lg-shell-text text-white/70 mt-1 text-sm">
                    Pick what you want students to practise, choose a format, and give it a topic.
                </p>
            </div>

            <div className="lg-surface border rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Step 1 — goal */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-white/80">1. What do you want to practise?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {GOALS.map(g => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => pickGoal(g.id)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl text-center transition-all cursor-pointer border ${
                                        goal === g.id
                                            ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white/8 border-white/15 text-white/70 hover:bg-white/15 hover:text-white'
                                    }`}
                                >
                                    <span className="text-sm font-semibold">{g.label}</span>
                                    <span className={`text-[10px] leading-tight ${goal === g.id ? 'text-white/80' : 'text-white/40'}`}>{g.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2 — template */}
                    {goal && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-white/80">2. Choose a format</label>
                            <div className="grid sm:grid-cols-2 gap-2">
                                {goalTemplates.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => pickTemplate(t)}
                                        className={`flex flex-col gap-1 text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer border ${
                                            templateId === t.id
                                                ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/25'
                                                : 'bg-white/8 border-white/15 hover:bg-white/15'
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-white">{t.label}</span>
                                        <span className={`text-xs leading-snug ${templateId === t.id ? 'text-white/85' : 'text-white/45'}`}>{t.blurb}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 — source + prompt */}
                    {template && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">3. Where should the content come from?</label>
                                <div className="flex gap-2">
                                    {[['topic', 'A topic'], ['document', 'An uploaded document']].map(([mode, lbl]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setSourceMode(mode)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                                sourceMode === mode
                                                    ? 'bg-white/20 border-white/30 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                                            }`}
                                        >
                                            {lbl}
                                        </button>
                                    ))}
                                </div>

                                {sourceMode === 'topic' ? (
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        placeholder="e.g. the second conditional · daily routines · a text about recycling"
                                        className={inputCls}
                                    />
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="relative">
                                            <select
                                                value={documentId}
                                                onChange={e => { setDocumentId(e.target.value); setPageFrom(''); setPageTo(''); }}
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
                                        {pageCount && (
                                            <div className="flex items-center gap-3">
                                                <input type="number" value={pageFrom} onChange={e => setPageFrom(e.target.value)} placeholder="From"
                                                    className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                                <span className="text-white/40 text-sm">to</span>
                                                <input type="number" value={pageTo} onChange={e => setPageTo(e.target.value)} placeholder="To"
                                                    className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                                <span className="text-white/40 text-sm">of {pageCount} — blank = whole document</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-white/80">
                                    Instructions <span className="text-white/35 font-normal ml-1">— edit if you want something specific</span>
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    required
                                    rows={4}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="self-start bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/30 disabled:cursor-default text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                Generate
                            </button>
                        </>
                    )}
                </form>
            </div>

            <p className="lg-shell-text text-white/45 text-xs">
                Looking for a Presentation or a Reading Text? Those are on the Upload page.
            </p>

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
