// "Suggest one with Claude" on an empty lesson-pack stage (Aurora Lessons Phase 1, step 7): which template
// suits that stage at the course's level, and how to ask for it. The order is the level × stage table agreed
// in the Aurora Lessons plan — lower levels recognise and choose, higher levels transform and produce. A type
// the lesson already has is skipped, so a suggestion adds variety instead of a second copy.

const BAND = { A1: 'low', A2: 'low', B1: 'mid', B2: 'high' };

const CANDIDATES = {
    warmer: {
        low:  ['picture_prompts', 'image_vocab_match', 'flashcards'],
        mid:  ['discussion_questions', 'picture_prompts', 'odd_one_out'],
        high: ['discussion_questions', 'picture_prompts', 'odd_one_out'],
    },
    practice: {
        low:  ['match_pairs', 'quiz', 'unjumble', 'cloze'],
        mid:  ['cloze', 'quiz', 'error_correction', 'dialog_gap_fill'],
        high: ['open_cloze', 'sentence_transformation', 'word_formation', 'error_correction'],
    },
    production: {
        low:  ['picture_prompts', 'role_play'],
        mid:  ['role_play', 'story_builder', 'discussion_questions'],
        high: ['debate', 'role_play', 'story_builder', 'mini_presentation'],
    },
};

// A warmer is short: it brings up the topic and gets the student talking before the presentation.
const WARMER_PROMPTS = {
    picture_prompts:      'A short warm-up: create 2 picture prompts that bring up the lesson topic, each with a simple question and 2 sentence starters.',
    image_vocab_match:    'A short warm-up: 6 key words from the lesson to match with pictures.',
    flashcards:           'A short warm-up: 6 flashcards with the key words the lesson uses.',
    discussion_questions: 'A short warm-up: 3 personal, easy-to-answer questions that bring up the lesson topic before it is taught, each with 2 follow-up prompts.',
    odd_one_out:          'A short warm-up: 4 odd-one-out sets using words from the lesson topic.',
};

const PROMPTS = {
    match_pairs:             'Create 8 pairs that practise the lesson’s target language (word ↔ meaning, or sentence half ↔ sentence half).',
    quiz:                    'Generate 6 multiple choice questions on the lesson’s target language. Vary the focus: meaning, use in context and form.',
    unjumble:                'Create 6 sentences using the lesson’s target language for the student to put in order.',
    cloze:                   'Write a short connected text using the lesson’s target language and gap 8 words, with a word bank.',
    error_correction:        'Write 6 sentences, each with one typical mistake with the lesson’s target language, for the student to correct.',
    dialog_gap_fill:         'Write a natural dialogue that uses the lesson’s target language, with 6 gaps and options.',
    open_cloze:              'Write a short connected text that uses the lesson’s target language and gap 8 grammar words (no word bank).',
    sentence_transformation: 'Create 6 key word transformations that practise the lesson’s target language.',
    word_formation:          'Create 6 word formation items based on words from the lesson.',
    picture_prompts:         'Create 3 picture prompts where describing the photo calls for the lesson’s target language, each with a question and 2-3 sentence starters.',
    role_play:               'Create 3 role-play cards. Each has an everyday situation where the lesson’s target language is needed, a role for the student and a role for the teacher.',
    story_builder:           'Create 3 stories, each with a title and 6 short prompts in order, that the student tells using the lesson’s target language.',
    discussion_questions:    'Generate 6 open-ended discussion questions that call for the lesson’s target language, each with 2 follow-up prompts.',
    debate:                  'Create 3 debate statements linked to the lesson topic, each with 2 arguments for and 2 against that use the lesson’s target language.',
    mini_presentation:       'Create 3 presentation topics linked to the lesson that the student can talk about from their own life, each with 4-5 steps.',
};

/**
 * @param {string} stage            'warmer' | 'practice' | 'production'
 * @param {string} level            the course level (A1 / A2 / B1 / B2)
 * @param {string[]} existingTypes  types the lesson already has, in any stage
 * @returns {{type: string, prompt: string} | null}
 */
export function pickFill(stage, level, existingTypes = []) {
    const list = CANDIDATES[stage]?.[BAND[level] ?? 'mid'];
    if (!list) return null;
    const type = list.find(t => !existingTypes.includes(t)) ?? list[0];
    const prompt = (stage === 'warmer' && WARMER_PROMPTS[type]) || PROMPTS[type] || WARMER_PROMPTS[type];
    return { type, prompt };
}

export const FILLABLE_STAGES = Object.keys(CANDIDATES);
