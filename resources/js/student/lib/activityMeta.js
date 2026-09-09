// Student-app labels + icons for the activity types a student can be shown.
// The teacher-only types (presentation, reading_text, essay_feedback,
// grammar_explainer) are filtered out server-side and deliberately absent here.

export const ACTIVITY_META = {
    quiz:                    { label: 'Quiz',                 icon: '❓' },
    flashcards:              { label: 'Flashcards',           icon: '🃏' },
    unjumble:                { label: 'Unjumble',             icon: '🧩' },
    dialog_gap_fill:         { label: 'Dialogue gap-fill',    icon: '💬' },
    word_categorisation:     { label: 'Categorise',           icon: '🗂️' },
    true_false:              { label: 'True / False',         icon: '⚖️' },
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
};

export function activityMeta(type) {
    return ACTIVITY_META[type] ?? { label: 'Activity', icon: '•' };
}
