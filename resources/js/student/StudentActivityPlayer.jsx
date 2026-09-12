import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { reloadStudentLessons } from '@/student/lib/useStudentLessons';

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

const GRADIENT = 'linear-gradient(157deg,#1A0F3D 0%,#2A1560 30%,#5A1B73 62%,#8E2160 86%,#B8433A 118%)';

// Types whose component fires onComplete({ score, maxScore }) when the student
// reaches the end. Scored (S3 + Unjumble, reclassified in S4 once its component
// turned out to track a real score too): quiz, true_false, mc_reading,
// dialog_gap_fill, mc_cloze, word_categorisation, unjumble. Completion only, no
// score (S3's odd_one_out/image_vocab_match + S4's reveal-only and no-reveal
// templates): odd_one_out, image_vocab_match, cloze, open_cloze, read_complete,
// word_formation, sentence_transformation, error_correction, flashcards,
// discussion_questions.
const RECORDS_ATTEMPT = new Set([
    'quiz', 'true_false', 'mc_reading', 'dialog_gap_fill', 'mc_cloze',
    'word_categorisation', 'odd_one_out', 'image_vocab_match', 'unjumble',
    'cloze', 'open_cloze', 'read_complete', 'word_formation',
    'sentence_transformation', 'error_correction', 'flashcards',
    'discussion_questions',
]);

const COMPONENTS = {
    quiz:                    QuizActivity,
    flashcards:              FlashcardActivity,
    unjumble:                UnjumbleActivity,
    dialog_gap_fill:         DialogGapFillActivity,
    word_categorisation:     WordCategorisationActivity,
    true_false:              TrueFalseActivity,
    mc_reading:              McReadingActivity,
    read_complete:           ReadCompleteActivity,
    image_vocab_match:       ImageVocabMatchActivity,
    word_formation:          WordFormationActivity,
    odd_one_out:             OddOneOutActivity,
    cloze:                   ClozeActivity,
    open_cloze:              OpenClozeActivity,
    mc_cloze:                McClozeActivity,
    discussion_questions:    DiscussionQuestionsActivity,
    sentence_transformation: SentenceTransformationActivity,
    error_correction:        ErrorCorrectionActivity,
};

function FullscreenMessage({ children, onBack }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8 gap-4" style={{ background: GRADIENT }}>
            <p className="text-white/80 text-sm max-w-xs leading-relaxed">{children}</p>
            <button
                onClick={onBack}
                className="text-[#fc6840] hover:text-white font-display font-semibold text-sm underline cursor-pointer"
            >
                Back to my trilha
            </button>
        </div>
    );
}

export default function StudentActivityPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;
        setData(null);
        setError(null);
        axios.get(`/api/student/activities/${id}`)
            .then(res => { if (alive) setData(res.data); })
            .catch(err => {
                if (!alive) return;
                setError(err.response?.status === 404
                    ? "This activity isn't available."
                    : "Couldn't load this activity. Check your connection and try again.");
            });
        return () => { alive = false; };
    }, [id]);

    const goHome = () => navigate('/s');
    const goBack = () => navigate(data?.trilha_lesson ? `/s/lesson/${data.trilha_lesson}` : '/s');

    // Fire-and-forget: record the attempt and refresh the lesson list so the
    // badge is up to date by the time the student taps Close. A failed POST is
    // swallowed — it must never block the student mid-activity (a 401 is already
    // handled by the axios interceptor, which redirects to /login).
    const handleComplete = useCallback((result) => {
        axios.post('/api/student/attempts', {
            activity_id: Number(id),
            score: result?.score ?? null,
            max_score: result?.maxScore ?? null,
        }).then(() => reloadStudentLessons()).catch(() => {});
    }, [id]);

    if (error) return <FullscreenMessage onBack={goHome}>{error}</FullscreenMessage>;

    if (!data) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: GRADIENT }}>
                <p className="text-white/60 text-sm font-display">Loading…</p>
            </div>
        );
    }

    const content = data.content ?? {};
    const Cmp = COMPONENTS[content.type];

    if (!Cmp) {
        return <FullscreenMessage onBack={goBack}>This activity type isn't available in the student app yet.</FullscreenMessage>;
    }

    // Match the teacher Library's launch contract exactly: quiz takes `quiz`,
    // every other component takes `activity`; `onClose` returns to the lesson.
    // hideSave is always true here — a student saving into the trilha library
    // isn't a real feature (the endpoint is teacher-only and would 403 anyway),
    // it was just never hidden from this launch path.
    const props = content.type === 'quiz'
        ? { quiz: content, onClose: goBack, hideSave: true }
        : { activity: content, onClose: goBack, hideSave: true };

    if (RECORDS_ATTEMPT.has(content.type)) props.onComplete = handleComplete;

    return <Cmp {...props} />;
}
