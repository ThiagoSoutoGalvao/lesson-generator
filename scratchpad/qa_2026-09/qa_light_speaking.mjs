import { chromium } from 'file:///C:/Users/thiag/Herd/lesson-generator/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';

// Aurora Business light theme, step 2 (AuroraBusiness.md): the six speaking templates — Role-play, Story builder,
// Debate, Mini presentation (all on SpeakingActivityShell), Discussion questions, Picture prompts — and the
// "Use it!" checklist, light on a First Steps pack and still dark on Radiant. Ticks are saved to a student to prove
// the checklist still works. Screenshots → shots-light/. Temporary qa-useit-* users only.
const SP = 'C:/Users/thiag/Herd/lesson-generator/scratchpad/qa_2026-09';
const SHOTS = `${SP}/shots-light`;
const BASE = process.env.QA_BASE ?? 'http://lesson-generator.test';
const php = (...a) => execFileSync('C:/Users/thiag/.config/herd/bin/php.bat', a, { encoding: 'utf8', shell: true }).trim();

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const errors = [];
const T = ["I'm a / an + job", 'I work in the … department', 'What do you do?', 'Nice to meet you'];
const ROLE = { type: 'role_play', topic: 'First day at work', level: 'A2', targets: T, cards: [
    { situation: "It's Monday morning. You are new at the company.", role_a: { name: 'The new employee', brief: 'Say who you are, your job and your department.' }, role_b: { name: 'The team manager', brief: 'Welcome the new person and introduce the team.' }, role_c: { name: 'A colleague', brief: 'Come in, say hello and ask one question.' } },
    { situation: 'At the coffee machine.', role_a: { name: 'New colleague', brief: 'Ask two questions.' }, role_b: { name: 'Old hand', brief: 'Answer and ask back.' } },
] };
const STORY = { type: 'story_builder', topic: 'My first job', level: 'A2', targets: T, stories: [{ title: 'My first day', prompts: ['I arrived at…', 'My manager was…', 'I met…', 'In the end…'] }] };
const DEBATE = { type: 'debate', topic: 'Work', level: 'A2', targets: T, statements: [{ statement: 'Working from home is better than the office.', for: ['No travel time'], against: ['You feel alone'] }] };
const PRES = { type: 'mini_presentation', topic: 'My job', level: 'A2', minutes: 2, targets: T, topics: [{ title: 'My job and my company', steps: [{ name: 'Hello', hint: 'your name' }, { name: 'My job', hint: 'what you do' }, { name: 'My company', hint: 'what it does' }] }] };
const DISC = { type: 'discussion_questions', topic: 'Jobs', keyword: 'office', targets: T, questions: [{ question: 'What do you do?', follow_ups: ['Do you like it?', 'Where do you work?'] }, { question: 'What was your first job?', follow_ups: [] }] };
const PICS = { type: 'picture_prompts', topic: 'At the office', level: 'A2', targets: T, prompts: [{ keyword: 'office', question: 'What are the people doing?', starters: ['They are…'] }] };
const ACTS = [
    ['Role-play', 'Meet the team', ROLE, 'The new employee'],
    ['Story', 'My first day story', STORY, 'My first day'],
    ['Debate', 'Home or office', DEBATE, 'Working from home is better than the office.'],
    ['Mini', 'Present my job', PRES, 'My job and my company'],
    ['Discussion', 'Talk about jobs', DISC, 'What do you do?'],
    ['Pictures', 'Office pictures', PICS, 'What are the people doing?'],
];

const qa = JSON.parse(php(`${SP}/qa_speaking_users.php`, 'create', 'FirstSteps'));
let browser;
try {
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', e => errors.push('pageerror ' + e.message));
    await page.route('**/api/background**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: '/images/det-photos/q1-1.jpg' }) }));

    await page.goto(`${BASE}/login`);
    await page.fill('input[name=email]', qa.teacher.email); await page.fill('input[name=password]', qa.password);
    await Promise.all([page.waitForURL(x => !x.pathname.startsWith('/login')), page.click('button[type=submit]')]);
    await page.evaluate(() => { localStorage.removeItem('aurora.lessonSession'); sessionStorage.removeItem('aurora.liveStudent'); });
    const api = (method, url, body) => page.evaluate(async ([m, u, b]) => {
        try { const r = await window.axios({ method: m, url: u, data: b }); return { status: r.status, data: r.data }; }
        catch (e) { return { status: e.response?.status, data: e.response?.data }; }
    }, [method, url, body]);
    const seen = async (loc, timeout = 5000) => { try { await loc.first().waitFor({ timeout }); return true; } catch { return false; } };

    const ids = {};
    for (const [, focus, content] of ACTS) {
        ids[focus] = (await api('post', '/api/activities', { name: `FIRST STEPS L01C · X · ${focus}`, type: content.type, content, trilha: 'FirstSteps', trilha_lesson: 1, trilha_part: 'C', stage: 'production' })).data?.id;
    }
    await api('post', '/api/activities', { name: 'RADIANT L01 · Role-play · Dark one', type: 'role_play', content: ROLE, trilha: 'Radiant', trilha_lesson: 1, stage: 'production' });

    const card = focus => page.locator('[data-testid=pack-activity]').filter({ has: page.getByText(focus, { exact: true }) });
    const openPack = async () => { await page.goto(`${BASE}/lessons/firststeps/1?part=C`); await seen(card(ACTS[0][1])); };
    const closeActivity = () => page.locator('[data-ui-screen=light] header').getByRole('button', { name: 'Close' }).click();

    let n = 8;
    for (const [label, focus, content, marker] of ACTS) {
        await openPack();
        await card(focus).getByRole('button', { name: 'Launch' }).click();
        check(`${label}: light layout`, await seen(page.locator('[data-ui-screen=light]')));
        check(`${label}: content shown`, await seen(page.getByText(marker, { exact: true })));
        const bg = await page.getByText(marker, { exact: true }).first().evaluate(el => {
            let e = el; while (e && getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)') e = e.parentElement; return e ? getComputedStyle(e).backgroundColor : 'none';
        });
        check(`${label}: text sits on white or light grey`, ['rgb(255, 255, 255)', 'rgb(246, 247, 249)', 'rgb(253, 238, 231)'].includes(bg), bg);
        // Use it! — tick one target
        await page.getByRole('button', { name: T[2], exact: true }).click();
        check(`${label}: Use it! counts the tick`, (await page.getByTestId('useit-count').innerText()).trim() === `1 / ${T.length}`);
        await page.waitForTimeout(350);
        await page.screenshot({ path: `${SHOTS}/s${n++}-${label.toLowerCase()}.png` });

        if (label === 'Role-play') {
            await page.getByLabel('Who’s this with?').selectOption(String(qa.student.id));
            await page.getByRole('button', { name: `Save to ${qa.student.name}’s progress` }).click();
            check('Role-play: ticks saved to the student', await seen(page.getByRole('status').filter({ hasText: 'Saved — 1 of 4 used.' })));
            // Group mode (2026-11-13): Student A / B / optional C, "Who's reading?" instead of Swap roles
            check('Role-play: roles are Student A and Student B', await seen(page.getByText('ROLE A · STUDENT A')) && await seen(page.getByText('ROLE B · STUDENT B')));
            check('Role-play: optional role C shown', await seen(page.getByText('ROLE C · STUDENT C OR THE TEACHER · OPTIONAL')));
            check('Role-play: no Swap roles in a group course', await page.getByRole('button', { name: 'Swap roles' }).count() === 0);
            await page.getByRole('button', { name: "I'm B" }).click();
            check("Role-play: I'm B hides A's and C's briefs", await page.getByText('Say who you are, your job and your department.').count() === 0
                && await page.getByText("Hidden: this is your partner's card.").count() === 2 && await page.getByText('Welcome the new person and introduce the team.').isVisible());
            await page.screenshot({ path: `${SHOTS}/s8b-role-play-im-b.png` });
            await page.getByRole('button', { name: 'Next card' }).click();
            check('Role-play: the pick is remembered on the next card', await page.getByText('Answer and ask back.').isVisible() && await page.getByText('Ask two questions.').count() === 0);
            check("Role-play: a card without role C offers no I'm C", await page.getByRole('button', { name: "I'm C" }).count() === 0);
            await page.getByRole('button', { name: 'Everyone' }).click();
            await page.getByRole('button', { name: 'Finish' }).click();
            check('Role-play: All done screen', await seen(page.getByRole('heading', { name: 'All done!' })));
        }
        if (label === 'Discussion') {
            await page.getByRole('button', { name: 'Do you like it?' }).click();
            check('Discussion: a follow-up becomes the question', await seen(page.getByRole('heading', { name: 'Do you like it?' })));
        }
        if (label === 'Pictures') {
            const fit = await page.locator('[data-ui-screen=light] img[alt="office"]').evaluate(el => getComputedStyle(el).objectFit);
            check('Pictures: the whole photo, not cropped', fit === 'contain', fit);
            await page.getByRole('button', { name: 'Finish' }).click();
            check('Pictures: All done screen', await seen(page.getByRole('heading', { name: 'All done!' })));
        }
        await closeActivity();
        check(`${label}: Close goes back to the pack`, await seen(card(focus)));
    }

    // Radiant stays dark
    await page.goto(`${BASE}/lessons/radiant/1`);
    await seen(page.getByText('Dark one', { exact: true }));
    await page.locator('[data-testid=pack-activity]').first().getByRole('button', { name: 'Launch' }).click();
    await seen(page.getByText('PRODUCTION', { exact: true }));
    check('Radiant role-play: the old dark layout', await page.locator('[data-ui-screen=light]').count() === 0 && await page.getByText('PRODUCTION', { exact: true }).count() === 1);
    check('Radiant role-play: still Teacher / Student, no role C', await seen(page.getByText('ROLE B · TEACHER')) && await page.getByText(/ROLE C/).count() === 0);
    await page.getByRole('button', { name: 'Swap roles' }).click();
    check('Radiant role-play: Swap roles still works', await seen(page.getByText('ROLE B · STUDENT')));

    // phone
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState() });
    const pp = await phone.newPage();
    pp.on('pageerror', e => errors.push('pageerror ' + e.message));
    await pp.goto(`${BASE}/lessons/firststeps/1?part=C`);
    await pp.locator('[data-testid=pack-activity]').filter({ has: pp.getByText('Meet the team', { exact: true }) }).getByRole('button', { name: 'Launch' }).click();
    await pp.getByText('The new employee', { exact: true }).waitFor();
    check('phone: no sideways scroll on the role-play', await pp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
    // the checklist sits below the cards on a phone: reach it with a real wheel gesture
    await pp.mouse.move(195, 500);
    for (let i = 0; i < 12; i++) await pp.mouse.wheel(0, 400);
    const box = await pp.getByRole('complementary', { name: 'Use it! checklist' }).boundingBox();
    check('phone: Use it! reachable by scrolling', box && box.y < 844 && box.y + 40 > 0, JSON.stringify(box));
    await pp.screenshot({ path: `${SHOTS}/s14-roleplay-phone.png` });
    await phone.close();

    // the student, on their own phone in a breakout room
    const sp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    sp.on('pageerror', e => errors.push('pageerror ' + e.message));
    await sp.goto(`${BASE}/login`);
    await sp.fill('input[name=email]', qa.student.email); await sp.fill('input[name=password]', qa.password);
    await Promise.all([sp.waitForURL(x => !x.pathname.startsWith('/login')), sp.click('button[type=submit]')]);
    await sp.goto(`${BASE}/s/activity/${ids['Meet the team']}`);
    check('student phone: role-play opens light', await seen(sp.locator('[data-ui-screen=light]')) && await seen(sp.getByText('The new employee', { exact: true })));
    await sp.getByRole('button', { name: "I'm A" }).click();
    check("student phone: I'm A shows only A's brief", await sp.getByText('Say who you are, your job and your department.').isVisible()
        && await sp.getByText('Welcome the new person and introduce the team.').count() === 0);
    check('student phone: no sideways scroll', await sp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
    await sp.screenshot({ path: `${SHOTS}/s15-roleplay-student-phone.png`, fullPage: true });
} finally {
    await browser?.close();
    console.log(php(`${SP}/qa_speaking_users.php`, 'cleanup', qa.teacher.email));
}
check('zero console / page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
