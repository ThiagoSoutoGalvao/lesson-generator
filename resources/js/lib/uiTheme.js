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
