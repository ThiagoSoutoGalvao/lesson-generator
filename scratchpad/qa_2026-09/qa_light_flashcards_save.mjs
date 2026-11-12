import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
// 2026-11-12: light Flashcards + light Save panel, and the bug Thiago hit — with a changed text size (Aa), the shell's
// text-scaling rule reached fullscreen activities and the light theme's indigo --tf-color made dark screens and their
// Save panel dark-on-dark. Runs with text size raised. /api/generate mocked.
const SP = 'C:/Users/thiag/Herd/lesson-generator/scratchpad/qa_2026-09';
const BASE = process.env.QA_BASE ?? 'http://lesson-generator.test';
const results = []; const errors = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`); };
const FC = { type: 'flashcards', topic: 'Office jobs', cards: [
    { word: 'accountant', definition: 'a person who works with money and numbers', example: 'Ana is an accountant in Finance.' },
    { word: 'receptionist', definition: 'a person who meets visitors at the front desk', example: 'The receptionist says hello.' },
    { word: 'engineer', definition: 'a person who builds or fixes machines and systems', example: 'Diego is an IT engineer.' }] };
const INK = 'rgb(39, 29, 98)';
async function open(browser, trilha, vp = { width: 1366, height: 768 }) {
    const ctx = await browser.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    p.on('pageerror', e => errors.push('pageerror ' + e.message));
    await p.route('**/api/generate', r => r.fulfill({ json: FC }));
    await p.goto(`${BASE}/login`);
    await p.fill('input[name=email]', 'aurora@aurora.test'); await p.fill('input[name=password]', 'aurora-local-dev');
    await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
    await p.evaluate(t => {
        localStorage.setItem('aurora.lessonSession', JSON.stringify({ trilha: t, lesson: 1, part: 'B', stage: 'practice' }));
        localStorage.setItem('aurora.display', JSON.stringify({ sizeIdx: 3, textColor: 'text-white', brightness: 100, font: 'default' }));
    }, trilha);
    await p.goto(`${BASE}/generate`, { waitUntil: 'networkidle' });
    return { ctx, p };
}
async function generate(p) {
    await p.getByRole('button', { name: /Vocabulary/ }).first().click();
    await p.getByRole('button', { name: /Flashcards/ }).first().click();
    await p.locator('input[type=text]').first().fill('jobs');
    await p.getByRole('button', { name: 'Generate', exact: true }).click();
    await p.getByText('accountant').first().waitFor();
    await p.waitForTimeout(400);
}
const color = (loc) => loc.first().evaluate(e => getComputedStyle(e).color);
const flip = async (p) => { await p.keyboard.press('Space'); await p.waitForTimeout(650); };
const browser = await chromium.launch();
try {
    // ── First Steps, laptop
    let { ctx, p } = await open(browser, 'FirstSteps');
    const shellP = await p.locator('main p').first().evaluate(e => getComputedStyle(e).fontSize);
    check('Generate page: the text size setting still applies to the page', !['12px', '14px'].includes(shellP), shellP);
    await generate(p);
    check('Flashcards: light screen', await p.locator('[data-ui-screen=light]').count() > 0);
    check('Flashcards: word in indigo on white', await color(p.locator('h2', { hasText: 'accountant' })) === INK);
    check('Flashcards: header line readable', await color(p.getByText(/card 1 of 3/i)) === 'rgb(74, 81, 99)');
    await p.screenshot({ path: `${SP}/shots-light/fc-front.png` });
    await flip(p);
    const got = await p.getByRole('button', { name: /Got it/ }).boundingBox();
    check('Flashcards: Got it visible without scrolling on a laptop', got && got.y + got.height <= 768, got && `${Math.round(got.y + got.height)}`);
    await p.screenshot({ path: `${SP}/shots-light/fc-back.png` });
    await p.getByRole('button', { name: /Still learning/ }).click(); await p.waitForTimeout(300);
    for (let i = 0; i < 2; i++) { await flip(p); await p.getByRole('button', { name: /Got it/ }).click(); await p.waitForTimeout(300); }
    check('Flashcards: a "still learning" card comes back', await p.getByText(/card 1 of 1 \(again\)/i).isVisible());
    await flip(p); await p.getByRole('button', { name: /Got it/ }).click();
    await p.getByText('All done!').waitFor();
    check('Flashcards: light end screen', await p.getByText('All 3 cards learned').isVisible());
    await p.getByRole('button', { name: 'Start over' }).click(); await p.waitForTimeout(300);
    await p.getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(400);
    const form = p.locator('form').filter({ hasText: 'Built by' });
    check('Save panel: white on a First Steps screen', await form.evaluate(e => getComputedStyle(e).backgroundColor) === 'rgb(255, 255, 255)');
    check('Save panel: labels readable (dark on white)', await color(form.getByText('Built by')) === 'rgb(74, 81, 99)');
    check('Save panel: "Saves as" name readable', await color(form.getByText(/FIRST STEPS L01B/)) === INK);
    check('Save panel: chosen part is coral', await form.getByRole('button', { name: '1B' }).evaluate(e => getComputedStyle(e).backgroundColor) === 'rgb(224, 82, 31)');
    const optBg = await form.locator('option').first().evaluate(e => getComputedStyle(e).backgroundColor);
    check('Save panel: dropdown options white (readable)', optBg === 'rgb(255, 255, 255)', optBg);
    await p.screenshot({ path: `${SP}/shots-light/fc-save.png` });
    await ctx.close();
    // ── First Steps, phone
    ({ ctx, p } = await open(browser, 'FirstSteps', { width: 390, height: 844 }));
    await generate(p);
    check('phone: no sideways scroll', await p.evaluate(() => document.querySelector('[data-ui-screen=light] main').scrollWidth <= window.innerWidth));
    await p.screenshot({ path: `${SP}/shots-light/fc-phone.png` });
    await ctx.close();
    // ── Radiant (dark screens) with the same big text size: text must stay light
    ({ ctx, p } = await open(browser, 'Radiant'));
    await generate(p);
    check('Radiant: dark Flashcards kept', await p.locator('[data-ui-screen=light]').count() === 0);
    check('Radiant: header text light, not dark', await color(p.getByText(/Card 1 \/ 3/)) !== INK);
    await p.getByRole('button', { name: 'Save', exact: true }).click(); await p.waitForTimeout(400);
    const dform = p.locator('form').filter({ hasText: 'Built by' });
    const lab = await color(dform.getByText('Built by'));
    check('Radiant: Save panel labels light on dark', lab.startsWith('rgba(255, 255, 255') || lab === 'rgb(255, 255, 255)' || /^oklab\(0\.9\d/.test(lab), lab);
    await ctx.close();
} finally { await browser.close(); }
check('no console / page errors', errors.length === 0, errors.join(' | '));
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
