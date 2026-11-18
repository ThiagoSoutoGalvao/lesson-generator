import { useEffect, useSyncExternalStore } from 'react';
import { TRILHAS } from '@/lib/trilhas';

// The Aurora Business light theme (AuroraBusiness.md §4). A screen that belongs to a business course calls
// useLightUi(true); while it is mounted, <html data-ui="light"> is set, so every `ui-*` token in app.css turns
// light — the page frame (Layout reads useIsLightUi), the screen itself, and any activity launched inside it.
// Every other screen keeps the "Aurora Night" look. Moving the whole app to light later = set it everywhere.

let holders = 0;
const listeners = new Set();
const apply = () => {
    const on = holders > 0;
    if (on) document.documentElement.dataset.ui = 'light';
    else delete document.documentElement.dataset.ui;
    listeners.forEach(fn => fn());
};

/** Is this course part of Aurora Business (and so drawn in the light theme)? */
export function isLightCourse(trilha) {
    return TRILHAS[trilha]?.program === 'business';
}

// Activity types whose screen has a light version (2026-11-18). On a business course only these can be made, so
// no dark screen ends up in a light lesson. A type joins this list when its light screen ships.
export const LIGHT_TYPES = new Set([
    'quiz', 'flashcards', 'unjumble', 'match_pairs', 'dialog_gap_fill', 'error_correction', 'true_false', 'odd_one_out', 'word_categorisation', 'cloze', 'signs_notices', 'mc_reading', 'mc_cloze', 'image_vocab_match', 'picture_prompts', 'discussion_questions',
    'role_play', 'story_builder', 'debate', 'mini_presentation',
]);

/** Switch the light theme on while the calling component is mounted (and `on` is true). */
export function useLightUi(on) {
    useEffect(() => {
        if (!on) return undefined;
        holders += 1;
        apply();
        return () => { holders -= 1; apply(); };
    }, [on]);
}

/** Whether the light theme is on right now — for the few places that pick an image or a class by theme. */
export function useIsLightUi() {
    return useSyncExternalStore(
        fn => { listeners.add(fn); return () => listeners.delete(fn); },
        () => holders > 0,
        () => false,
    );
}

/** The Display panel's text colour (white, yellow…) on the dark theme; Aurora indigo on the light one. */
export function useInkColor(textColor) {
    return useIsLightUi() ? 'text-ui-ink' : textColor;
}
