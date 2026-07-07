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
//   (add --force to regenerate files that already exist)

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
    return [...words.keys()];
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
    } else if (mode === 'all') {
        const phonemes = buildPhonemeList();
        const words = buildWordList();
        console.log(`Generating ${phonemes.length} phonemes + ${words.length} words...`);
        printSummary('Phonemes', await generatePhonemes(phonemes));
        printSummary('Words', await generateWords(words));
    } else {
        console.error(`Unknown mode "${mode}". Use spotcheck | phonemes | diphthongs | words | all`);
        process.exit(1);
    }
})();
