import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
// 2026-11-13: on a First Steps lesson /generate sends group: true and pre-fills the Student A / B role-play
// instructions; on Radiant neither changes. /api/generate mocked (the request body is what is checked).
const BASE = process.env.QA_BASE ?? 'http://lesson-generator.test';
const results = []; const errors = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`); };
const RP = { type: 'role_play', topic: 'First day', level: 'A2', targets: ['Nice to meet you'], cards: [
    { situation: 'Monday.', role_a: { name: 'New', brief: 'You start.' }, role_b: { name: 'Manager', brief: 'You welcome.' } }] };
const browser = await chromium.launch();
try {
    for (const trilha of ['FirstSteps', 'Radiant']) {
        const p = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
        p.on('pageerror', e => errors.push('pageerror ' + e.message));
        let sent = null;
        await p.route('**/api/generate', r => { sent = r.request().postDataJSON(); r.fulfill({ json: RP }); });
        await p.goto(`${BASE}/login`);
        await p.fill('input[name=email]', 'aurora@aurora.test'); await p.fill('input[name=password]', 'aurora-local-dev');
        await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
        await p.evaluate(t => localStorage.setItem('aurora.lessonSession', JSON.stringify({ trilha: t, lesson: 1, part: 'C', stage: 'production' })), trilha);
        await p.goto(`${BASE}/generate`, { waitUntil: 'networkidle' });
        await p.getByRole('button', { name: /Speaking/ }).first().click();
        await p.getByRole('button', { name: /Role-play Cards/ }).click();
        const instr = await p.locator('textarea').first().inputValue();
        await p.locator('input[type=text]').first().fill('first day at work');
        await p.getByRole('button', { name: 'Generate', exact: true }).click();
        await p.getByText('THE SITUATION').waitFor();
        if (trilha === 'FirstSteps') {
            check('First Steps: Instructions talk about Student A / B', instr.includes('Student A') && !instr.includes('role for the teacher'), instr);
            check('First Steps: request has group: true', sent?.group === true, JSON.stringify(sent));
        } else {
            check('Radiant: Instructions unchanged (student + teacher)', instr.includes('a role for the teacher'));
            check('Radiant: no group flag', !('group' in (sent ?? {})), JSON.stringify(sent));
        }
        await p.context().close();
    }
} finally { await browser.close(); }
check('no page errors', errors.length === 0, errors.join(' | '));
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
