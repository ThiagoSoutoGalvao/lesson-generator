// Shared config for the Aurora trilha workflow — used by SavePanel and LibraryPage.

export const TRILHAS = {
    Lights:  { label: 'LIGHTS',  lessons: 8,  accent: 'bg-sky-500/80'  },
    Glow:    { label: 'GLOW',    lessons: 8,  accent: 'bg-amber-500/80' },
    Radiant: { label: 'RADIANT', lessons: 12, accent: 'bg-rose-500/80'  },
};

export const TRILHA_NAMES = Object.keys(TRILHAS);

// Aurora teachers — used for the "Built by" field on a shared login.
export const TEACHERS = ['Fernando', 'Sapulha', 'Daniel', 'Hianna', 'Thiago'];

// Friendly activity-type labels (kept in sync with LibraryPage's own list).
export const TYPE_LABELS = {
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
    presentation:             'Presentation',
    reading_text:             'Reading Text',
    essay_feedback:           'Essay Feedback',
};

// The five activities every lesson should have (see trilhas/README.md).
// Each slot lists the activity types that satisfy it.
export const LESSON_SLOTS = [
    { key: 'presentation', label: 'Presentation', types: ['presentation', 'grammar_explainer'] },
    { key: 'reading',      label: 'Reading Text', types: ['reading_text'] },
    { key: 'vocabulary',   label: 'Vocabulary',   types: ['flashcards', 'image_vocab_match'] },
    { key: 'grammar',      label: 'Grammar',      types: ['quiz', 'sentence_transformation', 'error_correction', 'cloze', 'word_formation'] },
    { key: 'speaking',     label: 'Speaking',     types: ['discussion_questions'] },
];

// "LIGHTS L03 · Quiz · Present continuous & everyday verbs"
export function composeActivityName({ trilha, lesson, type, focus }) {
    const t = TRILHAS[trilha]?.label ?? (trilha ?? '').toUpperCase();
    const l = lesson ? `L${String(lesson).padStart(2, '0')}` : '';
    const typeLabel = TYPE_LABELS[type] ?? type;
    const f = (focus ?? '').trim();
    return [`${t} ${l}`.trim(), typeLabel, f].filter(Boolean).join(' · ');
}
