import { useEffect, useState } from 'react';
import axios from 'axios';

// Shared fetch of GET /api/student/lessons —
//   { [lessonNumber]: [{ id, name, type, done, last_score, last_max, attempts }] }
// plus `taught` ({ lesson, part } on an Aurora Business course: lessons after it are locked; null elsewhere).
// Cached at module scope so navigating between My Trilha and a lesson view
// doesn't refetch. `reloadStudentLessons()` (called after an attempt is
// recorded) busts the cache, refetches, and pushes the fresh data to every
// mounted consumer so badges / counts update without a full reload.

let cache = null;
let inFlight = null;
const subs = new Set();

function fetchLessons() {
    inFlight = inFlight ?? axios.get('/api/student/lessons')
        .then(res => {
            cache = { lessons: res.data.lessons ?? {}, taught: res.data.taught ?? null };
            inFlight = null;
            subs.forEach(fn => fn(cache));
            return cache;
        })
        .catch(err => { inFlight = null; throw err; });
    return inFlight;
}

export function reloadStudentLessons() {
    cache = null;
    inFlight = null;
    return fetchLessons();
}

export function useStudentLessons() {
    const [state, setState] = useState(() =>
        cache ? { loading: false, ...cache } : { loading: true },
    );

    useEffect(() => {
        const onData = data => setState({ loading: false, ...data });
        subs.add(onData);

        if (cache) {
            setState({ loading: false, ...cache });
        } else {
            fetchLessons().catch(() => setState({
                loading: false,
                error: 'Could not load your lessons. Pull to refresh or try again later.',
            }));
        }

        return () => subs.delete(onData);
    }, []);

    return state;
}

// Count of activities for one lesson number.
export function lessonCount(lessons, n) {
    return lessons?.[n]?.length ?? 0;
}

// How many of that lesson's activities the student has completed at least once.
export function lessonDone(lessons, n) {
    return (lessons?.[n] ?? []).filter(a => a.done).length;
}
