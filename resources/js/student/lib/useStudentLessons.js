import { useEffect, useState } from 'react';
import axios from 'axios';

// Shared fetch of GET /api/student/lessons — { [lessonNumber]: [{ id, name, type }] }.
// Cached at module scope so navigating between My Trilha and a lesson view
// doesn't refetch. Phase S3 will add a `reload()` when attempts start mutating it.

let cache = null;
let inFlight = null;

function load() {
    if (cache) return Promise.resolve(cache);
    inFlight = inFlight ?? axios.get('/api/student/lessons').then(res => {
        cache = res.data.lessons ?? {};
        inFlight = null;
        return cache;
    }).catch(err => {
        inFlight = null;
        throw err;
    });
    return inFlight;
}

export function useStudentLessons() {
    const [state, setState] = useState(() =>
        cache ? { loading: false, lessons: cache } : { loading: true },
    );

    useEffect(() => {
        if (cache) return;
        let alive = true;
        load().then(
            lessons => alive && setState({ loading: false, lessons }),
            () => alive && setState({ loading: false, error: 'Could not load your lessons. Pull to refresh or try again later.' }),
        );
        return () => { alive = false; };
    }, []);

    return state;
}

// Count of activities for one lesson number.
export function lessonCount(lessons, n) {
    return lessons?.[n]?.length ?? 0;
}
