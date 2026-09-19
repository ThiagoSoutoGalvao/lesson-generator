// The levels a teacher can pick on /generate. The backend (App\Services\LanguageLevel)
// turns the chosen id into a LEVEL rule in every activity prompt; `say` is the
// plain-language version of that rule, shown under the selector — keep the two in step.
// B1 is the default and reproduces the wording the app used before the selector existed.
export const DEFAULT_LEVEL = 'B1';

export const LEVELS = [
    { id: 'A1', label: 'A1',  name: 'Beginner',     say: 'Everyday words only, very short sentences (mostly 3 to 8 words), present simple, "to be" and "can". No idioms or phrasal verbs.' },
    { id: 'A2', label: 'A2',  name: 'Elementary',   say: 'Common everyday words, short sentences (mostly 5 to 10 words), present and past simple, "going to". Almost no idioms.' },
    { id: 'B1', label: 'B1',  name: 'Intermediate', say: 'The wording the app has always used: B1–B2 English.' },
    { id: 'B2', label: 'B2+', name: 'Upper-int.',   say: 'Natural, idiomatic English: collocations, phrasal verbs and complex sentences.' },
];

// Lowest-to-highest, for comparing a template's "works from" level with the chosen one.
export const LEVEL_RANK = { A1: 1, A2: 2, B1: 3, B2: 4 };
