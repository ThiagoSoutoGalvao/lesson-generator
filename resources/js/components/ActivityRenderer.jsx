import { useEffect, useState } from 'react';
import axios from 'axios';
import { ITEM_SPECS, saveItems } from '@/lib/itemEdit';
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
import MatchPairsActivity from '@/components/MatchPairsActivity';
import SignsNoticesActivity from '@/components/SignsNoticesActivity';
import PicturePromptsActivity from '@/components/PicturePromptsActivity';
import RolePlayActivity from '@/components/RolePlayActivity';
import StoryBuilderActivity from '@/components/StoryBuilderActivity';
import DebateActivity from '@/components/DebateActivity';
import MiniPresentationActivity from '@/components/MiniPresentationActivity';
import GrammarExplainerActivity from '@/components/GrammarExplainerActivity';
import ReadingTextActivity from '@/components/ReadingTextActivity';
import EssayFeedbackActivity from '@/components/EssayFeedbackActivity';
import ListeningActivity from '@/components/ListeningActivity';

// One saved activity, fullscreen, as a teacher launches it (from the Library or a lesson pack). Moved out of
// LibraryPage (Aurora Lessons Phase 1, step 4) so every teacher-side launcher shows the same thing.
//   content          the saved activity's `content` (what the components call `activity`)
//   savedId          its Library id — speaking activities save "Use it!" ticks and target edits against it
//   onTargetsChange  called with the new target list after an edit, so the caller's copy stays current
//   onDerive         Reading Text only: open an activity derived from the text in its place
//   onContentChange  called with the new content after an edit made inside the activity
// Edit inside the activity (2026-11-28): the template gets `onEditItems(listKey, list)`; `live` holds the edited copy.
// The student app has its own map (StudentActivityPlayer), which adds hideSave + onComplete.

const SPEAKING = {
    discussion_questions: DiscussionQuestionsActivity,
    picture_prompts:      PicturePromptsActivity,
    role_play:            RolePlayActivity,
    story_builder:        StoryBuilderActivity,
    debate:               DebateActivity,
    mini_presentation:    MiniPresentationActivity,
};

const OTHERS = {
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
    sentence_transformation: SentenceTransformationActivity,
    error_correction:        ErrorCorrectionActivity,
    match_pairs:             MatchPairsActivity,
    signs_notices:           SignsNoticesActivity,
    grammar_explainer:       GrammarExplainerActivity,
    presentation:            GrammarExplainerActivity,
    essay_feedback:          EssayFeedbackActivity,
    listening:               ListeningActivity,
};

export default function ActivityRenderer({ content, savedId = null, name = null, onClose, onTargetsChange, onContentChange, onDerive }) {
    const [live, setLive] = useState(content);
    useEffect(() => { setLive(content); }, [content]);
    if (!live) return null;
    const type = live.type;
    // Edit inside the activity (2026-11-28): only on a saved activity whose type has an item spec (lib/itemEdit.jsx).
    const onEditItems = savedId && ITEM_SPECS[type]
        ? async (listKey, list) => {
            const saved = await saveItems(axios, savedId, listKey, list);
            setLive(saved);
            onContentChange?.(saved);
        }
        : null;
    if (type === 'quiz') return <QuizActivity quiz={live} onClose={onClose} onEditItems={onEditItems} />;
    if (type === 'reading_text') return <ReadingTextActivity activity={live} name={name} onClose={onClose} onDerive={onDerive} />;
    const Speaking = SPEAKING[type];
    if (Speaking) return <Speaking activity={live} onClose={onClose} savedId={savedId} onTargetsChange={onTargetsChange} onContentChange={onContentChange} onEditItems={onEditItems} />;
    const Component = OTHERS[type];
    return Component ? <Component activity={live} onClose={onClose} onEditItems={onEditItems} /> : null;
}
