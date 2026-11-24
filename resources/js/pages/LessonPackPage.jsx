import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ActivityRenderer from '@/components/ActivityRenderer';
import LessonPlayer, { lessonSequence } from '@/components/LessonPlayer';
import StageSelect from '@/components/StageSelect';
import LibraryPicker from '@/components/LibraryPicker';
import Spinner from '@/components/Spinner';
import { TRILHAS, TRILHA_LEVEL, TRILHA_TOC, TYPE_LABELS, composeActivityName, trilhaParts, partOf, focusFromName } from '@/lib/trilhas';
import { STAGES } from '@/lib/stages';
import { pickFill, FILLABLE_STAGES } from '@/lib/fillStage';
import { gridsFor, slotPrompt, defaultGrid, earlierSummary, previousLessonTypes } from '@/lib/lessonGrids';
import { tidyFocus } from '@/lib/naming';
import { setLessonSession } from '@/lib/lessonSession';
import { useLightUi, isLightCourse, LIGHT_TYPES } from '@/lib/uiTheme';

// One course lesson as a lesson pack (Aurora Lessons Phase 1, step 4): the lesson's contents, then its saved
// activities under Warmer → Presentation → Practice → Production. Nothing is generated here — it shows what
// the Library already holds for this trilha + lesson (no AI credits). An activity is moved by changing its
// stage; "+ Add" opens Generate (or the Presentation / Reading tools) with the lesson and stage pre-filled.
// A course whose units have parts (lib/trilhas.js) shows one tab per lesson of the unit — 1A / 1B / 1C — and
// each tab is its own pack; "+ From Library" copies an existing activity into it (the original stays put).

const STAGE_HINTS = {
    warmer:       'Gets the student talking and brings up the topic.',
    presentation: 'The core material: the presentation or the reading.',
    practice:     'Controlled work on the target language.',
    production:   'The student uses the language freely.',
};

// A lesson's core material — what "+ Add" builds new activities from (step 5: no PDF round trip).
const MATERIAL_TYPES = ['reading_text', 'presentation', 'grammar_explainer'];

const SPEAKING_TYPES = ['discussion_questions', 'picture_prompts', 'role_play', 'story_builder', 'debate', 'mini_presentation'];

export default function LessonPackPage() {
    const { trilha: trilhaParam, lesson: lessonParam } = useParams();
    const navigate = useNavigate();
    const trilha   = Object.keys(TRILHAS).find(t => t.toLowerCase() === String(trilhaParam).toLowerCase());
    const lesson   = Number(lessonParam);
    const config   = TRILHAS[trilha];
    const parts    = trilhaParts(trilha);
    const [params, setParams] = useSearchParams();
    const part     = parts.length ? (parts.includes(params.get('part')) ? params.get('part') : parts[0]) : null;
    const code     = `${lesson}${part ?? ''}`; // "1B" — the lesson's short name
    useLightUi(isLightCourse(trilha)); // Aurora Business courses use the light theme

    const [activities, setActivities] = useState([]); // the whole unit; `here` below is this tab's part of it
    const [library, setLibrary]       = useState([]); // every activity of the account, for "+ From Library"
    const [picking, setPicking]       = useState(null); // the stage "+ From Library" was opened from
    const [brief, setBrief]           = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [launched, setLaunched]     = useState(null); // { content, id }
    const [teaching, setTeaching]     = useState(false); // lesson mode (step 6)
    const [filling, setFilling]       = useState({});    // stage → 'busy' | error message (step 7)

    useEffect(() => {
        if (!config) return;
        setLoading(true);
        Promise.all([axios.get('/api/activities'), axios.get('/api/trilha-briefs')])
            .then(([acts, briefs]) => {
                setLibrary(acts.data);
                setActivities(acts.data.filter(a => a.trilha === trilha && a.trilha_lesson === lesson));
                setBrief(briefs.data.find(b => b.trilha === trilha && b.trilha_lesson === lesson) ?? null);
            })
            .catch(err => setError(err.response?.data?.message ?? 'Could not load this lesson.'))
            .finally(() => setLoading(false));
    }, [trilha, lesson]);

    if (!config || !Number.isInteger(lesson) || lesson < 1 || lesson > config.lessons) {
        return (
            <div className="ui-shell-text text-ui-muted py-20 text-center">
                <p className="text-lg">That lesson doesn’t exist.</p>
                <Link to="/lessons" className="text-ui-accent underline text-sm">See all lessons</Link>
            </div>
        );
    }

    if (launched) {
        return (
            <ActivityRenderer
                content={launched.content}
                savedId={launched.id}
                onClose={() => setLaunched(null)}
                onTargetsChange={targets => setActivities(prev => prev.map(x => (x.id === launched.id ? { ...x, content: { ...x.content, targets } } : x)))}
                onDerive={derived => setLaunched({ content: derived, id: null })}
            />
        );
    }

    const updateOne = updated => setActivities(prev => prev.map(x => (x.id === updated.id ? { ...x, stage: updated.stage } : x)));
    const here      = part ? activities.filter(a => partOf(a) === part) : activities;
    const unplaced  = here.filter(a => !a.stage);
    const toc       = TRILHA_TOC[trilha]?.[lesson] ?? [];
    // The material new activities are made from: this lesson's Presentation-stage reading / presentation first,
    // then the rest of the unit's (1B can build on the reading 1A introduced).
    const rank      = a => (partOf(a) === part ? 0 : 2) + (a.stage === 'presentation' ? 0 : 1);
    const materials = activities.filter(a => MATERIAL_TYPES.includes(a.type)).sort((x, y) => rank(x) - rank(y));
    const core      = materials[0] ?? null;

    const focusOf  = a => focusFromName(a.name);
    const sequence = lessonSequence(here);
    const plan     = part ? (brief?.part_plans?.[part] ?? '') : '';
    const pickPart = p => setParams(p === parts[0] ? {} : { part: p }, { replace: true });

    if (teaching) {
        return (
            <LessonPlayer
                title={`${config.label} · Lesson ${code}`}
                items={sequence}
                skipped={unplaced.length}
                focusOf={focusOf}
                onExit={() => setTeaching(false)}
                onTargetsChange={(id, targets) => setActivities(prev => prev.map(x => (x.id === id ? { ...x, content: { ...x.content, targets } } : x)))}
            />
        );
    }

    function add(stage, where) {
        setLessonSession(trilha, lesson, stage, part);
        if (where === 'presentation' || where === 'reading') { navigate('/upload', { state: { tab: where } }); return; }
        const q = new URLSearchParams();
        if (stage === 'production') q.set('goal', 'speaking');
        if (core) q.set('from', String(core.id)); // made from the lesson's own material
        navigate(`/generate${q.toString() ? `?${q}` : ''}`);
    }

    // "Suggest one with Claude" (step 7): pick a template for this stage + level, generate it from the lesson's
    // material (or its contents), and save it into the stage HIDDEN from students until the teacher approves it.
    // "Build this lesson" (2026-11-24): every activity of a grid, one after the other, from the lesson's own
    // reading / presentation, with a summary of the course's earlier lessons. Each one is saved hidden from
    // students until approved. A slot whose stage already holds that format is skipped, so pressing it again
    // only fills what's missing (e.g. after deleting a weak one).
    const readingHere = here.find(a => a.type === 'reading_text');
    const presHere    = here.find(a => a.type === 'presentation' || a.type === 'grammar_explainer');
    function sourceFor(slot) {
        const want = slot.source === 'presentation' ? [presHere, readingHere] : [readingHere, presHere];
        return want.find(Boolean) ?? core;
    }
    async function buildSlot(slot) {
        const body = { type: slot.type, prompt: slotPrompt(slot, trilha), level: TRILHA_LEVEL[trilha] };
        if (isLightCourse(trilha)) body.group = true;
        const src = sourceFor(slot);
        if (src) body.source_activity_id = src.id;
        else body.topic = (toc.slice(0, 2).join('; ') || `${config.label} lesson ${lesson}`).slice(0, 200);
        const earlier = earlierSummary(library, trilha, lesson, part);
        if (earlier) body.earlier = earlier;
        const { data: content } = await axios.post('/api/generate', body);
        const focus = tidyFocus(content.topic || content.title || toc[0] || TYPE_LABELS[slot.type] || '').split(' ').slice(0, 6).join(' ') || 'Suggested';
        let builtBy = null;
        try { builtBy = localStorage.getItem('aurora.save.builtBy') || null; } catch { /* ignore */ }
        const { data: saved } = await axios.post('/api/activities', {
            name: composeActivityName({ trilha, lesson, part, type: slot.type, focus }),
            type: slot.type, content, trilha, trilha_lesson: lesson, trilha_part: part, stage: slot.stage, built_by: builtBy,
            student_visible: false,
        });
        setActivities(prev => [...prev, saved]);
        setLibrary(prev => [saved, ...prev]);
    }

    async function fill(stage) {
        const pick = pickFill(stage, TRILHA_LEVEL[trilha], here.map(a => a.type), isLightCourse(trilha) ? LIGHT_TYPES : null);
        if (!pick) return;
        setFilling(f => ({ ...f, [stage]: 'busy' }));
        try {
            const body = { type: pick.type, prompt: pick.prompt, level: TRILHA_LEVEL[trilha] };
            if (isLightCourse(trilha)) {
                body.group = true; // Aurora Business: always a group of 2–4
                if (pick.type === 'role_play') body.prompt = 'Create 3 role-play cards for students working in pairs. Each has a work situation where the lesson’s target language is needed, a role for Student A and a role for Student B, and an optional role C for a third student.';
            }
            if (core) body.source_activity_id = core.id;
            else body.topic = (toc.slice(0, 2).join('; ') || `${config.label} lesson ${lesson}`).slice(0, 200);
            const { data: content } = await axios.post('/api/generate', body);

            const words = tidyFocus(content.topic || content.title || toc[0] || TYPE_LABELS[pick.type] || '').split(' ');
            const focus = words.slice(0, 6).join(' ') || 'Suggested';
            let builtBy = null;
            try { builtBy = localStorage.getItem('aurora.save.builtBy') || null; } catch { /* ignore */ }
            const { data: saved } = await axios.post('/api/activities', {
                name: composeActivityName({ trilha, lesson, part, type: pick.type, focus }),
                type: pick.type, content, trilha, trilha_lesson: lesson, trilha_part: part, stage, built_by: builtBy,
                student_visible: false,
            });
            setActivities(prev => [...prev, saved]);
            setFilling(f => ({ ...f, [stage]: undefined }));
        } catch (err) {
            setFilling(f => ({ ...f, [stage]: err.response?.data?.message ?? 'Claude could not make one this time. Please try again.' }));
        }
    }

    // Deleting is for good: the database also drops students' results for it and any homework assignment of it.
    const remove = async a => {
        await axios.delete(`/api/activities/${a.id}`);
        setActivities(prev => prev.filter(x => x.id !== a.id));
    };

    // Moves an activity to another lesson of the unit; a standard name follows it ("RADIANT L01 · …" → "RADIANT L01B · …").
    const move = async (a, p) => {
        const focus = focusFromName(a.name);
        const body  = { trilha_part: p };
        if (focus !== a.name) body.name = composeActivityName({ trilha, lesson, part: p, type: a.type, focus });
        const { data } = await axios.patch(`/api/activities/${a.id}`, body);
        setActivities(prev => prev.map(x => (x.id === a.id ? { ...x, trilha_part: data.trilha_part, name: data.name } : x)));
    };

    const copied = saved => {
        setActivities(prev => [...prev, saved]);
        setLibrary(prev => [saved, ...prev]);
    };

    const savePlan = async text => {
        const { data } = await axios.put('/api/trilha-briefs', {
            trilha, trilha_lesson: lesson, part_plans: { ...(brief?.part_plans ?? {}), [part]: text.trim() },
        });
        setBrief(data);
    };

    const approve = async a => {
        const { data } = await axios.patch(`/api/activities/${a.id}`, { student_visible: true });
        setActivities(prev => prev.map(x => (x.id === a.id ? { ...x, student_visible: data.student_visible } : x)));
    };

    function makeFrom(material) {
        setLessonSession(trilha, lesson, 'practice', part);
        navigate(`/generate?from=${material.id}`);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-0">
                    <Link to={`/lessons?trilha=${trilha}`} className="ui-shell-text text-ui-muted hover:text-ui-ink text-sm">← All {config.label} {part ? 'units' : 'lessons'}</Link>
                    <h2 className="font-display ui-shell-text text-3xl font-bold text-ui-ink mt-1">{config.label} · {part ? 'Unit' : 'Lesson'} {lesson}</h2>
                    <p className="ui-shell-text text-ui-muted text-sm mt-1">
                        Level {TRILHA_LEVEL[trilha]}{part && ` · ${parts.length} lessons`} · {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setTeaching(true)}
                    disabled={loading || sequence.length === 0}
                    title={sequence.length === 0 ? 'Place at least one activity in a stage first' : 'Play the whole lesson, stage by stage'}
                    className="bg-[#e0521f] hover:bg-[#c9461a] disabled:bg-ui-well disabled:text-ui-faint disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                    {part ? `Teach ${code} now ▶` : 'Teach now ▶'}
                </button>
                <nav className="flex gap-2" aria-label="Other lessons">
                    {lesson > 1 && <Link to={`/lessons/${trilha.toLowerCase()}/${lesson - 1}`} className="ui-chip ui-chip-hover text-ui-ink text-sm px-3.5 py-2 rounded-lg border">← {part ? 'Unit ' : 'L'}{lesson - 1}</Link>}
                    {lesson < config.lessons && <Link to={`/lessons/${trilha.toLowerCase()}/${lesson + 1}`} className="ui-chip ui-chip-hover text-ui-ink text-sm px-3.5 py-2 rounded-lg border">{part ? 'Unit ' : 'L'}{lesson + 1} →</Link>}
                </nav>
            </div>

            {(toc.length > 0 || brief?.target_language || brief?.vocabulary) && (
                <section className="ui-card border rounded-2xl p-5 flex flex-col gap-3" aria-label="Lesson contents">
                    {toc.length > 0 && (
                        <div>
                            <p className="text-ui-faint text-[11px] font-bold tracking-[0.12em] uppercase mb-1.5">{part ? 'Unit contents' : 'Contents'}</p>
                            <ul className="text-ui-ink text-sm flex flex-col gap-1 list-disc pl-5">
                                {toc.map(item => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                    {brief?.target_language && <p className="text-sm text-ui-ink"><span className="text-ui-faint">Target language:</span> {brief.target_language}</p>}
                    {brief?.vocabulary && <p className="text-sm text-ui-ink"><span className="text-ui-faint">Vocabulary:</span> {brief.vocabulary}</p>}
                </section>
            )}

            {part && (
                <div role="group" aria-label="Lessons in this unit" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {parts.map(p => {
                        const count = activities.filter(a => partOf(a) === p).length;
                        const selected = p === part;
                        return (
                            <button key={p} type="button" aria-pressed={selected} onClick={() => pickPart(p)} data-testid="part-tab"
                                className={`text-left rounded-2xl px-4 py-3 border-2 cursor-pointer text-ui-ink ${selected ? 'bg-ui-sel border-ui-sel-line' : 'ui-card hover:border-ui-faint'}`}>
                                <span className="flex items-baseline justify-between gap-2">
                                    <span className="font-display text-xl font-bold">{lesson}{p}</span>
                                    <span className="text-ui-muted text-sm">{count} {count === 1 ? 'activity' : 'activities'}</span>
                                </span>
                                <span className="block text-ui-muted text-sm mt-1 truncate">{brief?.part_plans?.[p] || (count ? ' ' : 'Not started')}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {part && <PlanLine key={code} code={code} plan={plan} onSave={savePlan} />}

            {!loading && core && (
                <p className="ui-shell-text text-ui-muted text-sm -mt-2" data-testid="pack-source">
                    New activities are made from <span className="text-ui-ink font-semibold">{core.name}</span> — you can pick another source on the Generate page.
                </p>
            )}

            {!loading && !error && (
                <BuildLesson
                    key={code}
                    code={code}
                    grids={gridsFor(trilha)}
                    suggested={defaultGrid(gridsFor(trilha), part, previousLessonTypes(library, trilha, lesson, part))}
                    has={slot => here.some(a => a.stage === slot.stage && a.type === slot.type)}
                    hasMaterial={Boolean(readingHere || presHere)}
                    sourceName={slot => sourceFor(slot)?.name}
                    earlier={earlierSummary(library, trilha, lesson, part)}
                    onBuild={buildSlot}
                />
            )}

            {loading && <div className="flex justify-center py-10"><Spinner message="Loading the lesson…" color="text-ui-muted" textColor="text-ui-faint" /></div>}
            {error && <div className="rounded-xl bg-ui-danger-bg border border-ui-danger-line px-4 py-3 text-sm text-ui-danger">{error}</div>}

            {!loading && !error && (
                <>
                    {unplaced.length > 0 && (
                        <section aria-label="Not placed yet" className="rounded-2xl border border-ui-warn-line bg-ui-warn-bg p-5 flex flex-col gap-3">
                            <div>
                                <h3 className="font-display text-lg font-semibold text-ui-warn">Not placed yet ({unplaced.length})</h3>
                                <p className="text-ui-warn text-sm">Pick a stage for each one and it moves into the lesson below.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {unplaced.map(a => <ActivityCard key={a.id} a={a} parts={parts} lesson={lesson} onMove={p => move(a, p)} onLaunch={() => setLaunched({ content: a.content, id: a.id })} onStage={updateOne} onMakeFrom={MATERIAL_TYPES.includes(a.type) ? () => makeFrom(a) : null} onApprove={() => approve(a)} onDelete={() => remove(a)} />)}
                            </div>
                        </section>
                    )}

                    <ol className="flex flex-col gap-4" aria-label="Lesson stages">
                        {STAGES.map((st, i) => {
                            const items = here.filter(a => a.stage === st.key);
                            return (
                                <li key={st.key} aria-label={st.label} className="ui-card border rounded-2xl p-5 flex flex-col gap-3">
                                    <div className="flex flex-wrap items-start gap-3">
                                        <span className="shrink-0 w-8 h-8 rounded-full bg-ui-sel text-ui-accent font-bold grid place-items-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-display text-lg font-semibold text-ui-ink">{st.label} <span className="text-ui-faint text-sm font-normal">· {items.length}</span></h3>
                                            <p className="text-ui-muted text-sm">{STAGE_HINTS[st.key]}</p>
                                        </div>
                                        <AddButtons stage={st.key} onAdd={add} onPick={() => setPicking(st.key)} />
                                    </div>
                                    {items.length === 0 ? (
                                        FILLABLE_STAGES.includes(st.key)
                                            ? <SuggestBox stage={st.key} state={filling[st.key]} pick={pickFill(st.key, TRILHA_LEVEL[trilha], here.map(a => a.type), isLightCourse(trilha) ? LIGHT_TYPES : null)} source={core?.name} onFill={() => fill(st.key)} />
                                            : <p className="rounded-xl border border-dashed border-ui-line text-ui-faint text-sm px-4 py-4">Nothing here yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map(a => <ActivityCard key={a.id} a={a} parts={parts} lesson={lesson} onMove={p => move(a, p)} onLaunch={() => setLaunched({ content: a.content, id: a.id })} onStage={updateOne} onMakeFrom={MATERIAL_TYPES.includes(a.type) ? () => makeFrom(a) : null} onApprove={() => approve(a)} onDelete={() => remove(a)} />)}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </>
            )}

            {picking && (
                <LibraryPicker
                    library={library}
                    trilha={trilha}
                    lesson={lesson}
                    part={part}
                    stage={picking}
                    onCopied={copied}
                    onClose={() => setPicking(null)}
                />
            )}
        </div>
    );
}

const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.key, s.label]));

// "Build this lesson": pick a grid (a different one is suggested every lesson), see what it will make and
// from which material, then make them all — one at a time, each saved hidden until approved.
function BuildLesson({ code, grids, suggested, has, hasMaterial, sourceName, earlier, onBuild }) {
    const [gridId, setGridId] = useState(suggested?.id ?? grids[0]?.id);
    const [status, setStatus] = useState({}); // slot index → 'busy' | 'done' | error message
    const [running, setRunning] = useState(false);
    const [skip, setSkip] = useState(() => new Set()); // unticked slot indexes
    const grid = grids.find(g => g.id === gridId) ?? grids[0];
    if (!grid) return null;

    const todo = grid.slots.map((s, i) => i).filter(i => !has(grid.slots[i]) && status[i] !== 'done' && !skip.has(i));

    async function run(indexes) {
        setRunning(true);
        for (const i of indexes) {
            setStatus(st => ({ ...st, [i]: 'busy' }));
            try {
                await onBuild(grid.slots[i]);
                setStatus(st => ({ ...st, [i]: 'done' }));
            } catch (err) {
                setStatus(st => ({ ...st, [i]: err.response?.data?.message ?? 'Claude could not make this one. Try again.' }));
            }
        }
        setRunning(false);
    }

    return (
        <section aria-label="Build this lesson" className="ui-card border rounded-2xl p-5 flex flex-col gap-4" data-testid="build-lesson">
            <div>
                <h3 className="font-display text-lg font-semibold text-ui-ink">Build {code} with a grid</h3>
                <p className="text-ui-muted text-sm">
                    Makes the lesson’s activities from its reading and presentation. Each one is saved hidden from students until you approve it — check them, delete what’s weak and press Build again to remake it.
                </p>
            </div>

            <div role="radiogroup" aria-label="Grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {grids.map(g => {
                    const on = g.id === grid.id;
                    return (
                        <button key={g.id} type="button" role="radio" aria-checked={on} disabled={running}
                            onClick={() => { setGridId(g.id); setStatus({}); setSkip(new Set()); }}
                            className={`text-left rounded-xl px-3.5 py-2.5 border-2 cursor-pointer disabled:cursor-not-allowed text-ui-ink ${on ? 'bg-ui-sel border-ui-sel-line' : 'border-ui-line hover:border-ui-faint'}`}>
                            <span className="flex items-center gap-2 font-semibold text-sm">
                                {g.label}
                                {g.id === suggested?.id && <span className="text-[11px] font-semibold text-ui-accent">suggested</span>}
                            </span>
                            <span className="block text-ui-muted text-xs mt-0.5">{g.blurb}</span>
                        </button>
                    );
                })}
            </div>

            <ol className="flex flex-col gap-1.5" aria-label="What this grid makes">
                {grid.slots.map((s, i) => {
                    const st = status[i];
                    const there = has(s) && st !== 'done';
                    return (
                        <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm" data-testid="grid-slot">
                            <input type="checkbox" className="self-center accent-[#e0521f] cursor-pointer disabled:cursor-not-allowed"
                                aria-label={`Make ${TYPE_LABELS[s.type] ?? s.type} (${STAGE_LABEL[s.stage]})`}
                                checked={!there && st !== 'done' ? !skip.has(i) : true}
                                disabled={running || there || st === 'done'}
                                onChange={e => setSkip(prev => { const n = new Set(prev); e.target.checked ? n.delete(i) : n.add(i); return n; })} />
                            <span className="text-ui-faint w-24 shrink-0">{STAGE_LABEL[s.stage]}</span>
                            <span className="text-ui-ink font-semibold">{TYPE_LABELS[s.type] ?? s.type}</span>
                            {sourceName(s) && <span className="text-ui-faint text-xs truncate max-w-[16rem]">from {sourceName(s)}</span>}
                            <span className="ml-auto text-xs" role={typeof st === 'string' && st !== 'busy' && st !== 'done' ? 'alert' : undefined}>
                                {there && <span className="text-ui-faint">already in the lesson</span>}
                                {st === 'busy' && <span className="text-ui-muted">making it…</span>}
                                {st === 'done' && <span className="text-[#1E7A4C] font-semibold">✓ made — check it below</span>}
                                {st && st !== 'busy' && st !== 'done' && (
                                    <span className="text-ui-danger">{st} <button type="button" disabled={running} onClick={() => run([i])} className="underline cursor-pointer">Try again</button></span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {earlier && (
                <details className="text-sm">
                    <summary className="text-ui-muted cursor-pointer">Builds on the earlier lessons</summary>
                    <pre className="whitespace-pre-wrap font-sans text-ui-muted text-xs mt-2">{earlier}</pre>
                </details>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => run(todo)} disabled={running || todo.length === 0 || !hasMaterial}
                    className="bg-[#e0521f] hover:bg-[#c9461a] disabled:bg-ui-well disabled:text-ui-faint disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer">
                    {running ? 'Building…' : todo.length === 0 ? (skip.size ? 'Nothing ticked' : 'All made') : `Build ${todo.length} ${todo.length === 1 ? 'activity' : 'activities'}`}
                </button>
                {!hasMaterial && <p className="text-ui-danger text-sm font-semibold">This lesson has no reading or presentation yet. Add one first (+ Add in the Presentation stage) — the activities are made from it.</p>}
                {running && <p className="text-ui-muted text-sm">About 20 seconds each — you can watch them appear below.</p>}
            </div>
        </section>
    );
}

function SuggestBox({ state, pick, source, onFill }) {
    const busy = state === 'busy';
    const error = state && state !== 'busy' ? state : null;
    const label = pick ? (TYPE_LABELS[pick.type] ?? pick.type) : '';
    return (
        <div className="rounded-xl border border-dashed border-ui-line px-4 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3" data-testid="suggest-box">
            <p className="text-ui-muted text-sm flex-1">
                Nothing here yet. Suggested: <span className="text-ui-ink font-semibold">{label}</span>, made from {source ? <span className="text-ui-ink">{source}</span> : 'the lesson contents'} — saved here, hidden from students until you approve it.
            </p>
            <button type="button" onClick={onFill} disabled={busy}
                className="shrink-0 bg-ui-field hover:bg-ui-well disabled:opacity-60 disabled:cursor-wait border border-ui-line text-ui-ink text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                {busy ? `Making it… (${label})` : '✨ Suggest one with Claude'}
            </button>
            {error && <p className="text-ui-danger text-sm sm:basis-full" role="alert">{error}</p>}
        </div>
    );
}

function AddButtons({ stage, onAdd, onPick }) {
    const cls = 'text-sm font-semibold px-3.5 py-2 rounded-lg border border-ui-line bg-ui-field text-ui-ink hover:bg-ui-well cursor-pointer';
    return (
        <div className="flex flex-wrap gap-2">
            {stage === 'presentation' ? (
                <>
                    <button type="button" onClick={() => onAdd(stage, 'presentation')} className={cls}>+ Presentation</button>
                    <button type="button" onClick={() => onAdd(stage, 'reading')} className={cls}>+ Reading</button>
                </>
            ) : (
                <button type="button" onClick={() => onAdd(stage)} className={cls}>+ Add</button>
            )}
            <button type="button" onClick={onPick} className="text-sm font-semibold px-3.5 py-2 rounded-lg border border-ui-sel-line bg-ui-sel text-ui-ink hover:opacity-90 cursor-pointer">
                + From Library
            </button>
        </div>
    );
}

// The one-line plan for this lesson of the unit ("Controlled practice: ever / never"), kept in the unit's brief.
function PlanLine({ code, plan, onSave }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue]     = useState(plan);
    const [busy, setBusy]       = useState(false);
    const [err, setErr]         = useState('');

    async function submit(e) {
        e.preventDefault();
        setBusy(true); setErr('');
        try {
            await onSave(value);
            setEditing(false);
        } catch {
            setErr('Could not save the plan.');
        } finally {
            setBusy(false);
        }
    }

    if (editing) {
        return (
            <form onSubmit={submit} className="flex flex-wrap items-center gap-2" aria-label={`Plan for ${code}`}>
                <label htmlFor="part-plan" className="text-ui-faint text-[11px] font-bold tracking-[0.12em] uppercase">Plan for {code}</label>
                <input id="part-plan" value={value} onChange={e => setValue(e.target.value)} maxLength={300} autoFocus autoComplete="off"
                    onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setValue(plan); } }}
                    placeholder="e.g. Controlled practice: ever / never"
                    className="flex-1 min-w-[14rem] bg-ui-field border border-ui-line text-ui-ink placeholder:text-ui-faint rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc6840]" />
                <button type="submit" disabled={busy} className="bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Save</button>
                <button type="button" onClick={() => { setEditing(false); setValue(plan); }} className="text-ui-muted hover:text-ui-ink text-sm px-2 py-2 cursor-pointer">Cancel</button>
                {err && <span className="text-ui-danger text-xs basis-full">{err}</span>}
            </form>
        );
    }
    return (
        <p className="ui-shell-text flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ui-ink -mt-1" data-testid="part-plan">
            <span className="text-ui-faint text-[11px] font-bold tracking-[0.12em] uppercase">Plan for {code}</span>
            <span className={plan ? '' : 'text-ui-faint'}>{plan || 'No plan written yet.'}</span>
            <button type="button" onClick={() => { setValue(plan); setEditing(true); }} className="text-ui-accent hover:text-ui-ink underline underline-offset-2 cursor-pointer">{plan ? 'Edit plan' : 'Write one'}</button>
        </p>
    );
}

// Moves an activity to another lesson of its unit (1A → 1B), straight from its card.
function PartSelect({ a, parts, lesson, onMove }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr]   = useState('');

    async function change(e) {
        setBusy(true); setErr('');
        try {
            await onMove(e.target.value);
        } catch {
            setErr('Could not move it.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor={`part-${a.id}`} className="text-xs text-ui-muted">Lesson</label>
            <select id={`part-${a.id}`} value={partOf(a)} onChange={change} disabled={busy}
                className="text-xs rounded-lg px-2 py-1 border cursor-pointer disabled:opacity-50 bg-ui-field border-ui-line text-ui-ink">
                {parts.map(p => <option key={p} value={p} className="text-black bg-white">{lesson}{p}</option>)}
            </select>
            {err && <span className="text-xs text-ui-danger">{err}</span>}
        </div>
    );
}

function ActivityCard({ a, parts, lesson, onMove, onLaunch, onStage, onMakeFrom, onApprove, onDelete }) {
    const [confirming, setConfirming] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const focus = focusFromName(a.name);
    const targets = SPEAKING_TYPES.includes(a.type) ? (a.content?.targets ?? []) : null;
    return (
        <div className="rounded-xl bg-ui-well border border-ui-line p-4 flex flex-col gap-2.5" data-testid="pack-activity">
            <div className="flex items-start gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ui-faint shrink-0 mt-0.5">{TYPE_LABELS[a.type] ?? a.type}</span>
                <span className="flex-1" />
                {a.built_by && <span className="text-[11px] text-ui-faint">by {a.built_by}</span>}
            </div>
            <p className="text-ui-ink font-semibold leading-snug break-words">{focus}</p>
            {a.student_visible === false && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-ui-warn-bg border border-ui-warn-line px-2.5 py-1.5">
                    <span className="text-ui-warn text-xs flex-1">Suggested — not shown to students until you approve it.</span>
                    <button type="button" onClick={onApprove} className="text-xs font-semibold text-white bg-amber-600/80 hover:bg-amber-600 rounded-md px-2.5 py-1 cursor-pointer">Approve</button>
                </div>
            )}
            {targets && (
                <p className="text-xs text-ui-faint">{targets.length > 0 ? `Use it!: ${targets.length} targets` : 'Use it!: no targets yet'}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <button type="button" onClick={onLaunch} className="bg-[#e0521f] hover:bg-[#c9461a] text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Launch</button>
                <StageSelect activity={a} onSaved={onStage} />
                {parts.length > 0 && <PartSelect a={a} parts={parts} lesson={lesson} onMove={onMove} />}
            </div>
            {confirming ? (
                <div role="alertdialog" aria-label={`Delete ${focus}?`} className="rounded-lg bg-ui-danger-bg border border-ui-danger-line px-3 py-2.5 flex flex-col gap-2">
                    <p className="text-ui-danger text-sm">Delete “{focus}” for good? Students’ results for it and any homework assignment of it go too.</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={async () => { try { await onDelete(); } catch { setDeleteError('Could not delete it. Please try again.'); } }}
                            className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1.5 cursor-pointer">Delete</button>
                        <button type="button" onClick={() => { setConfirming(false); setDeleteError(''); }}
                            className="text-sm text-ui-muted hover:text-ui-ink px-3 py-1.5 cursor-pointer">Keep it</button>
                    </div>
                    {deleteError && <p className="text-ui-danger text-xs">{deleteError}</p>}
                </div>
            ) : (
                <button type="button" onClick={() => setConfirming(true)}
                    className="self-end -mt-1 text-xs text-ui-faint hover:text-ui-danger cursor-pointer">Delete</button>
            )}
            {onMakeFrom && (
                <button type="button" onClick={onMakeFrom}
                    className="self-start text-sm font-semibold text-ui-accent hover:text-ui-ink underline underline-offset-2 cursor-pointer">
                    Make an activity from this
                </button>
            )}
        </div>
    );
}
