// Which exam each /generate template is modelled on, for the "-style" pills on the
// format cards and the "Preparing a student for an exam?" filter.
//
//   from   lowest CEFR level the format suits — shown as an "A1+" style tag
//   exams  the exam tasks it mirrors:
//            kind 'direct'  same task shape  → gets a pill and counts for the filter
//            kind 'similar' related skill    → only mentioned in the card's detail line
//
// Wording is deliberately "Cambridge-style" / "DET-style" / "TOEFL-style": the names are
// trademarks (ETS's rules allow them only descriptively), so the pills say "modelled on
// the format", never "official". No logos or exam colours; all content is original.
// Sources: TOEFLResearch.md, CambridgePracticeMode.md, the DET roadmap. The template→task
// pairing is a judgement call, not something an exam body states — edit freely.

export const EXAMS = {
    cambridge: 'Cambridge-style',
    det:       'DET-style',
    toefl:     'TOEFL-style',
};

export const EXAM_ORDER = ['cambridge', 'det', 'toefl'];

const direct  = (exam, task) => ({ exam, kind: 'direct',  task });
const similar = (exam, task) => ({ exam, kind: 'similar', task });

export const TEMPLATE_META = {
    flashcards:               { from: 'A1', exams: [] },
    image_vocab_match:        { from: 'A1', exams: [] },
    word_categorisation:      { from: 'A1', exams: [] },
    odd_one_out:              { from: 'A2', exams: [] },
    word_formation:           { from: 'A2', exams: [direct('cambridge', 'Use of English Part 3, word formation')] },
    quiz:                     { from: 'A1', exams: [] },
    cloze:                    { from: 'A1', exams: [] },
    open_cloze:               { from: 'A2', exams: [direct('cambridge', 'Use of English Part 2, open cloze')] },
    mc_cloze:                 { from: 'B1', exams: [direct('cambridge', 'Use of English Part 1, multiple-choice cloze')] },
    sentence_transformation:  { from: 'B1', exams: [direct('cambridge', 'Use of English Part 4, key word transformation')] },
    error_correction:         { from: 'A2', exams: [] },
    error_correction_passage: { from: 'B1', exams: [] },
    unjumble:                 { from: 'A1', exams: [direct('toefl', 'Writing, Build a Sentence')] },
    dialog_gap_fill:          { from: 'A1', exams: [similar('toefl', 'Listen and Choose a Response (there it is heard, here it is read)')] },
    true_false:               { from: 'A2', exams: [] },
    mc_reading:               { from: 'B1', exams: [
        direct('cambridge', 'Reading Part 5, long-text multiple choice'),
        direct('toefl', 'Reading, Read an Academic Passage'),
        similar('det', 'Interactive Reading (five smaller tasks, not one question set)'),
    ] },
    read_complete:            { from: 'A2', exams: [
        direct('det', 'Read and Complete'),
        direct('toefl', 'Reading, Complete the Words'),
    ] },
    discussion_questions:     { from: 'A2', exams: [
        similar('cambridge', 'Speaking Parts 1 and 4 (interview, discussion)'),
        similar('det', 'Interactive Speaking (a chained scenario, not separate questions)'),
        similar('toefl', 'Take an Interview (four linked questions, not six separate ones)'),
    ] },
};

export const isDirect = (templateId, exam) =>
    (TEMPLATE_META[templateId]?.exams ?? []).some(x => x.exam === exam && x.kind === 'direct');
