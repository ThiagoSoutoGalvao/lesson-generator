import { useEffect, useState } from 'react';
import axios from 'axios';

// Shared fetch of GET /api/student/lessons —
//   { [lessonNumber]: [{ id, name, type, done, last_score, last_max, attempts }] }
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
            cache = res.data.lessons ?? {};
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
        cache ? { loading: false, lessons: cache } : { loading: true },
    );

    useEffect(() => {
        const onData = lessons => setState({ loading: false, lessons });
        subs.add(onData);

        if (cache) {
            setState({ loading: false, lessons: cache });
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
