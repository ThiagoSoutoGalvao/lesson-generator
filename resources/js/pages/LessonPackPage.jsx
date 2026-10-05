import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ActivityRenderer from '@/components/ActivityRenderer';
import StageSelect from '@/components/StageSelect';
import Spinner from '@/components/Spinner';
import { TRILHAS, TRILHA_LEVEL, TRILHA_TOC, TYPE_LABELS } from '@/lib/trilhas';
import { STAGES } from '@/lib/stages';
import { setLessonSession } from '@/lib/lessonSession';

// One course lesson as a lesson pack (Aurora Lessons Phase 1, step 4): the lesson's contents, then its saved
// activities under Warmer → Presentation → Practice → Production. Nothing is generated here — it shows what
// the Library already holds for this trilha + lesson (no AI credits). An activity is moved by changing its
// stage; "+ Add" opens Generate (or the Presentation / Reading tools) with the lesson and stage pre-filled.

const STAGE_HINTS = {
    warmer:       'Gets the student talking and brings up the topic.',
    presentation: 'The core material: the presentation or the reading.',
    practice:     'Controlled work on the target language.',
    production:   'The student uses the language freely.',
};

const SPEAKING_TYPES = ['discussion_questions', 'picture_prompts', 'role_play', 'story_builder', 'debate', 'mini_presentation'];

export default function LessonPackPage() {
    const { trilha: trilhaParam, lesson: lessonParam } = useParams();
    const navigate = useNavigate();
    const trilha   = Object.keys(TRILHAS).find(t => t.toLowerCase() === String(trilhaParam).toLowerCase());
    const lesson   = Number(lessonParam);
    const config   = TRILHAS[trilha];

    const [activities, setActivities] = useState([]);
    const [brief, setBrief]           = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [launched, setLaunched]     = useState(null); // { content, id }

    useEffect(() => {
        if (!config) return;
        setLoading(true);
        Promise.all([axios.get('/api/activities'), axios.get('/api/trilha-briefs')])
            .then(([acts, briefs]) => {
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
    const unplaced  = activities.filter(a => !a.stage);
    const toc       = TRILHA_TOC[trilha]?.[lesson] ?? [];
    const prefix    = `${config.label} L${String(lesson).padStart(2, '0')}`; // the standard name starts "RADIANT L01 · Type · Focus"

    function add(stage, where) {
        setLessonSession(trilha, lesson, stage);
        if (where === 'presentation' || where === 'reading') navigate('/upload', { state: { tab: where } });
        else navigate(stage === 'production' ? '/generate?goal=speaking' : '/generate');
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-0">
                    <Link to={`/lessons?trilha=${trilha}`} className="lg-shell-text text-white/70 hover:text-white text-sm">← All {config.label} lessons</Link>
                    <h2 className="font-display lg-shell-text text-3xl font-bold text-white mt-1">{config.label} · Lesson {lesson}</h2>
                    <p className="lg-shell-text text-white/75 text-sm mt-1">
                        Level {TRILHA_LEVEL[trilha]} · {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                    </p>
                </div>
                <nav className="flex gap-2" aria-label="Other lessons">
                    {lesson > 1 && <Link to={`/lessons/${trilha.toLowerCase()}/${lesson - 1}`} className="lg-chip lg-chip-hover text-white/85 text-sm px-3.5 py-2 rounded-lg border">← L{lesson - 1}</Link>}
                    {lesson < config.lessons && <Link to={`/lessons/${trilha.toLowerCase()}/${lesson + 1}`} className="lg-chip lg-chip-hover text-white/85 text-sm px-3.5 py-2 rounded-lg border">L{lesson + 1} →</Link>}
                </nav>
            </div>

            {(toc.length > 0 || brief?.target_language || brief?.vocabulary) && (
                <section className="lg-surface border rounded-2xl p-5 flex flex-col gap-3" aria-label="Lesson contents">
                    {toc.length > 0 && (
                        <div>
                            <p className="text-white/50 text-[11px] font-bold tracking-[0.12em] uppercase mb-1.5">Contents</p>
                            <ul className="text-white/90 text-sm flex flex-col gap-1 list-disc pl-5">
                                {toc.map(item => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                    {brief?.target_language && <p className="text-sm text-white/85"><span className="text-white/50">Target language:</span> {brief.target_language}</p>}
                    {brief?.vocabulary && <p className="text-sm text-white/85"><span className="text-white/50">Vocabulary:</span> {brief.vocabulary}</p>}
                </section>
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
                                {unplaced.map(a => <ActivityCard key={a.id} a={a} prefix={prefix} onLaunch={() => setLaunched({ content: a.content, id: a.id })} onStage={updateOne} />)}
                            </div>
                        </section>
                    )}

                    <ol className="flex flex-col gap-4" aria-label="Lesson stages">
                        {STAGES.map((st, i) => {
                            const items = activities.filter(a => a.stage === st.key);
                            return (
                                <li key={st.key} aria-label={st.label} className="lg-surface border rounded-2xl p-5 flex flex-col gap-3">
                                    <div className="flex flex-wrap items-start gap-3">
                                        <span className="shrink-0 w-8 h-8 rounded-full bg-[#fc6840]/20 text-[#ffb59a] font-bold grid place-items-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-display text-lg font-semibold text-white">{st.label} <span className="text-white/45 text-sm font-normal">· {items.length}</span></h3>
                                            <p className="text-white/60 text-sm">{STAGE_HINTS[st.key]}</p>
                                        </div>
                                        <AddButtons stage={st.key} onAdd={add} />
                                    </div>
                                    {items.length === 0 ? (
                                        <p className="rounded-xl border border-dashed border-white/20 text-white/50 text-sm px-4 py-4">Nothing here yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map(a => <ActivityCard key={a.id} a={a} prefix={prefix} onLaunch={() => setLaunched({ content: a.content, id: a.id })} onStage={updateOne} />)}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </>
            )}
        </div>
    );
}

function AddButtons({ stage, onAdd }) {
    const cls = 'text-sm font-semibold px-3.5 py-2 rounded-lg border border-white/20 text-white/90 hover:text-white hover:bg-white/10 cursor-pointer';
    if (stage === 'presentation') {
        return (
            <div className="flex gap-2">
                <button type="button" onClick={() => onAdd(stage, 'presentation')} className={cls}>+ Presentation</button>
                <button type="button" onClick={() => onAdd(stage, 'reading')} className={cls}>+ Reading</button>
            </div>
        );
    }
    return <button type="button" onClick={() => onAdd(stage)} className={cls}>+ Add</button>;
}

function ActivityCard({ a, prefix, onLaunch, onStage }) {
    const focus = a.name.startsWith(`${prefix} · `) ? a.name.slice(prefix.length + 3).replace(/^[^·]+· /, '') : a.name;
    const targets = SPEAKING_TYPES.includes(a.type) ? (a.content?.targets ?? []) : null;
    return (
        <div className="rounded-xl bg-black/20 border border-white/12 p-4 flex flex-col gap-2.5" data-testid="pack-activity">
            <div className="flex items-start gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55 shrink-0 mt-0.5">{TYPE_LABELS[a.type] ?? a.type}</span>
                <span className="flex-1" />
                {a.built_by && <span className="text-[11px] text-white/45">by {a.built_by}</span>}
            </div>
            <p className="text-white font-semibold leading-snug break-words">{focus}</p>
            {targets && (
                <p className="text-xs text-white/55">{targets.length > 0 ? `Use it!: ${targets.length} targets` : 'Use it!: no targets yet'}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <button type="button" onClick={onLaunch} className="bg-[#e0521f] hover:bg-[#c9461a] text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Launch</button>
                <StageSelect activity={a} onSaved={onStage} />
            </div>
        </div>
    );
}
