// "Build this lesson" (2026-11-24, step 1 of the lesson-building workflow): a grid is a named recipe of
// activities per stage. The teacher writes the reading + presentation; the grid makes the rest from them, each
// saved HIDDEN from students until approved (same rule as "Suggest one with Claude").
//
// Edit the grids here. Each slot: stage, type, the source it's made from ('reading' / 'presentation' — falls
// back to the other one if the lesson doesn't have it) and the Instructions sent to Claude (≤ 1000 characters).
// `courses`: 'business' (Aurora Business, light formats only, group wording) or 'general' (Lights / Glow / Radiant).

import { LIGHT_TYPES, isLightCourse } from '@/lib/uiTheme';

const GROUP = ' The class is a small group of 2–4 adults: items are short enough to take in turns, and speaking tasks are for pairs or the whole group (Ask your partner…, Find someone who…).';

export const GRIDS = [
    {
        id: 'reading', label: 'Reading-led', courses: ['business', 'general'],
        blurb: 'Check the reading, learn its words, talk about it.',
        slots: [
            { stage: 'warmer',     type: 'picture_prompts',      source: 'reading',      prompt: 'A short warm-up: 2 picture prompts that bring up the topic of the reading before students read it, each with a simple question and 3 sentence starters.' },
            { stage: 'practice',   type: 'true_false',           source: 'reading',      prompt: 'Create 6 statements about the reading — 3 true and 3 false — that check the main ideas and details.' },
            { stage: 'practice',   type: 'flashcards',           source: 'reading',      prompt: 'Create 8 flashcards with the key words and phrases from the reading, each with a short example sentence from its context.' },
            { stage: 'production', type: 'discussion_questions', source: 'reading',      prompt: 'Generate 5 discussion questions that connect the reading to the students’ own lives and work, each with 2 follow-up prompts, using the reading’s vocabulary.' },
        ],
    },
    {
        id: 'grammar', label: 'Grammar-led', courses: ['business', 'general'],
        blurb: 'Notice the structure, practise it, then use it.',
        slots: [
            { stage: 'warmer',     type: 'odd_one_out',          source: 'presentation', prompt: 'A short warm-up: 4 odd-one-out sets using words and forms from the lesson, each with a one-line reason.' },
            { stage: 'practice',   type: 'cloze',                source: 'presentation', prompt: 'Write a short connected text that uses the presentation’s target language and gap 8 words, with a word bank.' },
            { stage: 'practice',   type: 'error_correction',     source: 'presentation', prompt: 'Write 6 sentences, each with one typical mistake with the presentation’s target language, for students to correct.' },
            { stage: 'production', type: 'discussion_questions', source: 'presentation', prompt: 'Create a “Find someone who…” speaking task: 6 prompts that make students ask each other questions with the presentation’s target language, each with 2 follow-up questions.' },
        ],
    },
    {
        id: 'vocabulary', label: 'Vocabulary-led', courses: ['business', 'general'],
        blurb: 'Pictures and sorting games with the lesson’s words.',
        slots: [
            { stage: 'warmer',     type: 'image_vocab_match',    source: 'reading',      prompt: 'A short warm-up: 6 concrete words from the reading to match with photos.' },
            { stage: 'practice',   type: 'word_categorisation',  source: 'reading',      prompt: 'Create a word categorisation activity with 2 categories of 5 words each, using the reading’s vocabulary. Every word must clearly belong to exactly one category.' },
            { stage: 'practice',   type: 'match_pairs',          source: 'reading',      prompt: 'Create 8 pairs that match the reading’s key words and phrases with their meanings.' },
            { stage: 'production', type: 'picture_prompts',      source: 'reading',      prompt: 'Create 3 picture prompts where describing the photo calls for the reading’s vocabulary, each with a question and 3 sentence starters.' },
        ],
    },
    {
        id: 'simulation', label: 'Simulation', courses: ['business', 'general'],
        blurb: 'Build the dialogue, then act it out.',
        slots: [
            { stage: 'warmer',     type: 'discussion_questions', source: 'reading',      prompt: 'A short warm-up: 3 personal, easy questions that bring up the situation of the lesson, each with 2 follow-up prompts.' },
            { stage: 'practice',   type: 'dialog_gap_fill',      source: 'reading',      prompt: 'Write a natural dialogue in the lesson’s situation that uses its target language, with 6 gaps and options.' },
            { stage: 'practice',   type: 'unjumble',             source: 'presentation', prompt: 'Create 6 useful sentences from the lesson’s target language for students to put in order.' },
            { stage: 'production', type: 'role_play',            source: 'reading',      prompt: 'Create 3 role-play cards in the lesson’s situation where the target language is needed, with a role for Student A and a role for Student B, and an optional role C for a third student.' },
        ],
    },
    {
        id: 'check', label: 'Read & check', courses: ['business', 'general'],
        blurb: 'Short texts and multiple choice, then a short talk.',
        slots: [
            { stage: 'warmer',     type: 'signs_notices',        source: 'reading',      prompt: 'A short warm-up: 4 short texts (notices, messages or emails) linked to the lesson topic, each with one question.' },
            { stage: 'practice',   type: 'mc_reading',           source: 'reading',      prompt: 'Create 5 multiple-choice questions on the reading: main idea, details and the meaning of a word in context.' },
            { stage: 'practice',   type: 'mc_cloze',             source: 'presentation', prompt: 'Write a short connected text that uses the lesson’s target language with 6 multiple-choice gaps.' },
            { stage: 'production', type: 'mini_presentation',    source: 'presentation', prompt: 'Create 3 short talk topics linked to the lesson that students can talk about from their own work, each with 4 steps.' },
        ],
    },
    {
        id: 'transform', label: 'Accuracy (B2)', courses: ['general'],
        blurb: 'Rewrite and complete — for higher levels.',
        slots: [
            { stage: 'warmer',     type: 'discussion_questions',    source: 'reading',      prompt: 'A short warm-up: 3 personal questions that bring up the lesson topic before it is taught, each with 2 follow-up prompts.' },
            { stage: 'practice',   type: 'open_cloze',              source: 'presentation', prompt: 'Write a short connected text that uses the lesson’s target language and gap 8 grammar words (no word bank).' },
            { stage: 'practice',   type: 'sentence_transformation', source: 'presentation', prompt: 'Create 6 key word transformations that practise the lesson’s target language.' },
            { stage: 'production', type: 'debate',                  source: 'reading',      prompt: 'Create 3 debate statements linked to the lesson topic, each with 2 arguments for and 2 against that use the lesson’s target language.' },
        ],
    },
];

/** The grids a course can use, with slots it can't make (a business course: light formats only) left out. */
export function gridsFor(trilha) {
    const business = isLightCourse(trilha);
    return GRIDS
        .filter(g => g.courses.includes(business ? 'business' : 'general'))
        .map(g => ({ ...g, slots: business ? g.slots.filter(s => LIGHT_TYPES.has(s.type)) : g.slots }))
        .filter(g => g.slots.length > 0);
}

/** The Instructions for a slot, with group wording on a business course. */
export function slotPrompt(slot, trilha) {
    return isLightCourse(trilha) ? (slot.prompt + GROUP).slice(0, 1000) : slot.prompt;
}

/**
 * A different grid every lesson: the one sharing the fewest formats with the previous lesson
 * (ties → the usual order for that part: A reading-led, B grammar-led, C simulation).
 */
export function defaultGrid(grids, part, previousTypes = []) {
    const order = { A: ['reading', 'vocabulary', 'grammar'], B: ['grammar', 'check', 'reading'], C: ['simulation', 'grammar', 'reading'] }[part] ?? [];
    const rankOf = g => (order.indexOf(g.id) === -1 ? 99 : order.indexOf(g.id));
    const overlap = g => g.slots.filter(s => previousTypes.includes(s.type)).length;
    return [...grids].sort((a, b) => overlap(a) - overlap(b) || rankOf(a) - rankOf(b))[0] ?? null;
}

/** Lesson parts in course order: 1A < 1B < 1C < 2A … (a lesson with no part counts as A). */
const orderOf = (lesson, part) => lesson * 10 + ((part ?? 'A').charCodeAt(0) - 64);

/**
 * What the course's earlier lessons covered — the last few lessons' reading / presentation and the
 * reading's words — sent with every activity "Build this lesson" makes (`earlier` on /api/generate).
 */
export function earlierSummary(all, trilha, lesson, part, max = 4) {
    const here = orderOf(lesson, part);
    const byLesson = new Map();
    for (const a of all) {
        if (a.trilha !== trilha || !a.trilha_lesson) continue;
        const o = orderOf(a.trilha_lesson, a.trilha_part);
        if (o >= here) continue;
        if (!byLesson.has(o)) byLesson.set(o, { code: `${a.trilha_lesson}${a.trilha_part ?? (part ? 'A' : '')}`, items: [] });
        byLesson.get(o).items.push(a);
    }
    const lines = [...byLesson.entries()].sort((x, y) => y[0] - x[0]).slice(0, max).reverse().map(([, l]) => {
        const reading = l.items.find(a => a.type === 'reading_text');
        const pres    = l.items.find(a => a.type === 'presentation' || a.type === 'grammar_explainer');
        const bits = [];
        if (pres)    bits.push(`presentation “${pres.content?.title || pres.content?.topic || focus(pres.name)}”`);
        if (reading) {
            const words = (reading.content?.vocabulary ?? []).map(v => v.word).filter(Boolean).slice(0, 10);
            bits.push(`reading “${reading.content?.topic || focus(reading.name)}”${words.length ? ` (words: ${words.join(', ')})` : ''}`);
        }
        return bits.length ? `- Lesson ${l.code}: ${bits.join('; ')}` : null;
    }).filter(Boolean);
    return lines.join('\n').slice(0, 1500);
}

/** The activity types of the lesson just before this one, so the next grid can differ from it. */
export function previousLessonTypes(all, trilha, lesson, part) {
    const here = orderOf(lesson, part);
    let best = -1;
    for (const a of all) {
        if (a.trilha !== trilha || !a.trilha_lesson) continue;
        const o = orderOf(a.trilha_lesson, a.trilha_part);
        if (o < here && o > best) best = o;
    }
    return all.filter(a => a.trilha === trilha && a.trilha_lesson && orderOf(a.trilha_lesson, a.trilha_part) === best).map(a => a.type);
}

const focus = name => String(name ?? '').split(' · ').pop();
