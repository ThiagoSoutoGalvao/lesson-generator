// Student-app labels + icons for the activity types a student can be shown.
// Teacher-only types (essay_feedback, grammar_explainer) are filtered out server-side and deliberately absent here.
// `presentation` reaches a student via a Homework assignment (2026-09-24); on an Aurora Business course the lesson's
// presentation and reading are part of the course too (TaughtUpTo, 2026-11-28).

export const ACTIVITY_META = {
    quiz:                    { label: 'Quiz',                 icon: '❓' },
    flashcards:              { label: 'Flashcards',           icon: '🃏' },
    unjumble:                { label: 'Unjumble',             icon: '🧩' },
    dialog_gap_fill:         { label: 'Dialogue gap-fill',    icon: '💬' },
    word_categorisation:     { label: 'Categorise',           icon: '🗂️' },
    true_false:              { label: 'True / False',         icon: '⚖️' },
    listening:               { label: 'Listening',            icon: '🎧' },
    mc_reading:              { label: 'Reading',              icon: '📖' },
    read_complete:           { label: 'Read & complete',      icon: '✏️' },
    image_vocab_match:       { label: 'Picture match',        icon: '🖼️' },
    word_formation:          { label: 'Word formation',       icon: '🔤' },
    odd_one_out:             { label: 'Odd one out',          icon: '🎯' },
    cloze:                   { label: 'Cloze',                icon: '📝' },
    open_cloze:              { label: 'Open cloze',           icon: '📝' },
    mc_cloze:                { label: 'Multiple-choice cloze', icon: '📝' },
    discussion_questions:    { label: 'Discussion',           icon: '🗣️' },
    sentence_transformation: { label: 'Transform',            icon: '🔄' },
    error_correction:        { label: 'Find the mistake',     icon: '🔍' },
    match_pairs:             { label: 'Match pairs',          icon: '🔗' },
    signs_notices:           { label: 'Signs & notices',      icon: '🪧' },
    picture_prompts:         { label: 'Describe the picture', icon: '📷' },
    role_play:               { label: 'Role-play',            icon: '🎭' },
    story_builder:           { label: 'Tell a story',         icon: '📚' },
    debate:                  { label: 'Debate',               icon: '⚖️' },
    mini_presentation:       { label: 'Mini presentation',    icon: '🎤' },
    presentation:            { label: 'Presentation',         icon: '📽️' },
    reading_text:            { label: 'Reading',              icon: '📖' },
};

export function activityMeta(type) {
    return ACTIVITY_META[type] ?? { label: 'Activity', icon: '•' };
}
