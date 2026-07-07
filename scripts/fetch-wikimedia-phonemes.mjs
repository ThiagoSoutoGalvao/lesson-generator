// Phase 2 (Pronunciation feature): fetches consonant + monophthong phoneme
// audio from Wikimedia Commons (stable, freely-licensed IPA reference
// recordings used on Wikipedia's own IPA chart pages) and transcodes them
// from .ogg to .mp3 (Safari/iOS has no native Ogg Vorbis support) using the
// ffmpeg binary from the `ffmpeg-static` package.
//
// Diphthongs are NOT covered here — Wikimedia only has cardinal monophthong
// recordings, not English glides. Those + all word audio go through
// generate-pronunciation-audio.mjs (OpenAI TTS) instead.
//
// Usage: node scripts/fetch-wikimedia-phonemes.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/audio/pronunciation/phonemes');
const TMP_DIR = path.join(ROOT, 'storage/tmp/wikimedia-ogg');

const UA = 'LessonGeneratorPronunciationFeature/1.0 (educational app; contact: t.soutogalvao@gmail.com)';

// symbol -> Wikimedia Commons filename (verified via Special:FilePath, see conversation)
const CONSONANTS = {
    'p': 'Voiceless bilabial plosive.ogg',
    'b': 'Voiced bilabial plosive.ogg',
    't': 'Voiceless alveolar plosive.ogg',
    'd': 'Voiced alveolar plosive.ogg',
    'k': 'Voiceless velar plosive.ogg',
    'g': 'Voiced velar plosive 02.ogg',
    'f': 'Voiceless labio-dental fricative.ogg',
    'v': 'Voiced labio-dental fricative.ogg',
    'θ': 'Voiceless dental fricative.ogg',
    'ð': 'Voiced dental fricative.ogg',
    's': 'Voiceless alveolar sibilant.ogg',
    'z': 'Voiced alveolar sibilant.ogg',
    'ʃ': 'Voiceless palato-alveolar sibilant.ogg',
    'ʒ': 'Voiced palato-alveolar sibilant.ogg',
    'tʃ': 'Voiceless palato-alveolar affricate.ogg',
    'dʒ': 'Voiced palato-alveolar affricate.ogg',
    'm': 'Bilabial nasal.ogg',
    'n': 'Alveolar nasal.ogg',
    'ŋ': 'Velar nasal.ogg',
    'h': 'Voiceless glottal fricative.ogg',
    'l': 'Alveolar lateral approximant.ogg',
    'r': 'Alveolar approximant.ogg',
    'w': 'Voiced labio-velar approximant.ogg',
    'j': 'Palatal approximant.ogg',
};

// our symbol (with RP length marks) -> Wikimedia cardinal-vowel filename
// (cardinal recordings encode quality only, not length)
const MONOPHTHONGS = {
    'iː': 'Close front unrounded vowel.ogg',
    'ɪ': 'Near-close near-front unrounded vowel.ogg',
    'ʊ': 'Near-close near-back rounded vowel.ogg',
    'uː': 'Close back rounded vowel.ogg',
    'e': 'Close-mid front unrounded vowel.ogg',
    'ə': 'Mid-central vowel.ogg',
    'ɜː': 'Open-mid central unrounded vowel.ogg',
    'ɔː': 'PR-open-mid back rounded vowel.ogg',
    'æ': 'Near-open front unrounded vowel.ogg',
    'ʌ': 'PR-open-mid back unrounded vowel2.ogg',
    'ɑː': 'Open back unrounded vowel.ogg',
    'ɒ': 'PR-open back rounded vowel.ogg',
};

const ALL = { ...CONSONANTS, ...MONOPHTHONGS };

async function downloadOgg(filename, destPath) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${filename}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return buf.length;
}

function transcodeToMp3(oggPath, mp3Path) {
    execFileSync(ffmpegPath, ['-y', '-i', oggPath, '-codec:a', 'libmp3lame', '-qscale:a', '4', mp3Path], { stdio: 'pipe' });
}

async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.mkdirSync(TMP_DIR, { recursive: true });

    const entries = Object.entries(ALL);
    let ok = 0, failed = [];

    for (const [symbol, filename] of entries) {
        const oggPath = path.join(TMP_DIR, `${symbol}.ogg`);
        const mp3Path = path.join(OUT_DIR, `${symbol}.mp3`);
        try {
            const bytes = await downloadOgg(filename, oggPath);
            transcodeToMp3(oggPath, mp3Path);
            const mp3Size = fs.statSync(mp3Path).size;
            console.log(`  ${symbol} <- "${filename}" (${bytes}B ogg -> ${mp3Size}B mp3)`);
            ok++;
        } catch (err) {
            console.error(`  FAILED ${symbol} <- "${filename}": ${err.message}`);
            failed.push(symbol);
        }
        await new Promise(r => setTimeout(r, 1200)); // be polite to Wikimedia
    }

    console.log(`\n${ok}/${entries.length} phoneme files fetched + transcoded.`);
    if (failed.length) console.log('Failed:', failed.join(', '));
}

main();
