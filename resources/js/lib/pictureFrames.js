// Natural ways to start a sentence about a photo, by level, for Picture Prompts.
// Students default to "I can see…" for every picture; this bank is the "instead try…" list
// shown under the photo. Hand-written on purpose (consistent, natural, easy to edit) —
// Claude only adds picture-specific openers on top of these. Keyed by the activity's
// `level` (A1 / A2 / B1 / B2); an unknown or missing level falls back to B1.
export const PICTURE_PHRASES = {
    A1: [
        'There is a … next to the …',
        'There are … people / … things.',
        'The man / woman is … (sitting, walking, eating…)',
        'He / She is wearing a …',
        'I think it is a … (park, kitchen, street…)',
        'It is … (sunny, busy, quiet).',
    ],
    A2: [
        'This photo shows …',
        'On the left / on the right / in the middle, there is …',
        'It looks like they are …ing …',
        'I think they are … because …',
        'The weather looks … / It looks … (cold, hot, busy).',
        'Maybe it is … (the morning, a holiday, a weekend).',
    ],
    B1: [
        'The picture shows … / This photo was taken in …',
        'In the foreground … / In the background …',
        'It looks as if … / They seem to be …',
        'He / She looks … (tired, excited, worried).',
        "I'd guess that … because …",
        'What stands out to me is …',
    ],
    B2: [
        'The first thing I notice is …',
        'Judging by …, they might be …',
        'The atmosphere feels … / It gives the impression of …',
        "It reminds me of … / If I were there, I'd …",
        'In the background you can just make out …',
        'Although …, … / Whereas …, …',
    ],
};

export const phrasesFor = (level) => PICTURE_PHRASES[level] ?? PICTURE_PHRASES.B1;
