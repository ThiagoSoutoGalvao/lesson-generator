import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
// Light Unjumble (2026-11-12): split screen (photo left, task right), tap to build, Check / Try again / Reveal, real
// scoring (a reveal scores nothing), light end screen; Radiant keeps the dark screen. /api/generate mocked.
const SP = 'C:/Users/thiag/Herd/lesson-generator/scratchpad/qa_2026-09';
const BASE = process.env.QA_BASE ?? 'http://lesson-generator.test';
const results = []; const errors = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`); };
const S = (sentence) => ({ sentence, words: sentence.split(' '), keyword: 'office' });
const UJ = { type: 'unjumble', topic: 'Interview questions', sentences: [S('What do you do?'), S('Where do you work?'), S('Which department are you in?')] };
async function open(browser, trilha, vp) {
    const ctx = await browser.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    p.on('pageerror', e => errors.push('pageerror ' + e.message));
    await p.route('**/api/generate', r => r.fulfill({ json: UJ }));
    await p.goto(`${BASE}/login`);
    await p.fill('input[name=email]', 'aurora@aurora.test'); await p.fill('input[name=password]', 'aurora-local-dev');
    await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
    await p.evaluate(t => localStorage.setItem('aurora.lessonSession', JSON.stringify({ trilha: t, lesson: 1, part: 'B', stage: 'practice' })), trilha);
    await p.goto(`${BASE}/generate`, { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: /Grammar/ }).first().click();
    await p.getByRole('button', { name: /Unjumble/ }).first().click();
    await p.locator('input[type=text]').first().fill('questions');
    await p.getByRole('button', { name: 'Generate', exact: true }).click();
    await p.getByText(/sentence 1 of 3|Sentence 1 \/ 3/).first().waitFor();
    return { ctx, p };
}
const bank = p => p.locator('[aria-label="Word bank"]');
async function build(p, words) { for (const w of words) await bank(p).getByRole('button', { name: w, exact: true }).first().click(); }
const browser = await chromium.launch();
try {
    let { ctx, p } = await open(browser, 'FirstSteps', { width: 1366, height: 768 });
    check('light screen', await p.locator('[data-ui-screen=light]').count() > 0);
    const ph = await p.locator('[data-ui-screen=light] main > div > div').first().boundingBox();
    const ans = await p.locator('[aria-label="Your sentence"]').boundingBox();
    check('photo left, task right', ph.x + ph.width <= ans.x, `${Math.round(ph.x + ph.width)} / ${Math.round(ans.x)}`);
    await p.screenshot({ path: `${SP}/shots-light/uj-1.png` });
    await build(p, ['What', 'do', 'you', 'do?']);
    await p.getByRole('button', { name: 'Check' }).click();
    check('right order → Correct', await p.getByText('✓ Correct!').isVisible());
    const nb = await p.getByRole('button', { name: 'Next sentence' }).boundingBox();
    check('laptop: Next visible without scrolling', nb.y + nb.height <= 768, `${Math.round(nb.y + nb.height)}`);
    await p.screenshot({ path: `${SP}/shots-light/uj-2-correct.png` });
    await p.getByRole('button', { name: 'Next sentence' }).click();
    // sentence 2: wrong order, then reveal (no point)
    await build(p, ['you', 'Where', 'do', 'work?']);
    await p.getByRole('button', { name: 'Check' }).click();
    check('wrong order → Not quite', await p.getByText(/Not quite/).isVisible());
    await p.waitForTimeout(400);
    check('wrong order → the words turn red', await p.locator('[aria-label="Your sentence"] button').first().evaluate(e => getComputedStyle(e).borderColor) === 'rgb(180, 35, 24)');
    await p.screenshot({ path: `${SP}/shots-light/uj-3-wrong.png` });
    await p.getByRole('button', { name: 'Reveal', exact: true }).click();
    check('reveal shows the sentence', await p.getByText('Here is the right sentence').isVisible());
    await p.keyboard.press('Space');
    // sentence 3: tap a placed word to send it back, then right
    await build(p, ['department', 'Which']);
    await p.locator('[aria-label="Your sentence"]').getByRole('button', { name: 'department' }).click();
    check('tapping a placed word sends it back', await bank(p).getByRole('button', { name: 'department' }).count() === 1);
    await build(p, ['department', 'are', 'you', 'in?']);
    await p.getByRole('button', { name: 'Check' }).click();
    await p.getByRole('button', { name: 'See results' }).click();
    check('score is real: 2 of 3 (the reveal scored nothing)', await p.getByText('2 of 3 correct').isVisible());
    await p.screenshot({ path: `${SP}/shots-light/uj-4-end.png` });
    await ctx.close();

    ({ ctx, p } = await open(browser, 'FirstSteps', { width: 390, height: 844 }));
    check('phone: no sideways scroll', await p.evaluate(() => document.querySelector('[data-ui-screen=light] main').scrollWidth <= window.innerWidth));
    await build(p, ['What', 'do']);
    await p.screenshot({ path: `${SP}/shots-light/uj-phone.png` });
    await ctx.close();

    ({ ctx, p } = await open(browser, 'Radiant', { width: 1366, height: 768 }));
    check('Radiant: old dark screen kept', await p.locator('[data-ui-screen=light]').count() === 0);
    await ctx.close();
} finally { await browser.close(); }
check('no console / page errors', errors.length === 0, errors.join(' | '));
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
