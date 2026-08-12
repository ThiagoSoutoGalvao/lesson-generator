// One-off tool for Phase 2 of the Pronunciation feature (see PronunciationFeature.md).
// Generates phoneme + word audio via OpenAI TTS and writes them into
// public/audio/pronunciation/{phonemes,words}/ using the exact filenames the
// JSON data files already reference.
//
// Usage:
//   node scripts/generate-pronunciation-audio.mjs spotcheck
//   node scripts/generate-pronunciation-audio.mjs all
//   node scripts/generate-pronunciation-audio.mjs phonemes
//   node scripts/generate-pronunciation-audio.mjs words
//   node scripts/generate-pronunciation-audio.mjs sentences
//   (add --force to regenerate files that already exist)
//
// IMPORTANT: `sentences` mode is intentionally its own isolated mode, not
// folded into `words`/`all`. A past `--force` run on `words` mode silently
// regenerated the entire word corpus (see Claude.md §12, Word Stress Drill),
// including files unrelated to what was actually being worked on. Keeping
// `sentences` separate means a `--force` run here can only ever touch
// public/audio/pronunciation/sentences/, never phonemes/ or words/.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'resources/js/data/pronunciation');
const AUDIO_DIR = path.join(ROOT, 'public/audio/pronunciation');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
    console.error('OPENAI_API_KEY not found in .env');
    process.exit(1);
}

const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'fable';
const CONCURRENCY = 4;

const mode = process.argv[2] ?? 'spotcheck';
const force = process.argv.includes('--force');

function readJson(name) {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

function buildPhonemeList(category = null) {
    return readJson('phonemes.json')
        .filter(p => !category || p.category === category)
        .map(p => ({ symbol: p.symbol, example: p.example }));
}

function buildWordList() {
    const words = new Map(); // word -> example sentence context not needed, just dedupe
    const add = w => { if (w) words.set(w.toLowerCase(), true); };

    for (const card of readJson('soundCards.json')) {
        for (const ex of card.exampleWords) add(ex.word);
    }
    for (const group of readJson('minimalPairs.json')) {
        for (const item of group.words) add(item.word);
    }
    for (const group of readJson('edEndings.json')) {
        for (const item of group.words) add(item.word);
    }
    for (const group of readJson('wordStress.json')) {
        for (const item of group.words) {
            // Noun/verb stress pairs (e.g. "record (noun)") aren't plain words —
            // same spelling, two different pronunciations — handled separately
            // by buildStressPairList()/generateStressPairs() below.
            if (!item.word.includes('(')) add(item.word);
        }
    }
    for (const group of readJson('silentLetters.json')) {
        for (const item of group.words) add(item.word);
    }
    return [...words.keys()];
}

// Noun/verb stress-pair words (record, present, object, contract, produce,
// convert, export, import, permit, protest) need a distinct audio file per
// part of speech since the spelling is identical but the stress — and
// therefore the pronunciation — differs. A short context sentence per form
// biases the TTS toward the right reading; the explicit "stress falls on
// the Nth syllable" instruction (derived from the word's own stressIndex,
// not hardcoded) is what actually locks it in reliably.
const STRESS_PAIR_CONTEXT = {
    record:   { noun: 'I broke the world record.',        verb: 'Please record this conversation.' },
    present:  { noun: 'I have a present for you.',         verb: 'I will present the results tomorrow.' },
    object:   { noun: 'Please pass me that object.',       verb: 'I object to this plan.' },
    contract: { noun: 'We signed the contract yesterday.', verb: 'Muscles contract when you exercise.' },
    produce:  { noun: 'The market sells fresh produce.',   verb: 'Factories produce many goods.' },
    convert:  { noun: 'She is a recent convert to vegetarianism.', verb: 'Please convert the file to PDF.' },
    export:   { noun: "Coffee is Brazil's biggest export.",        verb: 'They export coffee to many countries.' },
    import:   { noun: 'Cars are a major import for this country.', verb: 'We import most of our electronics.' },
    permit:   { noun: 'You need a permit to park here.',           verb: "They won't permit smoking indoors." },
    protest:  { noun: 'The protest lasted all afternoon.',         verb: 'Workers protest the new policy.' },
};

const ORDINALS = ['first', 'second', 'third', 'fourth'];

function buildStressPairList() {
    const groups = readJson('wordStress.json');
    const pairGroup = groups.find(g => g.category === 'noun/verb stress pairs');
    if (!pairGroup) return [];

    return pairGroup.words.map(item => {
        const match = item.word.match(/^(.+?) \((noun|verb)\)$/);
        if (!match) throw new Error(`Unexpected stress-pair word format: "${item.word}"`);
        const [, base, pos] = match;
        const context = STRESS_PAIR_CONTEXT[base]?.[pos];
        if (!context) throw new Error(`No context sentence for "${base}" (${pos}) — add one to STRESS_PAIR_CONTEXT`);
        return {
            base,
            pos,
            filename: path.basename(item.audio),
            context,
            stressOrdinal: ORDINALS[item.stressIndex] ?? `syllable ${item.stressIndex + 1}`,
        };
    });
}

// Homophones Drill sentence audio — full sentences, not single words, since
// homophones sound identical and only sentence-level context (meaning) can
// tell which spelling was intended. Entirely separate list-builder from
// buildWordList()/buildStressPairList() above — see the isolation note at
// the top of this file for why.
function buildSentenceList() {
    const groups = readJson('homophones.json');
    const items = [];
    for (const group of groups) {
        for (const w of group.words) {
            items.push({ sentence: w.sentence, filename: path.basename(w.audio) });
        }
    }
    return items;
}

const SPOTCHECK_PHONEMES = ['ɪ', 'iː', 'θ', 'ð', 'æ', 'ʌ'];
const SPOTCHECK_WORDS = ['ship', 'sheep', 'think', 'this', 'walked', 'wanted'];

function phonemeInstructions(symbol, example) {
    return `This audio is for a phonemic chart in an English pronunciation app. `
        + `Say ONLY the isolated phoneme sound /${symbol}/ — the single vowel or consonant `
        + `sound found in the word "${example}" — not the whole word. Hold the sound for `
        + `about one second. Use a clear, neutral British English (Received Pronunciation) `
        + `accent. Do not add a vowel sound before or after a consonant. Do not say anything else.`;
}

function wordInstructions() {
    return `Read this single English word aloud once, clearly, in a neutral British English `
        + `(Received Pronunciation) accent, at a natural speaking pace, as if teaching a `
        + `language learner. Say only the word, nothing else, no extra sounds.`;
}

function stressPairInstructions({ base, pos, context, stressOrdinal }) {
    return `This audio is for a word-stress teaching app. Say ONLY the single word "${base}" — `
        + `not a full sentence — pronounced exactly as it would sound as a ${pos} in this `
        + `sentence: "${context}". The stress must fall on the ${stressOrdinal} syllable of `
        + `"${base}". Use a clear, neutral British English (Received Pronunciation) accent. `
        + `Say only the word itself, nothing else, no extra sounds.`;
}

function sentenceInstructions() {
    return `This audio is for a homophones teaching app. Read this full English sentence aloud `
        + `once, naturally, in a clear neutral British English (Received Pronunciation) accent, `
        + `at a natural speaking pace, as if reading it to a language learner so the meaning is `
        + `easy to follow. Say only the sentence itself, nothing else, no extra sounds.`;
}

async function synthesize(input, instructions) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            voice: VOICE,
            input,
            instructions,
            response_format: 'mp3',
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

async function synthesizeWithRetry(input, instructions, attempts = 3) {
    for (let i = 1; i <= attempts; i++) {
        try {
            return await synthesize(input, instructions);
        } catch (err) {
            if (i === attempts) throw err;
            const wait = 1500 * i;
            console.warn(`  retry ${i}/${attempts - 1} after error: ${err.message} (waiting ${wait}ms)`);
            await new Promise(r => setTimeout(r, wait));
        }
    }
}

async function runPool(items, worker) {
    let cursor = 0;
    const results = { created: 0, skipped: 0, failed: [] };

    async function next() {
        while (cursor < items.length) {
            const item = items[cursor++];
            try {
                const outcome = await worker(item);
                if (outcome === 'skipped') results.skipped++;
                else results.created++;
            } catch (err) {
                results.failed.push({ item, error: err.message });
                console.error(`  FAILED: ${JSON.stringify(item)} — ${err.message}`);
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, next));
    return results;
}

async function generatePhonemes(list) {
    fs.mkdirSync(path.join(AUDIO_DIR, 'phonemes'), { recursive: true });
    return runPool(list, async ({ symbol, example }) => {
        const outPath = path.join(AUDIO_DIR, 'phonemes', `${symbol}.mp3`);
        if (fs.existsSync(outPath) && !force) return 'skipped';
        const buf = await synthesizeWithRetry(example, phonemeInstructions(symbol, example));
        fs.writeFileSync(outPath, buf);
        console.log(`  wrote phonemes/${symbol}.mp3`);
        return 'created';
    });
}

async function generateWords(list) {
    fs.mkdirSync(path.join(AUDIO_DIR, 'words'), { recursive: true });
    return runPool(list, async (word) => {
        const outPath = path.join(AUDIO_DIR, 'words', `${word}.mp3`);
        if (fs.existsSync(outPath) && !force) return 'skipped';
        const buf = await synthesizeWithRetry(word, wordInstructions());
        fs.writeFileSync(outPath, buf);
        console.log(`  wrote words/${word}.mp3`);
        return 'created';
    });
}

async function generateStressPairs(list) {
    fs.mkdirSync(path.join(AUDIO_DIR, 'words'), { recursive: true });
    return runPool(list, async (item) => {
        const outPath = path.join(AUDIO_DIR, 'words', item.filename);
        if (fs.existsSync(outPath) && !force) return 'skipped';
        const buf = await synthesizeWithRetry(item.base, stressPairInstructions(item));
        fs.writeFileSync(outPath, buf);
        console.log(`  wrote words/${item.filename}`);
        return 'created';
    });
}

async function generateSentences(list) {
    fs.mkdirSync(path.join(AUDIO_DIR, 'sentences'), { recursive: true });
    return runPool(list, async (item) => {
        const outPath = path.join(AUDIO_DIR, 'sentences', item.filename);
        if (fs.existsSync(outPath) && !force) return 'skipped';
        const buf = await synthesizeWithRetry(item.sentence, sentenceInstructions());
        fs.writeFileSync(outPath, buf);
        console.log(`  wrote sentences/${item.filename}`);
        return 'created';
    });
}

function printSummary(label, result) {
    console.log(`\n${label}: ${result.created} created, ${result.skipped} skipped, ${result.failed.length} failed`);
    if (result.failed.length) {
        console.log('Failures:', result.failed.map(f => f.item).join(', '));
    }
}

(async () => {
    console.log(`Mode: ${mode}${force ? ' (force regenerate)' : ''}\n`);

    if (mode === 'spotcheck') {
        const phonemes = buildPhonemeList().filter(p => SPOTCHECK_PHONEMES.includes(p.symbol));
        console.log(`Generating ${phonemes.length} spot-check phonemes...`);
        printSummary('Phonemes', await generatePhonemes(phonemes));

        console.log(`\nGenerating ${SPOTCHECK_WORDS.length} spot-check words...`);
        printSummary('Words', await generateWords(SPOTCHECK_WORDS));
    } else if (mode === 'phonemes') {
        const phonemes = buildPhonemeList();
        console.log(`Generating all ${phonemes.length} phonemes...`);
        printSummary('Phonemes', await generatePhonemes(phonemes));
    } else if (mode === 'diphthongs') {
        const phonemes = buildPhonemeList('diphthong');
        console.log(`Generating ${phonemes.length} diphthongs...`);
        printSummary('Diphthongs', await generatePhonemes(phonemes));
    } else if (mode === 'words') {
        const words = buildWordList();
        console.log(`Generating all ${words.length} words...`);
        printSummary('Words', await generateWords(words));

        const stressPairs = buildStressPairList();
        console.log(`\nGenerating ${stressPairs.length} noun/verb stress-pair words...`);
        printSummary('Stress pairs', await generateStressPairs(stressPairs));
    } else if (mode === 'all') {
        const phonemes = buildPhonemeList();
        const words = buildWordList();
        console.log(`Generating ${phonemes.length} phonemes + ${words.length} words...`);
        printSummary('Phonemes', await generatePhonemes(phonemes));
        printSummary('Words', await generateWords(words));

        const stressPairs = buildStressPairList();
        console.log(`\nGenerating ${stressPairs.length} noun/verb stress-pair words...`);
        printSummary('Stress pairs', await generateStressPairs(stressPairs));
    } else if (mode === 'sentences') {
        const sentences = buildSentenceList();
        console.log(`Generating all ${sentences.length} homophone sentences...`);
        printSummary('Sentences', await generateSentences(sentences));
    } else {
        console.error(`Unknown mode "${mode}". Use spotcheck | phonemes | diphthongs | words | sentences | all`);
        process.exit(1);
    }
})();
