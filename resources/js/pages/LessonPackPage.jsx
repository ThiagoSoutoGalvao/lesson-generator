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
import { tidyFocus } from '@/lib/naming';
import { setLessonSession } from '@/lib/lessonSession';

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
            <div className="lg-shell-text text-white/80 py-20 text-center">
                <p className="text-lg">That lesson doesn’t exist.</p>
                <Link to="/lessons" className="text-[#fc6840] underline text-sm">See all lessons</Link>
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
    async function fill(stage) {
        const pick = pickFill(stage, TRILHA_LEVEL[trilha], here.map(a => a.type));
        if (!pick) return;
        setFilling(f => ({ ...f, [stage]: 'busy' }));
        try {
            const body = { type: pick.type, prompt: pick.prompt, level: TRILHA_LEVEL[trilha] };
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
                    <Link to={`/lessons?trilha=${trilha}`} className="lg-shell-text text-white/70 hover:text-white text-sm">← All {config.label} {part ? 'units' : 'lessons'}</Link>
                    <h2 className="font-display lg-shell-text text-3xl font-bold text-white mt-1">{config.label} · {part ? 'Unit' : 'Lesson'} {lesson}</h2>
                    <p className="lg-shell-text text-white/75 text-sm mt-1">
                        Level {TRILHA_LEVEL[trilha]}{part && ` · ${parts.length} lessons`} · {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setTeaching(true)}
                    disabled={loading || sequence.length === 0}
                    title={sequence.length === 0 ? 'Place at least one activity in a stage first' : 'Play the whole lesson, stage by stage'}
                    className="bg-[#e0521f] hover:bg-[#c9461a] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                    {part ? `Teach ${code} now ▶` : 'Teach now ▶'}
                </button>
                <nav className="flex gap-2" aria-label="Other lessons">
                    {lesson > 1 && <Link to={`/lessons/${trilha.toLowerCase()}/${lesson - 1}`} className="lg-chip lg-chip-hover text-white/85 text-sm px-3.5 py-2 rounded-lg border">← {part ? 'Unit ' : 'L'}{lesson - 1}</Link>}
                    {lesson < config.lessons && <Link to={`/lessons/${trilha.toLowerCase()}/${lesson + 1}`} className="lg-chip lg-chip-hover text-white/85 text-sm px-3.5 py-2 rounded-lg border">{part ? 'Unit ' : 'L'}{lesson + 1} →</Link>}
                </nav>
            </div>

            {(toc.length > 0 || brief?.target_language || brief?.vocabulary) && (
                <section className="lg-surface border rounded-2xl p-5 flex flex-col gap-3" aria-label="Lesson contents">
                    {toc.length > 0 && (
                        <div>
                            <p className="text-white/50 text-[11px] font-bold tracking-[0.12em] uppercase mb-1.5">{part ? 'Unit contents' : 'Contents'}</p>
                            <ul className="text-white/90 text-sm flex flex-col gap-1 list-disc pl-5">
                                {toc.map(item => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                    {brief?.target_language && <p className="text-sm text-white/85"><span className="text-white/50">Target language:</span> {brief.target_language}</p>}
                    {brief?.vocabulary && <p className="text-sm text-white/85"><span className="text-white/50">Vocabulary:</span> {brief.vocabulary}</p>}
                </section>
            )}

            {part && (
                <div role="group" aria-label="Lessons in this unit" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {parts.map(p => {
                        const count = activities.filter(a => partOf(a) === p).length;
                        const selected = p === part;
                        return (
                            <button key={p} type="button" aria-pressed={selected} onClick={() => pickPart(p)} data-testid="part-tab"
                                className={`text-left rounded-2xl px-4 py-3 border-2 cursor-pointer text-white ${selected ? 'bg-[#fc6840]/20 border-[#fc6840]' : 'lg-surface border-white/12 hover:border-white/25'}`}>
                                <span className="flex items-baseline justify-between gap-2">
                                    <span className="font-display text-xl font-bold">{lesson}{p}</span>
                                    <span className="text-white/70 text-sm">{count} {count === 1 ? 'activity' : 'activities'}</span>
                                </span>
                                <span className="block text-white/75 text-sm mt-1 truncate">{brief?.part_plans?.[p] || (count ? ' ' : 'Not started')}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {part && <PlanLine key={code} code={code} plan={plan} onSave={savePlan} />}

            {!loading && core && (
                <p className="lg-shell-text text-white/75 text-sm -mt-2" data-testid="pack-source">
                    New activities are made from <span className="text-white font-semibold">{core.name}</span> — you can pick another source on the Generate page.
                </p>
            )}

            {loading && <div className="flex justify-center py-10"><Spinner message="Loading the lesson…" color="text-white/70" textColor="text-white/55" /></div>}
            {error && <div className="rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-sm text-red-300">{error}</div>}

            {!loading && !error && (
                <>
                    {unplaced.length > 0 && (
                        <section aria-label="Not placed yet" className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 flex flex-col gap-3">
                            <div>
                                <h3 className="font-display text-lg font-semibold text-amber-200">Not placed yet ({unplaced.length})</h3>
                                <p className="text-amber-100/80 text-sm">Pick a stage for each one and it moves into the lesson below.</p>
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
                                <li key={st.key} aria-label={st.label} className="lg-surface border rounded-2xl p-5 flex flex-col gap-3">
                                    <div className="flex flex-wrap items-start gap-3">
                                        <span className="shrink-0 w-8 h-8 rounded-full bg-[#fc6840]/20 text-[#ffb59a] font-bold grid place-items-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-display text-lg font-semibold text-white">{st.label} <span className="text-white/45 text-sm font-normal">· {items.length}</span></h3>
                                            <p className="text-white/60 text-sm">{STAGE_HINTS[st.key]}</p>
                                        </div>
                                        <AddButtons stage={st.key} onAdd={add} onPick={() => setPicking(st.key)} />
                                    </div>
                                    {items.length === 0 ? (
                                        FILLABLE_STAGES.includes(st.key)
                                            ? <SuggestBox stage={st.key} state={filling[st.key]} pick={pickFill(st.key, TRILHA_LEVEL[trilha], here.map(a => a.type))} source={core?.name} onFill={() => fill(st.key)} />
                                            : <p className="rounded-xl border border-dashed border-white/20 text-white/50 text-sm px-4 py-4">Nothing here yet.</p>
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

function SuggestBox({ state, pick, source, onFill }) {
    const busy = state === 'busy';
    const error = state && state !== 'busy' ? state : null;
    const label = pick ? (TYPE_LABELS[pick.type] ?? pick.type) : '';
    return (
        <div className="rounded-xl border border-dashed border-white/25 px-4 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3" data-testid="suggest-box">
            <p className="text-white/60 text-sm flex-1">
                Nothing here yet. Suggested: <span className="text-white font-semibold">{label}</span>, made from {source ? <span className="text-white/85">{source}</span> : 'the lesson contents'} — saved here, hidden from students until you approve it.
            </p>
            <button type="button" onClick={onFill} disabled={busy}
                className="shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:cursor-wait border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                {busy ? `Making it… (${label})` : '✨ Suggest one with Claude'}
            </button>
            {error && <p className="text-red-300 text-sm sm:basis-full" role="alert">{error}</p>}
        </div>
    );
}

function AddButtons({ stage, onAdd, onPick }) {
    const cls = 'text-sm font-semibold px-3.5 py-2 rounded-lg border border-white/20 text-white/90 hover:text-white hover:bg-white/10 cursor-pointer';
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
            <button type="button" onClick={onPick} className="text-sm font-semibold px-3.5 py-2 rounded-lg border border-[#fc6840]/65 bg-[#fc6840]/15 text-white hover:bg-[#fc6840]/25 cursor-pointer">
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
                <label htmlFor="part-plan" className="text-white/55 text-[11px] font-bold tracking-[0.12em] uppercase">Plan for {code}</label>
                <input id="part-plan" value={value} onChange={e => setValue(e.target.value)} maxLength={300} autoFocus autoComplete="off"
                    onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setValue(plan); } }}
                    placeholder="e.g. Controlled practice: ever / never"
                    className="flex-1 min-w-[14rem] bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc6840]" />
                <button type="submit" disabled={busy} className="bg-[#e0521f] hover:bg-[#c9461a] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Save</button>
                <button type="button" onClick={() => { setEditing(false); setValue(plan); }} className="text-white/70 hover:text-white text-sm px-2 py-2 cursor-pointer">Cancel</button>
                {err && <span className="text-red-300 text-xs basis-full">{err}</span>}
            </form>
        );
    }
    return (
        <p className="lg-shell-text flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80 -mt-1" data-testid="part-plan">
            <span className="text-white/55 text-[11px] font-bold tracking-[0.12em] uppercase">Plan for {code}</span>
            <span className={plan ? '' : 'text-white/50'}>{plan || 'No plan written yet.'}</span>
            <button type="button" onClick={() => { setValue(plan); setEditing(true); }} className="text-[#ffb59a] hover:text-white underline underline-offset-2 cursor-pointer">{plan ? 'Edit plan' : 'Write one'}</button>
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
            <label htmlFor={`part-${a.id}`} className="text-xs text-white/60">Lesson</label>
            <select id={`part-${a.id}`} value={partOf(a)} onChange={change} disabled={busy}
                className="text-xs rounded-lg px-2 py-1 border cursor-pointer disabled:opacity-50 bg-white/10 border-white/20 text-white">
                {parts.map(p => <option key={p} value={p} className="text-black bg-white">{lesson}{p}</option>)}
            </select>
            {err && <span className="text-xs text-red-300">{err}</span>}
        </div>
    );
}

function ActivityCard({ a, parts, lesson, onMove, onLaunch, onStage, onMakeFrom, onApprove, onDelete }) {
    const [confirming, setConfirming] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const focus = focusFromName(a.name);
    const targets = SPEAKING_TYPES.includes(a.type) ? (a.content?.targets ?? []) : null;
    return (
        <div className="rounded-xl bg-black/20 border border-white/12 p-4 flex flex-col gap-2.5" data-testid="pack-activity">
            <div className="flex items-start gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55 shrink-0 mt-0.5">{TYPE_LABELS[a.type] ?? a.type}</span>
                <span className="flex-1" />
                {a.built_by && <span className="text-[11px] text-white/45">by {a.built_by}</span>}
            </div>
            <p className="text-white font-semibold leading-snug break-words">{focus}</p>
            {a.student_visible === false && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-400/30 px-2.5 py-1.5">
                    <span className="text-amber-200 text-xs flex-1">Suggested — not shown to students until you approve it.</span>
                    <button type="button" onClick={onApprove} className="text-xs font-semibold text-white bg-amber-600/80 hover:bg-amber-600 rounded-md px-2.5 py-1 cursor-pointer">Approve</button>
                </div>
            )}
            {targets && (
                <p className="text-xs text-white/55">{targets.length > 0 ? `Use it!: ${targets.length} targets` : 'Use it!: no targets yet'}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <button type="button" onClick={onLaunch} className="bg-[#e0521f] hover:bg-[#c9461a] text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Launch</button>
                <StageSelect activity={a} onSaved={onStage} />
                {parts.length > 0 && <PartSelect a={a} parts={parts} lesson={lesson} onMove={onMove} />}
            </div>
            {confirming ? (
                <div role="alertdialog" aria-label={`Delete ${focus}?`} className="rounded-lg bg-red-500/10 border border-red-400/35 px-3 py-2.5 flex flex-col gap-2">
                    <p className="text-red-100 text-sm">Delete “{focus}” for good? Students’ results for it and any homework assignment of it go too.</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={async () => { try { await onDelete(); } catch { setDeleteError('Could not delete it. Please try again.'); } }}
                            className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1.5 cursor-pointer">Delete</button>
                        <button type="button" onClick={() => { setConfirming(false); setDeleteError(''); }}
                            className="text-sm text-white/80 hover:text-white px-3 py-1.5 cursor-pointer">Keep it</button>
                    </div>
                    {deleteError && <p className="text-red-300 text-xs">{deleteError}</p>}
                </div>
            ) : (
                <button type="button" onClick={() => setConfirming(true)}
                    className="self-end -mt-1 text-xs text-white/45 hover:text-red-300 cursor-pointer">Delete</button>
            )}
            {onMakeFrom && (
                <button type="button" onClick={onMakeFrom}
                    className="self-start text-sm font-semibold text-[#ffb59a] hover:text-white underline underline-offset-2 cursor-pointer">
                    Make an activity from this
                </button>
            )}
        </div>
    );
}
