import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
// Light Presentation layout (2026-11-12): photo top-left, growing beside the examples. Mocked, no API calls.
const SP = 'C:/Users/thiag/Herd/lesson-generator/scratchpad/qa_2026-09';
const BASE = process.env.QA_BASE ?? 'http://lesson-generator.test';
const results = []; const errors = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`); };
const PRES = { type: 'presentation', topic: 'Talking about jobs', keyword: 'office', slides: [
  { title: 'Jobs with a / an', color: 'blue', rule: "We use **a** or **an** before a job: I'm **an** accountant.", form: 'I am / He is / She is + a / an + job',
    examples: ["I'm **an** accountant. — Ana", "Bruno is **a** sales manager.", "Carla is **a** marketing assistant.", "Diego is **an** IT engineer.", "I'm **an** engineer, not *I am engineer*."] },
  { title: 'Short slide', color: 'blue', rule: 'Only two examples here.', examples: ['One.', 'Two.'] } ] };
const browser = await chromium.launch();
try {
  for (const [name, vp] of [['desktop', { width: 1366, height: 768 }], ['phone', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp }); const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    p.on('pageerror', e => errors.push('pageerror ' + e.message));
    await p.route('**/api/presentation/generate', r => r.fulfill({ json: PRES }));
    await p.route('**/api/background*', r => r.fulfill({ json: { url: '/backgrounds/pronunciation.jpg' } }));
    await p.goto(`${BASE}/login`);
    await p.fill('input[name=email]', 'aurora@aurora.test'); await p.fill('input[name=password]', 'aurora-local-dev');
    await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
    await p.evaluate(() => localStorage.setItem('aurora.lessonSession', JSON.stringify({ trilha: 'FirstSteps', lesson: 1, part: 'A', stage: 'presentation' })));
    await p.goto(`${BASE}/upload`, { waitUntil: 'networkidle' });
    await p.locator('input[type=text]').first().fill('jobs');
    await p.getByRole('button', { name: /Generate Presentation/ }).click();
    await p.getByText('Diego is').first().waitFor(); await p.waitForTimeout(900);
    const photo = p.locator('[data-ui-screen=light] img[src*="pronunciation"]');
    const pb = await photo.boundingBox(); const h1 = await p.locator('h1', { hasText: 'Jobs with a / an' }).boundingBox();
    const ex = await p.getByText('Examples', { exact: true }).boundingBox();
    if (name === 'desktop') {
      check('desktop: photo on the left of the examples', pb.x + pb.width <= ex.x + 1, `photo right ${Math.round(pb.x + pb.width)} examples x ${Math.round(ex.x)}`);
      check('desktop: photo top level with the examples', Math.abs(pb.y - ex.y) < 30, `${Math.round(pb.y)} vs ${Math.round(ex.y)}`);
      check('desktop: title above both columns', h1.y + h1.height <= pb.y);
      const cols = await p.evaluate(() => { const c = [...document.querySelectorAll('.slide-content > div > div')]; return c.map(e => Math.round(e.getBoundingClientRect().bottom)); });
      check('desktop: both columns end at the same height', Math.abs(cols[0] - cols[1]) < 4, cols.join(' / '));
    } else {
      check('phone: photo under the title, above the examples', h1.y < pb.y && pb.y < ex.y);
      const sw = await p.evaluate(() => document.querySelector('[data-ui-screen=light] main').scrollWidth <= window.innerWidth);
      check('phone: no sideways scroll', sw);
    }
    await p.screenshot({ path: `${SP}/shots-light/pres-${name}-1.png` });
    await p.getByRole('button', { name: 'Next slide' }).click(); await p.waitForTimeout(900);
    await p.screenshot({ path: `${SP}/shots-light/pres-${name}-2.png` });
    await ctx.close();
  }
} finally { await browser.close(); }
check('no console / page errors', errors.length === 0, errors.join(' | '));
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
