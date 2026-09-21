// Activity names — the rules of trilhas/README.md §3: `TRILHA L## · Type · Focus`, Focus in sentence case,
// at most 6 words, nothing that is already in the name, no student names / dates / "final", "v2", "copy", "NEW".

const ZERO_WIDTH = /[​-‍⁠﻿]/g;
const SPACES = /[\s\p{Z}]+/gu;
const LATIN_LOWER_START = /^[a-zà-ÿ]/;      // only a plain Latin letter is capitalised — never an IPA symbol such as ɪ

export const MAX_FOCUS_WORDS = 6;

/** Underscores and runs of spaces (or invisible characters from a paste) → single spaces; trimmed. */
export function tidyText(s) {
    return (s ?? '').replace(ZERO_WIDTH, '').replace(/_/g, ' ').replace(SPACES, ' ').trim();
}

/** Spaces only — for fields where an underscore may be deliberate (folder names, book, lesson). */
export function collapse(s) {
    return (s ?? '').replace(ZERO_WIDTH, '').replace(SPACES, ' ').trim();
}

const capitaliseFirst = s => (LATIN_LOWER_START.test(s) ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * The Focus as it will be saved: tidy, the " · " separator removed (it would break the name into extra parts),
 * SHOUTING (two or more words, each of 4+ capitals) lowered, first letter capitalised. The rest of the casing is left
 * exactly as typed — proper nouns and acronyms in the middle of a Focus must survive.
 */
export function tidyFocus(s) {
    let f = tidyText((s ?? '').replace(/[·•]/g, ' '));
    const words = f.split(' ').filter(Boolean);
    if (words.length >= 2 && words.every(w => w.length >= 4 && w === w.toUpperCase() && w !== w.toLowerCase())) f = f.toLowerCase();
    return capitaliseFirst(f);
}

export const wordCount = s => (s ? s.split(' ').filter(Boolean).length : 0);

/**
 * A SUGGESTION for tidying an old name — the Library's Rename box opens pre-filled with it and the teacher checks and edits
 * it; it is never applied silently. Underscores → spaces, camelCase split into words ("IrregularVerbsA1" → "Irregular Verbs A1",
 * "CityLife_Country" → "City Life Country"), then tidied. Digits stay attached ("7B", "A1"). With `sentence: true` (a trilha
 * Focus, which the standard wants in sentence case) plain Capitalised words after the first are lower-cased; acronyms and
 * anything with a digit are kept. One-off names keep their capitals, since a proper noun (Curitiba) can't be told from a word.
 * It cannot invent a space where the old name had no boundary at all ("Familyparty"), so the teacher still has to read it.
 */
export function suggestName(original, { sentence = false } = {}) {
    let s = tidyText(original)
        .replace(/([a-z])([A-Z])/g, '$1 $2')            // irregularVerbs → irregular Verbs
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');     // AProcess → A Process
    s = tidyText(s);
    if (sentence) {
        s = s.split(' ').map((w, i) => (i > 0 && /^[A-Z][a-z]+$/.test(w) ? w.toLowerCase() : w)).join(' ');
        return capitaliseFirst(s);
    }
    return s;
}

/**
 * "Present Continuous & Everyday Verbs" — most of the words after the first start with a capital. Only a hint, never a
 * rewrite: "London Underground" or "Past simple vs Present perfect" are legitimate and must be left alone.
 */
function looksTitleCased(f) {
    const rest = f.split(' ').slice(1).filter(w => /^[A-Za-zÀ-ÿ]{3,}/.test(w));   // real words after the first (skips "&", "vs", "a")
    if (rest.length < 2) return false;
    const capitalised = rest.filter(w => /^[A-ZÀ-Þ]/.test(w)).length;
    return capitalised >= 2 && capitalised / rest.length > 0.6;
}

/** Standard violations that need a human's judgement, so they are shown as hints and never block saving. */
export function focusHints(focus, { typeLabel } = {}) {
    const f = tidyFocus(focus);
    if (!f) return [];
    const hints = [];

    const n = wordCount(f);
    if (n > MAX_FOCUS_WORDS) hints.push(`Focus is ${n} words — the standard is ${MAX_FOCUS_WORDS} or fewer.`);

    if (looksTitleCased(f)) hints.push('Use sentence case — only the first word (and names) start with a capital: “Present continuous”, not “Present Continuous”.');

    if (/\b(final|copy)\b/i.test(f) || /\bv\d+\b/i.test(f) || /\bNEW\b/.test(f))
        hints.push('Leave out “final”, “v2”, “copy” and “NEW” — the library keeps track of versions.');

    if (/\b\d{1,2}[/.-]\d{1,2}([/.-]\d{2,4})?\b/.test(f) || /\b20\d{2}\b/.test(f))
        hints.push('Leave dates out of the Focus.');

    const repeats = /\b(lights|glow|radiant)\b/i.test(f)
        || /\bL\d{1,2}\b/.test(f) || /\blessons?\s*\d+/i.test(f)
        || (typeLabel && new RegExp(`\\b${typeLabel.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'i').test(f));
    if (repeats) hints.push('Don’t repeat the trilha, lesson or type — they’re already in the name.');

    return hints;
}
