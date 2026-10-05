// Remembers which trilha lesson the teacher is currently building, across
// screens. Set whenever an activity is saved in Trilha mode; read by
// SavePanel (to pre-fill Trilha + Lesson) and GeneratePage (to show a
// "Adding to: ..." chip and offer a shortcut back into building). Purely a
// per-browser convenience — nothing server-side.

const KEY = 'aurora.lessonSession';

export function getLessonSession() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.trilha && parsed?.lesson ? parsed : null;
    } catch {
        return null;
    }
}

// `stage` (optional) is the lesson-pack stage a "+ Add" button came from: the Save panel pre-picks it.
// Saving an activity calls this again without one, so it applies to that one save only.
export function setLessonSession(trilha, lesson, stage = null) {
    try {
        localStorage.setItem(KEY, JSON.stringify(stage ? { trilha, lesson, stage } : { trilha, lesson }));
    } catch { /* ignore */ }
}

export function clearLessonSession() {
    try {
        localStorage.removeItem(KEY);
    } catch { /* ignore */ }
}
