import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';

// Students page: a student's name and email must be fully readable next to the five row buttons, on a phone and on desktop.
const SP = 'C:/Users/thiag/Herd/lesson-generator/scratchpad/qa_2026-09';
const BASE = 'http://lesson-generator.test';
const php = (...a) => execFileSync('C:/Users/thiag/.config/herd/bin/php.bat', a, { encoding: 'utf8', shell: true }).trim();

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const errors = [];

const teacher = JSON.parse(php(`${SP}/qa_user.php`, 'create'));
const stamp = Date.now();
const NAME = 'Gabriel Souto Galvão Junior';
const EMAIL = `qa-level-row${stamp}.gabriel.souto@aurora.test`;
let browser;
try {
    browser = await chromium.launch();
    const page = await (await browser.newContext({ viewport: { width: 390, height: 900 } })).newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('pageerror ' + e.message));

    await page.goto(`${BASE}/login`);
    await page.fill('input[name=email]', teacher.email); await page.fill('input[name=password]', teacher.password);
    await Promise.all([page.waitForURL(x => !x.pathname.startsWith('/login')), page.click('button[type=submit]')]);
    await page.goto(`${BASE}/students`);
    await page.locator('input[placeholder="Full name"]').fill(NAME);
    await page.locator('input[placeholder="Email"]').fill(EMAIL);
    await page.locator('input[placeholder^="Password"]').fill('Lights-2026');
    await page.getByRole('button', { name: 'Create student' }).click();
    await page.getByText('is ready to log in').waitFor();

    for (const [label, w] of [['phone 390px', 390], ['small phone 320px', 320], ['desktop 1100px', 1100]]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.waitForTimeout(250);
        const nameEl = page.locator('p.font-display', { hasText: new RegExp(`^${NAME}$`) });   // the row title, not the hand-over card
        const emailEl = page.locator('p.text-xs', { hasText: EMAIL }).first();
        const truncated = async el => el.evaluate(n => n.scrollWidth > n.clientWidth + 1);
        const nb = await nameEl.boundingBox();
        check(`${label}: the full name is readable`, !(await truncated(nameEl)) && nb.width > 120, `width ${Math.round(nb.width)}px`);
        // the email is long on purpose (52 chars): it must wrap onto a second line, never end in "…"
        const eb = await emailEl.boundingBox();
        check(`${label}: the whole email is readable (wraps, never cut off)`, !(await truncated(emailEl)) && eb.width > 200 || (w < 340 && eb.width > 150 && !(await truncated(emailEl))), `width ${Math.round(eb.width)}px, height ${Math.round(eb.height)}px`);
        const row = page.locator('div.rounded-2xl', { has: nameEl }).first();
        for (const b of ['Progress & Homework', 'Deactivate', 'Reset password', 'Remove']) {
            const bb = await row.getByRole('button', { name: b, exact: true }).boundingBox();
            check(`${label}: "${b}" is on screen`, bb && bb.x >= 0 && bb.x + bb.width <= w + 1);
        }
        check(`${label}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        if (w === 390) await row.screenshot({ path: `${SP}/row_390.png` });
        if (w === 1100) await row.screenshot({ path: `${SP}/row_1100.png` });
    }
    check('zero console / page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
    check('script ran to the end', false, e.stack?.split('\n').slice(0, 3).join(' '));
} finally {
    if (browser) await browser.close();
    for (const e of [EMAIL, teacher.email]) console.log(php(`${SP}/qa_user.php`, 'cleanup', e));
}
const failed = results.filter(x => !x).length;
console.log(failed ? `\n${failed} of ${results.length} CHECKS FAILED` : `\nALL ${results.length} CHECKS PASSED`);
process.exit(failed ? 1 : 0);
