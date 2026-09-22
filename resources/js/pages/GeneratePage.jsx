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
import ImageVocabMatchActivity from '@/components/ImageVocabMatchActivity';
import WordCategorisationActivity from '@/components/WordCategorisationActivity';
import MatchPairsActivity from '@/components/MatchPairsActivity';
import SignsNoticesActivity from '@/components/SignsNoticesActivity';
import PicturePromptsActivity from '@/components/PicturePromptsActivity';
import GrammarExplainerActivity from '@/components/GrammarExplainerActivity';
import ReadingTextActivity from '@/components/ReadingTextActivity';
import EssayFeedbackActivity from '@/components/EssayFeedbackActivity';
import Spinner from '@/components/Spinner';
import { TRILHAS, TRILHA_LEVEL } from '@/lib/trilhas';
import { LEVELS, DEFAULT_LEVEL, LEVEL_RANK } from '@/lib/levels';
import { EXAMS, EXAM_ORDER, TEMPLATE_META, isDirect } from '@/lib/examStyles';
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
        id: 'image_vocab_match', label: 'Image Vocab Match', goals: ['vocabulary'],
        blurb: 'Match each picture to its word. Best for concrete vocabulary — jobs, clothes, food, places.',
        defaultPrompt: 'Create an image matching activity with 6 concrete vocabulary words the student can match to photos. Choose words a photograph shows clearly.',
    },
    {
        id: 'word_categorisation', label: 'Word Categorisation', goals: ['vocabulary'],
        blurb: 'Sort words into 2 or 3 groups — food or drink, positive or negative. Good for meaning and word class.',
        defaultPrompt: 'Create a word categorisation activity with 2 categories of 5 words each. Every word must clearly belong to exactly one category.',
    },
    {
        id: 'match_pairs', label: 'Match Pairs', goals: ['vocabulary'],
        blurb: 'Match the two halves — digits and number words, countries and nationalities, words and definitions.',
        defaultPrompt: 'Create a match-the-pairs activity with 6 pairs. Each item on the left has exactly one partner on the right.',
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
        defaultPrompt: 'Create an Open Cloze passage with 8 single-word gaps, no word bank. Each gap should be a grammar or function word the student works out from context.',
    },
    {
        id: 'mc_cloze', label: 'Multiple Choice Cloze', goals: ['grammar', 'vocabulary'],
        blurb: 'A passage with 4 options per gap. Collocation, phrasal verbs, easily-confused words.',
        defaultPrompt: 'Create a Multiple Choice Cloze passage with 8 gaps, each with 4 options. Test collocation, phrasal verbs, linking words and easily-confused words.',
    },
    {
        id: 'sentence_transformation', label: 'Sentence Transformation', goals: ['grammar'],
        blurb: 'Rewrite a sentence with a given key word, keeping the meaning. Exam-style grammar.',
        defaultPrompt: 'Create 6 sentence transformation items. Each gives an original sentence and a key word; the student rewrites it keeping the same meaning. Cover different grammar points.',
    },
    {
        id: 'error_correction', label: 'Error Correction — sentences', goals: ['grammar'],
        blurb: 'Separate sentences, each with one mistake to find and correct.',
        defaultPrompt: 'Create 8 error correction sentences, each with exactly one realistic mistake. Cover a range: tense, agreement, prepositions, articles, word form, vocabulary.',
    },
    {
        id: 'error_correction_passage', type: 'error_correction', label: 'Error Correction — passage', goals: ['grammar', 'reading'],
        blurb: 'One connected text with several mistakes embedded. Students read and correct as they go.',
        defaultPrompt: 'Write a short connected text of 2 short paragraphs on the topic, with 6 mistakes embedded for students to find and correct. Make it a passage, not separate sentences.',
    },
    {
        id: 'unjumble', label: 'Unjumble', goals: ['grammar'],
        blurb: 'Scrambled words to reorder into a correct sentence. Good for word order.',
        defaultPrompt: 'Make 6 unjumble sentences using the target structures.',
    },
    {
        id: 'dialog_gap_fill', label: 'Dialogue Gap-Fill', goals: ['grammar', 'speaking'],
        blurb: 'A short conversation with gaps; pick the best line from 3 options. Functional language.',
        defaultPrompt: 'Write a natural 10–12 line dialogue between two people on the topic, with 3 gaps to complete. Wrong options should be plausible but clearly not the best fit.',
    },
    {
        id: 'signs_notices', label: 'Signs & Notices', goals: ['reading'],
        blurb: 'Short signs, notices and messages, each with one easy question. Real-life reading for beginners.',
        defaultPrompt: 'Create 5 short real-life texts (signs, notices and messages). Give each one question with 3 options.',
    },
    {
        id: 'true_false', label: 'True / False / Not Given', goals: ['reading'],
        blurb: 'A reading passage and 6 statements to judge. Trains close reading and inference.',
        defaultPrompt: 'Write a reading passage and 6 statements — an even mix of True, False and Not Given. Vary the order.',
    },
    {
        id: 'mc_reading', label: 'Reading Comprehension (MC)', goals: ['reading'],
        blurb: 'A longer passage stays on screen while students answer 6 multiple-choice questions. Main idea, detail, inference.',
        defaultPrompt: 'Write a passage and 6 multiple-choice comprehension questions (4 options each): mix main idea, detail, vocabulary in context, inference and purpose.',
    },
    {
        id: 'read_complete', label: 'Read and Complete', goals: ['reading', 'vocabulary'],
        blurb: 'A short passage where each gapped word shows its first few letters. Recognition & spelling.',
        defaultPrompt: 'Write a connected passage and gap 10–14 content words, showing roughly the first half of each word.',
    },
    {
        id: 'picture_prompts', label: 'Picture Prompts', goals: ['speaking'],
        blurb: 'A photo and a question to describe it, with natural sentence starters for the level. Speaking practice.',
        defaultPrompt: 'Create 4 picture prompts. For each, choose a photo that shows people doing something, ask a question about it, and give 2 or 3 sentence starters.',
    },
    {
        id: 'discussion_questions', label: 'Discussion Questions', goals: ['speaking'],
        blurb: 'Open questions with follow-up prompts to get students talking.',
        defaultPrompt: 'Generate 6 open-ended discussion questions on the topic, each with 2 follow-up prompts. Vary between personal, opinion and hypothetical.',
    },
];

const inputCls = 'w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#fc6840] focus:border-transparent backdrop-blur-sm transition-colors';

// Pills + "works from" tag on a format card; when the card is picked, a detail line says
// which exam task it mirrors (and any similar skills), and warns if the level is too low.
function TemplateMeta({ templateId, selected, level }) {
    const meta = TEMPLATE_META[templateId];
    if (!meta) return null;
    const direct  = meta.exams.filter(x => x.kind === 'direct');
    const similar = meta.exams.filter(x => x.kind === 'similar');
    const tooLow  = LEVEL_RANK[level] < LEVEL_RANK[meta.from];

    return (
        <>
            <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {direct.map(x => (
                    <span key={x.exam} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/85">
                        {EXAMS[x.exam]}
                    </span>
                ))}
                <span
                    className="ml-auto text-[11px] font-semibold tabular-nums text-[#fdb08a] border border-[#fdb08a]/45 rounded-md px-1.5 py-px"
                    title="Lowest level this format suits"
                >
                    {meta.from}+
                </span>
            </span>
            {selected && (
                <span className="mt-2 pt-2 border-t border-white/15 text-xs leading-relaxed text-white/90 flex flex-col gap-0.5">
                    {direct.map(x => (
                        <span key={x.exam}><span className="font-semibold text-[#fdb08a]">Mirrors</span> · {EXAMS[x.exam]}: {x.task}</span>
                    ))}
                    {similar.map(x => (
                        <span key={x.exam}><span className="font-semibold text-[#fdb08a]">Similar skill</span> · {EXAMS[x.exam]}: {x.task}</span>
                    ))}
                    {meta.exams.length === 0 && (
                        <span><span className="font-semibold text-[#fdb08a]">General format</span> · not tied to one exam.</span>
                    )}
                    {tooLow && (
                        <span className="text-[#ffd39a]">Made for {meta.from}+. At {level} it will be a stretch.</span>
                    )}
                </span>
            )}
        </>
    );
}

export default function GeneratePage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [documents, setDocuments]   = useState([]);
    const [documentId, setDocumentId] = useState('');
    const [goal, setGoal]             = useState(null);
    const [templateId, setTemplateId] = useState(null);
    const [exam, setExam]             = useState(null); // optional filter: 'cambridge' | 'det' | 'toefl'
    const [prompt, setPrompt]         = useState('');
    const [sourceMode, setSourceMode] = useState('topic'); // 'topic' | 'document'
    const [topic, setTopic]           = useState('');
    const [pageFrom, setPageFrom]     = useState('');
    const [pageTo, setPageTo]         = useState('');
    const [status, setStatus]         = useState(location.state?.activity ? 'success' : 'idle');
    const [activity, setActivity]     = useState(location.state?.activity ?? null);
    const [errorMsg, setErrorMsg]     = useState('');
    const [lessonSession, setLessonSessionState] = useState(() => getLessonSession());
    // Starts from the trilha's level while adding to a lesson (Lights → A1), else B1.
    const [level, setLevel] = useState(() => TRILHA_LEVEL[getLessonSession()?.trilha] ?? DEFAULT_LEVEL);

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
        const session = getLessonSession();
        setLessonSessionState(session);
        setLevel(TRILHA_LEVEL[session?.trilha] ?? DEFAULT_LEVEL);
    }, [location.key]);

    const template     = TEMPLATES.find(t => t.id === templateId) ?? null;
    const goalTemplates = goal ? TEMPLATES.filter(t => t.goals.includes(goal)) : [];
    // With an exam picked, the goal step is skipped and every format that mirrors that exam is listed.
    const examTemplates = exam ? TEMPLATES.filter(t => isDirect(t.id, exam)) : [];
    const shownTemplates = exam ? examTemplates : goalTemplates;
    const showFormats    = exam || goal;
    const examCount      = e => TEMPLATES.filter(t => isDirect(t.id, e)).length;
    const selectedDoc  = documents.find(d => d.id === Number(documentId));
    const pageCount    = selectedDoc?.page_count ?? null;
    const trilhaLevel  = lessonSession ? TRILHA_LEVEL[lessonSession.trilha] : null;

    function pickGoal(g) {
        setGoal(g);
        setTemplateId(null);
        setPrompt('');
    }

    function pickExam(e) {
        const next = exam === e ? null : e;
        setExam(next);
        if (next) {
            // A format picked earlier that doesn't mirror this exam is dropped.
            if (template && !isDirect(template.id, next)) { setTemplateId(null); setPrompt(''); }
        } else if (template && !template.goals.includes(goal)) {
            // Clearing the filter: keep the chosen format visible under one of its goals.
            setGoal(template.goals[0]);
        }
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

        const body = { type: template.type ?? template.id, prompt, level };
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
    if (activity?.type === 'image_vocab_match')       return <ImageVocabMatchActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'word_categorisation')     return <WordCategorisationActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'match_pairs')             return <MatchPairsActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'signs_notices')           return <SignsNoticesActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'picture_prompts')         return <PicturePromptsActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'grammar_explainer')       return <GrammarExplainerActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'presentation')            return <GrammarExplainerActivity activity={activity} onClose={handleClose} />;
    if (activity?.type === 'reading_text')            return <ReadingTextActivity activity={activity} onClose={handleClose} onDerive={(a) => { setActivity(a); setStatus('success'); }} />;
    if (activity?.type === 'essay_feedback')          return <EssayFeedbackActivity activity={activity} onClose={handleClose} />;

    return (
        <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="font-display lg-shell-text text-3xl font-bold text-white">Generate an Activity</h2>
                <p className="lg-shell-text text-white/75 mt-1 text-sm">
                    Pick what you want students to practise, choose a format, and give it a topic.
                </p>
            </div>

            {lessonSession && (
                <div className="flex items-center gap-2 text-sm bg-[#fc6840]/15 border border-[#fc6840]/35 rounded-xl px-4 py-2.5">
                    <span className="text-[#fdb08a]">
                        Adding to: <span className="font-semibold text-white">
                            {TRILHAS[lessonSession.trilha]?.label ?? lessonSession.trilha} · Lesson {lessonSession.lesson}
                        </span>
                    </span>
                    <button type="button" onClick={handleClearSession} className="ml-auto text-[#fdb08a]/80 hover:text-white text-xs underline cursor-pointer">
                        Change
                    </button>
                </div>
            )}

            <div className="lg-surface border rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Optional exam filter — skips the goal step */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-white/80">
                            Preparing a student for an exam? <span className="text-white/40 font-normal ml-1">— optional, skips straight to matching formats</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {EXAM_ORDER.map(e => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => pickExam(e)}
                                    aria-pressed={exam === e}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                                        exam === e
                                            ? 'bg-[#fc6840]/15 border-[#fc6840] text-white ring-2 ring-[#fc6840]/35'
                                            : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {EXAMS[e]}
                                    <span className={`tabular-nums text-[11px] ${exam === e ? 'text-white/85' : 'text-white/50'}`}>{examCount(e)}</span>
                                </button>
                            ))}
                        </div>
                        {exam && examCount(exam) <= 3 && (
                            <p className="text-xs text-white/55">
                                Only {examCount(exam)} {examCount(exam) === 1 ? 'format' : 'formats'} so far. More are on the way.
                            </p>
                        )}
                    </div>

                    {/* Step 1 — goal (hidden while an exam is picked) */}
                    <div className={`${exam ? 'hidden' : 'flex'} flex-col gap-2`}>
                        <label className="text-sm font-medium text-white/80">1. What do you want to practise?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {GOALS.map(g => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => pickGoal(g.id)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl text-center transition-all cursor-pointer border ${
                                        goal === g.id
                                            ? 'bg-[#fc6840]/15 border-[#fc6840] text-white ring-2 ring-[#fc6840]/40'
                                            : 'bg-white/5 border-white/12 text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="text-sm font-semibold">{g.label}</span>
                                    <span className={`text-[10px] leading-tight ${goal === g.id ? 'text-white/80' : 'text-white/40'}`}>{g.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2 — template */}
                    {showFormats && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-white/80">
                                {exam ? `Formats that mirror ${EXAMS[exam]} tasks` : '2. Choose a format'}
                            </label>
                            <div className="grid sm:grid-cols-2 items-start gap-2">
                                {shownTemplates.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => pickTemplate(t)}
                                        aria-pressed={templateId === t.id}
                                        className={`flex flex-col gap-1 text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer border ${
                                            templateId === t.id
                                                ? 'bg-[#fc6840]/15 border-[#fc6840] ring-2 ring-[#fc6840]/40'
                                                : 'bg-white/5 border-white/12 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-white">{t.label}</span>
                                        <span className={`text-xs leading-snug ${templateId === t.id ? 'text-white/90' : 'text-white/45'}`}>{t.blurb}</span>
                                        <TemplateMeta templateId={t.id} selected={templateId === t.id} level={level} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 — source + prompt */}
                    {template && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/80">{exam ? 2 : 3}. Where should the content come from?</label>
                                <div className="flex gap-2">
                                    {[['topic', 'A topic'], ['document', 'An uploaded document']].map(([mode, lbl]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setSourceMode(mode)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                                sourceMode === mode
                                                    ? 'bg-[#e0521f] border-[#e0521f] text-white'
                                                    : 'bg-white/5 border-white/10 text-white/55 hover:text-white/80'
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
                                                    className="w-24 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#fc6840]" />
                                                <span className="text-white/40 text-sm">to</span>
                                                <input type="number" value={pageTo} onChange={e => setPageTo(e.target.value)} placeholder="To"
                                                    className="w-24 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-[#fc6840]" />
                                                <span className="text-white/40 text-sm">of {pageCount} — blank = whole document</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span id="level-label" className="text-sm font-medium text-white/80">
                                    Level <span className="text-white/40 font-normal ml-1">— how simple to keep the language</span>
                                </span>
                                <div className="grid grid-cols-4 gap-1.5" role="group" aria-labelledby="level-label">
                                    {LEVELS.map(l => (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => setLevel(l.id)}
                                            aria-pressed={level === l.id}
                                            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border transition-all cursor-pointer ${
                                                level === l.id
                                                    ? 'bg-[#e0521f] border-[#e0521f] text-white'
                                                    : 'bg-white/5 border-white/12 text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-sm font-semibold">{l.label}</span>
                                            <span className={`text-[10px] ${level === l.id ? 'text-white/90' : 'text-white/45'}`}>{l.name}</span>
                                        </button>
                                    ))}
                                </div>
                                {trilhaLevel && (
                                    <p className="text-xs text-[#fdb08a]">
                                        {level === trilhaLevel
                                            ? `Set from ${TRILHAS[lessonSession.trilha]?.label ?? lessonSession.trilha}. Change it if this lesson needs more.`
                                            : `${TRILHAS[lessonSession.trilha]?.label ?? lessonSession.trilha} suggests ${trilhaLevel}. You changed it for this activity.`}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-white/80">
                                    Instructions <span className="text-white/40 font-normal ml-1">— edit if you want something specific</span>
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
                                className="self-start bg-[#e0521f] hover:bg-[#c9461a] disabled:bg-[#e0521f]/30 disabled:cursor-default text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                Generate
                            </button>
                        </>
                    )}
                </form>
            </div>

            <p className="lg-shell-text text-white/70 text-xs">
                Looking for a Presentation or a Reading Text? Those are on the Upload page.
            </p>
            <p className="lg-shell-text text-white/60 text-[11px] max-w-prose">
                Exam-style means modelled on the task format. All content is original and is not affiliated with or endorsed by Cambridge University Press &amp; Assessment, ETS or Duolingo.
            </p>

            {status === 'loading' && (
                <div className="flex justify-center py-8">
                    <Spinner message="Generating your activity… this can take up to 20 seconds" color="text-[#fc6840]" textColor="text-white/60" />
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
