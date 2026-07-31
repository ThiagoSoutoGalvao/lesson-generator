// DET "Speak About the Photo" photo sourcing — one-off content script, not part of
// the app runtime (same pattern as fetch-wikimedia-phonemes.mjs for Pronunciation).
// Unsplash's top results skew toward moody/minimal single-subject shots; DET-style
// "describe the photo" prompts need the opposite — busy scenes with several things
// happening so there's enough to talk about for 30-45 seconds. Query phrasing below
// is chosen for that, not for aesthetics.
//
// Two-phase flow so every image gets a human look before it ships:
//   node scripts/fetch-det-photos.mjs candidates   -> searches Unsplash, downloads a
//       small preview of each candidate into a scratch review folder + writes a
//       candidates.json manifest with metadata + a stable key per candidate.
//   (review the previews, edit KEEP_KEYS below to the ones worth keeping)
//   node scripts/fetch-det-photos.mjs finalize     -> downloads full-res versions of
//       the kept candidates into public/images/det-photos/, pings Unsplash's
//       download_location endpoint per their API guidelines, and writes a manifest
//       of { key, path, photographer, unsplashLink } for wiring into speakAboutPhoto.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REVIEW_DIR = path.join(ROOT, 'storage/tmp/det-photo-review');
const FINAL_DIR = path.join(ROOT, 'public/images/det-photos');
const CANDIDATES_JSON = path.join(REVIEW_DIR, 'candidates.json');
const FINAL_MANIFEST = path.join(ROOT, 'storage/tmp/det-photo-review/final-manifest.json');

const KEY = process.env.UNSPLASH_ACCESS_KEY;
const UA = 'LessonGeneratorDETPhotos/1.0 (educational app; contact: t.soutogalvao@gmail.com)';

const QUERIES = [
    'family cooking kitchen together',
    'busy street market vendors',
    'office team meeting discussion',
    'children playing park playground',
    'friends picnic outdoors',
    'commuters train station platform',
    'family dinner table gathering',
    'students classroom group activity',
];

const PER_QUERY = 5;

// Fill this in after reviewing storage/tmp/det-photo-review/*.jpg, then re-run with "finalize".
const KEEP_KEYS = [
    'q0-0', 'q0-1', 'q0-2', 'q0-3', 'q0-4',
    'q1-1', 'q1-2', 'q1-4',
    'q2-0', 'q2-1', 'q2-3', 'q2-4',
    'q3-0', 'q3-1', 'q3-4',
    'q4-0', 'q4-2', 'q4-3', 'q4-4',
    'q5-1', 'q5-2',
    'q6-1', 'q6-2', 'q6-4',
    'q7-0', 'q7-2', 'q7-3',
];

async function searchQuery(query) {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(PER_QUERY));
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('content_filter', 'high');

    const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}`, 'User-Agent': UA } });
    if (!res.ok) throw new Error(`search failed for "${query}": HTTP ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.results ?? [];
}

async function downloadTo(url, destPath) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return buf.length;
}

async function pingDownload(downloadLocation) {
    // Unsplash API guideline: trigger this when a photo is actually used, for photographer stats/attribution.
    await fetch(`${downloadLocation}&client_id=${KEY}`, { headers: { 'User-Agent': UA } }).catch(() => {});
}

async function runCandidates() {
    if (!KEY) throw new Error('UNSPLASH_ACCESS_KEY not set in .env');
    fs.mkdirSync(REVIEW_DIR, { recursive: true });

    const manifest = [];

    for (let qi = 0; qi < QUERIES.length; qi++) {
        const query = QUERIES[qi];
        console.log(`Searching: "${query}"`);
        const results = await searchQuery(query);

        for (let ri = 0; ri < results.length; ri++) {
            const r = results[ri];
            const key = `q${qi}-${ri}`;
            const previewPath = path.join(REVIEW_DIR, `${key}.jpg`);
            try {
                await downloadTo(r.urls.small, previewPath);
                manifest.push({
                    key,
                    query,
                    id: r.id,
                    description: r.description || r.alt_description || '',
                    width: r.width,
                    height: r.height,
                    urls: { regular: r.urls.regular, full: r.urls.full },
                    downloadLocation: r.links.download_location,
                    photographer: r.user?.name || 'Unknown',
                    photographerLink: r.user?.links?.html || '',
                });
                console.log(`  saved ${key} <- "${r.description || r.alt_description || '(no description)'}"`);
            } catch (err) {
                console.error(`  FAILED ${key}: ${err.message}`);
            }
        }
        await new Promise(r => setTimeout(r, 300));
    }

    fs.writeFileSync(CANDIDATES_JSON, JSON.stringify(manifest, null, 2));
    console.log(`\n${manifest.length} candidates saved to ${REVIEW_DIR}`);
    console.log(`Manifest: ${CANDIDATES_JSON}`);
    console.log('Review the .jpg previews, then set KEEP_KEYS in this script and run "finalize".');
}

async function runFinalize() {
    if (!KEY) throw new Error('UNSPLASH_ACCESS_KEY not set in .env');
    if (!fs.existsSync(CANDIDATES_JSON)) throw new Error('No candidates.json found — run "candidates" first.');
    if (KEEP_KEYS.length === 0) throw new Error('KEEP_KEYS is empty — edit the script with the keys to keep.');

    const manifest = JSON.parse(fs.readFileSync(CANDIDATES_JSON, 'utf8'));
    fs.mkdirSync(FINAL_DIR, { recursive: true });

    const finalEntries = [];

    for (const key of KEEP_KEYS) {
        const entry = manifest.find(m => m.key === key);
        if (!entry) {
            console.error(`  SKIP ${key}: not found in candidates.json`);
            continue;
        }
        const destPath = path.join(FINAL_DIR, `${key}.jpg`);
        try {
            await downloadTo(entry.urls.regular, destPath);
            await pingDownload(entry.downloadLocation);
            finalEntries.push({
                key,
                path: `/images/det-photos/${key}.jpg`,
                description: entry.description,
                photographer: entry.photographer,
                photographerLink: entry.photographerLink,
            });
            console.log(`  finalized ${key} (${entry.photographer})`);
        } catch (err) {
            console.error(`  FAILED ${key}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 300));
    }

    fs.writeFileSync(FINAL_MANIFEST, JSON.stringify(finalEntries, null, 2));
    console.log(`\n${finalEntries.length} images finalized into ${FINAL_DIR}`);
    console.log(`Manifest: ${FINAL_MANIFEST}`);
}

const mode = process.argv[2];
if (mode === 'candidates') await runCandidates();
else if (mode === 'finalize') await runFinalize();
else console.log('Usage: node scripts/fetch-det-photos.mjs [candidates|finalize]');
