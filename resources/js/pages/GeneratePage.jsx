import { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';
import FlashcardActivity from '@/components/FlashcardActivity';
import UnjumbleActivity from '@/components/UnjumbleActivity';
import DialogGapFillActivity from '@/components/DialogGapFillActivity';
import WordFormationActivity from '@/components/WordFormationActivity';
import TrueFalseActivity from '@/components/TrueFalseActivity';
import McReadingActivity from '@/components/McReadingActivity';
import ReadCompleteActivity from '@/components/ReadCompleteActivity';
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
import { TRILHAS } from '@/lib/trilhas';
import { getLessonSession, clearLessonSession } from '@/lib/lessonSession';

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
        blurb: 'Form the right word from a root in capitals to fill the gap. Prefixes, suffixes, word class.',
        defaultPrompt: 'Create a word formation activity with 8 items. For each, give a root word in capitals and a sentence with a gap; the student forms the correct derivative. Mix nouns, verbs, adjectives and adverbs.',
    },
    {
        id: 'quiz', label: 'Multiple Choice Quiz', goals: ['grammar', 'vocabulary', 'reading'],
        blurb: 'A question and 4 options with instant feedback. Works for grammar, vocab or comprehension.',
        defaultPrompt: 'Generate 6 multiple choice questions. Vary the focus: meaning, use in context, and form.',
    },
    {
        id: 'cloze', label: 'Cloze (gap-fill + word bank)', goals: ['grammar', 'vocabulary'],
        blurb: 'A short passage with words removed and a word bank to choose from. Target vocabulary or a set structure.',
        defaultPrompt: 'Create a gap-fill activity: a short passage with 6–8 key words removed, provided as a word bank. Make sure the context gives enough clues for each gap.',
    },
    {
        id: 'open_cloze', label: 'Open Cloze (no word bank)', goals: ['grammar'],
        blurb: 'A passage with single-word gaps and no word bank. Grammar and function words — prepositions, articles, auxiliaries.',
        defaultPrompt: 'Create an Open Cloze passage of 80–140 words with 8 single-word gaps, no word bank. Each gap should be a grammar or function word the student works out from context.',
    },
    {
        id: 'mc_cloze', label: 'Multiple Choice Cloze', goals: ['grammar', 'vocabulary'],
        blurb: 'A passage with 4 options per gap. Collocation, phrasal verbs, easily-confused words.',
        defaultPrompt: 'Create a Multiple Choice Cloze passage of 90–150 words with 8 gaps, each with 4 options. Test collocation, phrasal verbs, linking words and easily-confused words.',
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
        id: 'mc_reading', label: 'Reading Comprehension (MC)', goals: ['reading'],
        blurb: 'A longer passage stays on screen while students answer 6 multiple-choice questions. Main idea, detail, inference.',
        defaultPrompt: 'Write a 220–380 word passage and 6 multiple-choice comprehension questions (4 options each): mix main idea, detail, vocabulary in context, inference and purpose.',
    },
    {
        id: 'read_complete', label: 'Read and Complete', goals: ['reading', 'vocabulary'],
        blurb: 'A short passage where each gapped word shows its first few letters. Recognition & spelling.',
        defaultPrompt: 'Write a connected passage of 60–120 words and gap 10–14 content words, showing roughly the first half of each word.',
    },
    {
        id: 'discussion_questions', label: 'Discussion Questions', goals: ['speaking'],
        blurb: 'Open questions with follow-up prompts to get students talking.',
        defaultPrompt: 'Generate 6 open-ended discussion questions on the topic, each with 2 follow-up prompts. Vary between personal, opinion and hypothetical.',
    },
];

const inputCls = 'w-full bg-[#271d62]/[0.06] border border-[#271d62]/15 rounded-xl px-4 py-2.5 text-sm text-[#271d62] placeholder-[#271d62]/40 focus:outline-none focus:ring-2 focus:ring-[#a01789] focus:border-transparent backdrop-blur-sm transition-colors';

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
    const [lessonSession, setLessonSessionState] = useState(() => getLessonSession());

    useEffect(() => {
        axios.get('/api/documents')
            .then(({ data }) => {
                setDocuments(data);
                const preselect = searchParams.get('doc');
                if (preselect) { setDocumentId(preselect); setSourceMode('document'); }
            })
            .catch(() => setErrorMsg('Could not load your documents. Please refresh the page.'));
    }, []);

    // A "+ Add activity" button (Presentation / Reading Text) navigates back to
    // this same /generate route to start a fresh one. Since the route doesn't
    // change, the component doesn't remount — without this, the activity
    // already on screen (set from location.state on the first visit) would
    // just stay there. Reset whenever we land here with no activity in state.
    useEffect(() => {
        if (!location.state?.activity) {
            setActivity(null);
            setStatus('idle');
        }
        setLessonSessionState(getLessonSession());
    }, [location.key]);

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

    function handleClearSession() {
        clearLessonSession();
        setLessonSessionState(null);
    }

    if (activity?.type === 'quiz')               return <QuizActivity quiz={activity} onClose={handleClose} />;
    if (activity?.type === 'flashcards')         return <FlashcardActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'unjumble')           return <UnjumbleActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'dialog_gap_fill')    return <DialogGapFillActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'word_formation')       return <WordFormationActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'true_false')         return <TrueFalseActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'mc_reading')          return <McReadingActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'read_complete')       return <ReadCompleteActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'odd_one_out')          return <OddOneOutActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'cloze')                return <ClozeActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'open_cloze')           return <OpenClozeActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'mc_cloze')             return <McClozeActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'discussion_questions')   return <DiscussionQuestionsActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'sentence_transformation') return <SentenceTransformationActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'error_correction')        return <ErrorCorrectionActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'grammar_explainer')       return <GrammarExplainerActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'presentation')            return <GrammarExplainerActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'reading_text')            return <ReadingTextActivity activity={activity} onClose={handleClose} onDerive={(a) => { setActivity(a); setStatus('success'); }} />;
    if (activity?.type === 'essay_feedback')          return <EssayFeedbackActivity activity={activity} onClose={handleClose} />;

    return (
        <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="font-display lg-shell-text text-3xl font-bold text-[#271d62]">Generate an Activity</h2>
                <p className="lg-shell-text text-[#271d62]/80 mt-1 text-sm">
                    Pick what you want students to practise, choose a format, and give it a topic.
                </p>
            </div>

            {lessonSession && (
                <div className="flex items-center gap-2 text-sm bg-[#fc6840]/12 border border-[#fc6840]/30 rounded-xl px-4 py-2.5">
                    <span className="text-[#a01789]">
                        Adding to: <span className="font-semibold text-[#271d62]">
                            {TRILHAS[lessonSession.trilha]?.label ?? lessonSession.trilha} · Lesson {lessonSession.lesson}
                        </span>
                    </span>
                    <button type="button" onClick={handleClearSession} className="ml-auto text-[#a01789]/70 hover:text-[#271d62] text-xs underline cursor-pointer">
                        Change
                    </button>
                </div>
            )}

            <div className="lg-surface border rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Step 1 — goal */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#271d62]/85">1. What do you want to practise?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {GOALS.map(g => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => pickGoal(g.id)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl text-center transition-all cursor-pointer border ${
                                        goal === g.id
                                            ? 'bg-[#a01789]/12 border-[#a01789] text-[#271d62] ring-2 ring-[#a01789]/30'
                                            : 'bg-[#271d62]/[0.05] border-[#271d62]/12 text-[#5a1b73] hover:bg-[#271d62]/10 hover:text-[#271d62]'
                                    }`}
                                >
                                    <span className="text-sm font-semibold">{g.label}</span>
                                    <span className={`text-[10px] leading-tight ${goal === g.id ? 'text-[#271d62]/85' : 'text-[#271d62]/45'}`}>{g.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2 — template */}
                    {goal && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-[#271d62]/85">2. Choose a format</label>
                            <div className="grid sm:grid-cols-2 gap-2">
                                {goalTemplates.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => pickTemplate(t)}
                                        className={`flex flex-col gap-1 text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer border ${
                                            templateId === t.id
                                                ? 'bg-[#a01789]/12 border-[#a01789] ring-2 ring-[#a01789]/30'
                                                : 'bg-[#271d62]/[0.05] border-[#271d62]/12 hover:bg-[#271d62]/10'
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-[#271d62]">{t.label}</span>
                                        <span className={`text-xs leading-snug ${templateId === t.id ? 'text-[#271d62]/90' : 'text-[#271d62]/50'}`}>{t.blurb}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 — source + prompt */}
                    {template && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#271d62]/85">3. Where should the content come from?</label>
                                <div className="flex gap-2">
                                    {[['topic', 'A topic'], ['document', 'An uploaded document']].map(([mode, lbl]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setSourceMode(mode)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                                sourceMode === mode
                                                    ? 'bg-[#a01789] border-[#a01789] text-white'
                                                    : 'bg-[#271d62]/[0.04] border-[#271d62]/10 text-[#271d62]/55 hover:text-[#271d62]/85'
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
                                                <option value="" className="bg-white text-[#271d62]">Select a document…</option>
                                                {documents.map((doc) => (
                                                    <option key={doc.id} value={doc.id} className="bg-white text-[#271d62]">
                                                        {doc.source_type === 'audio' ? '🎧 ' : ''}{doc.original_name}{doc.page_count ? ` (${doc.page_count} pages)` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#271d62]/45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {pageCount && (
                                            <div className="flex items-center gap-3">
                                                <input type="number" value={pageFrom} onChange={e => setPageFrom(e.target.value)} placeholder="From"
                                                    className="w-24 bg-[#271d62]/[0.06] border border-[#271d62]/15 rounded-xl px-3 py-2 text-sm text-[#271d62] placeholder-[#271d62]/40 focus:outline-none focus:ring-2 focus:ring-[#a01789]" />
                                                <span className="text-[#271d62]/45 text-sm">to</span>
                                                <input type="number" value={pageTo} onChange={e => setPageTo(e.target.value)} placeholder="To"
                                                    className="w-24 bg-[#271d62]/[0.06] border border-[#271d62]/15 rounded-xl px-3 py-2 text-sm text-[#271d62] placeholder-[#271d62]/40 focus:outline-none focus:ring-2 focus:ring-[#a01789]" />
                                                <span className="text-[#271d62]/45 text-sm">of {pageCount} — blank = whole document</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#271d62]/85">
                                    Instructions <span className="text-[#271d62]/45 font-normal ml-1">— edit if you want something specific</span>
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
                                className="self-start bg-[#a01789] hover:bg-[#8a1475] disabled:bg-[#a01789]/30 disabled:cursor-default text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                Generate
                            </button>
                        </>
                    )}
                </form>
            </div>

            <p className="lg-shell-text text-[#271d62]/75 text-xs">
                Looking for a Presentation or a Reading Text? Those are on the Upload page.
            </p>

            {status === 'loading' && (
                <div className="flex justify-center py-8">
                    <Spinner message="Generating your activity… this can take up to 20 seconds" color="text-[#fc6840]" textColor="text-[#271d62]/60" />
                </div>
            )}

            {status === 'error' && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-700">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}
