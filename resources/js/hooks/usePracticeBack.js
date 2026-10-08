import { createContext, useContext } from 'react';

// Every Cambridge/DET drill leaf component hardcodes where its own "Back" button
// goes, because it's the deepest component and has no other way to know who
// launched it. Historically that was always `navigate('/upload', { state: { tab } })`
// — fine while only the teacher's Upload page could reach these drills. Aurora
// Homework Phase H1 added a second launcher (the student's Practice tab, see
// resources/js/student/pages/PracticePage.jsx), which doesn't live at /upload at
// all — so the leaf components now read their back target from this context
// instead of hardcoding it. `CambridgePracticePage` / `DetPracticePage` set it
// once, at the top of the tree, based on which shell rendered them.
export const PracticeBackContext = createContext(null);

// `fallback` is the teacher's default ({ path: '/practice', state: { tab } } since 2026-10-08, when the practice
// launchers moved off the Upload page)
// so a drill rendered with no provider (e.g. in isolation, tests) keeps working.
export function usePracticeBack(fallback) {
    return useContext(PracticeBackContext) ?? fallback;
}
