// Shared config for the Aurora trilha workflow — used by SavePanel and LibraryPage.

export const TRILHAS = {
    Lights:  { label: 'LIGHTS',  lessons: 8,  accent: 'bg-sky-500/80'  },
    Glow:    { label: 'GLOW',    lessons: 8,  accent: 'bg-amber-500/80' },
    Radiant: { label: 'RADIANT', lessons: 12, accent: 'bg-rose-500/80'  },
};

export const TRILHA_NAMES = Object.keys(TRILHAS);

// Verbatim table-of-contents per lesson, taken from the PDFs in `trilhas/`.
// Shown read-only in the Library coverage-grid brief panel so teachers don't
// have to open the PDF in another tab. Wording is unchanged from the source —
// only split into bullet items and OCR artefacts cleaned. Teachers still define
// target language / vocabulary / common errors themselves in the brief fields.
export const TRILHA_TOC = {
    Lights: {
        1: [
            'Personal pronouns (I and you)',
            'Verb to be (affirmative, negative and interrogative forms for I and you)',
            'Alphabet',
            'Numbers (age)',
            'Countries and nationalities',
            'Possessive adjectives (my and your)',
            'Favorite things',
            'Class instructions / important expressions (nothing crazy)',
        ],
        2: [
            'Personal info: email address, phone number, occupation (jobs)',
            'Personal pronouns 2 (he, she, it)',
            "Verb to be 2 ('is' in affirmative, negative and interrogative sentences)",
            'Possessive adjectives 2 (his, her, its)',
            'Essential interactions: "how are you?" + adjectives to express feelings regarding it',
            'Class instructions / important expressions (nothing crazy)',
        ],
        3: [
            'Base form of essential verbs related to everyday life (e.g. eat, work, live, study, watch, read, wear)',
            'Present continuous',
            'Depending on Ss questions, it might be necessary to talk about state verbs',
            'Clothes and accessories (nothing crazy!)',
        ],
        4: [
            'Verbs related to routine',
            'Days of the week',
            'Time',
            'Food and drinks',
            'Simple present (no 3rd person yet!)',
            'Adverbs and expressions of frequency',
        ],
        5: [
            'Simple present (focus on 3rd person)',
            'Object pronouns',
            'Adjectives of personality',
        ],
        6: [
            'Can (all forms)',
            'Vocabulary expansion regarding verbs',
            'Adverbs of manner (nothing crazy!)',
            'Rules and regulation',
        ],
        7: [
            'There be (all forms)',
            'Parts of a house',
            "Places in a city + prepositions of place related to them (e.g. there's a gym near my house; there are 2 supermarkets on my street)",
            'Describe what and where people are doing things (e.g. my sister is working out at the gym; my son is playing football at school; they are studying in the library)',
        ],
        8: [
            'Future time expressions',
            'Free time activities focusing on next weekend/holiday',
            'Be going to (all forms)',
            'Will (all forms)',
        ],
    },
    Glow: {
        1: [
            'To be in the past',
            'There be in the past',
            'Adjectives to describe places/events',
            'Dates & years / prepositions of time (in, on)',
        ],
        2: [
            'Past continuous',
            'Past time expressions',
            'Adverbs of manner',
        ],
        3: [
            'Simple past: regular and irregular',
        ],
        4: [
            'Simple past: negative and questions',
            'Sequencers and connectors (then, suddenly, when...)',
            'Prepositions of movement',
        ],
        5: [
            'Seasons and weather',
            'Animals',
            'Comparative sentences',
        ],
        6: [
            'Superlative adjectives',
            'Kitchen vocabulary',
        ],
        7: [
            'Modals of obligation/permission: can, have to, must, should',
            'Parts of the body',
        ],
        8: [
            'Passive voice: present',
            'Passive voice: past (spend some time working on participles)',
        ],
    },
    Radiant: {
        1: [
            'Present perfect (ever and never)',
        ],
        2: [
            'Present perfect (for and since) + yet / just / already — overview',
            'Simple present and simple past to make present perfect more "obvious" to students',
        ],
        3: [
            'The uses of -ing: gerund, present participle and verb patterns',
        ],
        4: [
            'Conditional sentences: zero, first and second',
        ],
        5: [
            'Word building: derivation (prefixes, suffixes and compound words)',
        ],
        6: [
            'Narrative tenses + adverbs of manner',
        ],
        7: [
            'Collocations: commonly confused verbs and verbs + prepositions',
        ],
        8: [
            'Reported speech',
        ],
        9: [
            'Indefinite pronouns (something, everywhere...) + another topic',
        ],
        10: [
            'Phrasal verbs (separable and non-separable) + include phrasal verbs in the other 2 levels',
        ],
        11: [
            'Minimal pairs (fonetics and spelling)',
        ],
        12: [
            'Project management: how to analyze material, gather information, make and deliver a presentation',
        ],
    },
};

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
