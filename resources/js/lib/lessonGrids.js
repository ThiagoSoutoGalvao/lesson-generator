// "Build this lesson" (2026-11-24, step 1 of the lesson-building workflow): a grid is a named recipe of
// activities per stage. The teacher writes the reading + presentation; the grid makes the rest from them, each
// saved HIDDEN from students until approved (same rule as "Suggest one with Claude").
//
// Edit the grids in data/lessonGrids.json. Each slot: stage, type, the source it's made from ('reading' / 'presentation' — falls
// back to the other one if the lesson doesn't have it) and the Instructions sent to Claude (≤ 1000 characters).
// 6 slots per grid (1 warmer, 3 practice, 2 production); the teacher unticks any they don't want before building.
// `courses`: 'business' (Aurora Business, light formats only, group wording) or 'general' (Lights / Glow / Radiant).

import { LIGHT_TYPES, isLightCourse } from '@/lib/uiTheme';

const GROUP = ' The class is a small group of 2–4 adults: items are short enough to take in turns, and speaking tasks are for pairs or the whole group (Ask your partner…, Find someone who…).';

import GRIDS_DATA from '../data/lessonGrids.json';

// The grids themselves are in data/lessonGrids.json (the server's lessons:build reads the same file).
export const GRIDS = GRIDS_DATA;

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
