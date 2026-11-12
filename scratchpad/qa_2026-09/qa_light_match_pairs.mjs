import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
// Light Match Pairs (2026-11-12): every pair visible without scrolling on a laptop, real gap between columns,
// scoring still real (a wrong try costs that pair), numbered pairs, light end screen. /api/generate mocked.
const SP = 'C:/Users/thiag/Herd/lesson-generator/scratchpad/qa_2026-09';
const BASE = process.env.QA_BASE ?? 'http://lesson-generator.test';
const results = []; const errors = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`); };
const PAIRS = [['accountant', 'works with money and numbers in Finance'], ['sales manager', 'leads the team that sells the products'], ['marketing assistant', 'helps with adverts and social media'],
  ['IT engineer', 'looks after the computers and the network'], ['receptionist', 'meets visitors at the front desk'], ['HR manager', 'hires new people and looks after the staff'],
  ['designer', 'makes the pictures and the look of a product'], ['lawyer', 'checks the contracts']].map(([left, right]) => ({ left, right }));
const MP = { type: 'match_pairs', topic: 'Jobs and what they do', pairs: PAIRS };
const browser = await chromium.launch();
try {
  for (const [name, vp] of [['laptop', { width: 1366, height: 768 }], ['phone', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    p.on('pageerror', e => errors.push('pageerror ' + e.message));
    await p.route('**/api/generate', r => r.fulfill({ json: MP }));
    await p.goto(`${BASE}/login`);
    await p.fill('input[name=email]', 'aurora@aurora.test'); await p.fill('input[name=password]', 'aurora-local-dev');
    await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
    await p.evaluate(() => localStorage.setItem('aurora.lessonSession', JSON.stringify({ trilha: 'FirstSteps', lesson: 1, part: 'B', stage: 'practice' })));
    await p.goto(`${BASE}/generate`, { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: /Vocabulary/ }).first().click();
    await p.getByRole('button', { name: /Match Pairs/ }).click();
    await p.locator('input[type=text]').first().fill('jobs');
    await p.getByRole('button', { name: 'Generate', exact: true }).click();
    await p.getByRole('button', { name: 'lawyer' }).waitFor();
    check(`${name}: light screen`, await p.locator('[data-ui-screen=light]').count() > 0);
    const tiles = p.locator('[data-ui-screen=light] main button[aria-pressed]');
    check(`${name}: 16 tiles`, await tiles.count() === 16);
    const boxes = await tiles.evaluateAll(els => els.map(e => e.getBoundingClientRect()).map(r => ({ x: r.x, b: r.bottom, w: r.width, h: r.height })));
    if (name === 'laptop') {
      const maxB = Math.max(...boxes.map(b => b.b));
      check('laptop: every tile visible without scrolling', maxB <= 768, `lowest tile bottom ${Math.round(maxB)}`);
      const leftR = Math.max(...boxes.slice(0, 8).map(b => b.x + b.w)), rightL = Math.min(...boxes.slice(8).map(b => b.x));
      check('laptop: clear gap between the columns', rightL - leftR >= 40, `${Math.round(rightL - leftR)}px`);
      check('laptop: meanings column wider than words', boxes[8].w > boxes[0].w);
    } else {
      const sw = await p.evaluate(() => document.querySelector('[data-ui-screen=light] main').scrollWidth <= window.innerWidth);
      check('phone: no sideways scroll', sw);
      check('phone: tiles at least 48px tall (easy to tap)', Math.min(...boxes.map(b => b.h)) >= 48);
    }
    await p.screenshot({ path: `${SP}/shots-light/mp-${name}-1.png` });
    // wrong try on accountant, then all right
    await p.getByRole('button', { name: 'accountant', exact: true }).click();
    await p.getByRole('button', { name: /checks the contracts/ }).click();
    await p.waitForTimeout(800);
    for (const pr of PAIRS) {
      await p.getByRole('button', { name: pr.left, exact: true }).click();
      await p.getByRole('button', { name: new RegExp(pr.right) }).click();
      if (pr.left === 'sales manager') { await p.screenshot({ path: `${SP}/shots-light/mp-${name}-2.png` }); }
    }
    await p.getByText('All matched!').waitFor();
    check(`${name}: score counts the wrong try`, await p.getByText('7 of 8 matched first time').isVisible());
    await p.screenshot({ path: `${SP}/shots-light/mp-${name}-3.png`, fullPage: true });
    await ctx.close();
  }
  // a Radiant lesson keeps the old screen
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
  await p.route('**/api/generate', r => r.fulfill({ json: MP }));
  await p.goto(`${BASE}/login`);
  await p.fill('input[name=email]', 'aurora@aurora.test'); await p.fill('input[name=password]', 'aurora-local-dev');
  await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
  await p.evaluate(() => localStorage.setItem('aurora.lessonSession', JSON.stringify({ trilha: 'Radiant', lesson: 1, part: 'A' })));
  await p.goto(`${BASE}/generate`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Vocabulary/ }).first().click();
  await p.getByRole('button', { name: /Match Pairs/ }).click();
  await p.locator('input[type=text]').first().fill('jobs');
  await p.getByRole('button', { name: 'Generate', exact: true }).click();
  await p.getByRole('button', { name: 'lawyer' }).waitFor();
  check('Radiant: old dark screen unchanged', await p.locator('[data-ui-screen=light]').count() === 0);
  await ctx.close();
} finally { await browser.close(); }
check('no console / page errors', errors.length === 0, errors.join(' | '));
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
