// One-off background image search for the Upload/Generate/Library shell pages —
// same candidates/finalize pattern as fetch-pronunciation-bg.mjs / fetch-det-photos.mjs.
// Replaces Phase P's pic4.jpg with something in the same warm-education mood as
// Pronunciation's notebook photo, but not the same image/subject.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REVIEW_DIR = path.join(ROOT, 'storage/tmp/shell-bg-review');
const FINAL_DIR = path.join(ROOT, 'public/backgrounds');
const CANDIDATES_JSON = path.join(REVIEW_DIR, 'candidates.json');

const KEY = process.env.UNSPLASH_ACCESS_KEY;
const UA = 'LessonGeneratorShellBg/1.0 (educational app; contact: t.soutogalvao@gmail.com)';

const QUERIES = [
    'stack of old books warm sunlight',
    'cozy reading nook bookshelf warm light',
    'vintage typewriter desk warm light',
    'chalkboard classroom warm light empty',
];

const PER_QUERY = 5;

const KEEP_KEY = process.argv[3]; // e.g. "q0-1"

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
                    key, query, id: r.id,
                    description: r.description || r.alt_description || '',
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
}

async function runFinalize() {
    if (!KEY) throw new Error('UNSPLASH_ACCESS_KEY not set in .env');
    if (!fs.existsSync(CANDIDATES_JSON)) throw new Error('No candidates.json found — run "candidates" first.');
    if (!KEEP_KEY) throw new Error('Pass the key to keep: node scripts/fetch-shell-bg.mjs finalize q0-1');

    const manifest = JSON.parse(fs.readFileSync(CANDIDATES_JSON, 'utf8'));
    const entry = manifest.find(m => m.key === KEEP_KEY);
    if (!entry) throw new Error(`Key ${KEEP_KEY} not found in candidates.json`);

    fs.mkdirSync(FINAL_DIR, { recursive: true });
    const destPath = path.join(FINAL_DIR, 'shell.jpg');
    await downloadTo(entry.urls.regular, destPath);
    await pingDownload(entry.downloadLocation);
    console.log(`Finalized ${KEEP_KEY} (${entry.photographer}) -> ${destPath}`);
}

const mode = process.argv[2];
if (mode === 'candidates') await runCandidates();
else if (mode === 'finalize') await runFinalize();
else console.log('Usage: node scripts/fetch-shell-bg.mjs [candidates|finalize <key>]');
