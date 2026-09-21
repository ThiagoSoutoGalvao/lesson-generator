// Cambridge Practice runs at two levels. B2 First is the original set. "A2 easy start" is a
// smaller set of the same seven Reading & Use of English task types written at A2, for a
// learner who is starting out — original content, not an official A2 exam task set, and no
// score claims (same rules as the B2 content). The label deliberately avoids the exam names
// (trademarks); only the seven task types below have A2 content (2–3 sets each, in
// resources/js/data/cambridge/a2/).
export const CAMBRIDGE_LEVEL_LABEL = { b2: 'B2 First', a2: 'A2 easy start' };

// The task types that have A2 content — route `type` slugs, in the order they are listed.
export const A2_PARTS = [
    { type: 'word-formation',          label: 'Word Formation' },
    { type: 'key-word-transformation', label: 'Key Word Transformation' },
    { type: 'mc-cloze',                label: 'Multiple-Choice Cloze' },
    { type: 'open-cloze',              label: 'Open Cloze' },
    { type: 'mc-reading',              label: 'Multiple Choice Reading' },
    { type: 'multiple-matching',       label: 'Multiple Matching' },
    { type: 'gapped-text',             label: 'Gapped Text' },
];
export const A2_TYPES = A2_PARTS.map(p => p.type);

// "Reading & Use of English, Part 3" at B2; at A2 the task is only *in the style of* that part.
export const partHint = (level, n) => (level === 'a2' ? `Part ${n} style` : `Reading & Use of English, Part ${n}`);
