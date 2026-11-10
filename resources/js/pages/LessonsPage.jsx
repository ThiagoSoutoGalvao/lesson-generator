import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Spinner from '@/components/Spinner';
import { TRILHAS, TRILHA_NAMES, TRILHA_LEVEL, TRILHA_TOC, trilhaParts, partOf } from '@/lib/trilhas';
import { STAGES } from '@/lib/stages';
import { getLessonSession } from '@/lib/lessonSession';
import { useLightUi, isLightCourse } from '@/lib/uiTheme';

// Every lesson of a course at a glance (Aurora Lessons Phase 1, step 4): which of the four stages already
// has an activity, and how many activities still have no stage. Each row opens that lesson's pack.

export default function LessonsPage() {
    const [params, setParams] = useSearchParams();
    const trilha = TRILHA_NAMES.find(t => t === params.get('trilha')) ?? getLessonSession()?.trilha ?? 'Radiant';
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('/api/activities')
            .then(({ data }) => setActivities(data.filter(a => a.trilha && a.trilha_lesson)))
            .catch(err => setError(err.response?.data?.message ?? 'Could not load the lessons.'))
            .finally(() => setLoading(false));
    }, []);

    const config = TRILHAS[trilha];
    const parts  = trilhaParts(trilha);
    useLightUi(isLightCourse(trilha)); // Aurora Business courses use the light theme

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display ui-shell-text text-3xl font-bold text-ui-ink">Lessons</h2>
                <p className="ui-shell-text text-ui-muted mt-1 text-sm">
                    {parts.length ? `Each unit is ${parts.length} lessons (1A, 1B, 1C…), each in` : 'Each lesson in'} four stages: Warmer → Presentation → Practice → Production.
                </p>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Course">
                {TRILHA_NAMES.map(t => (
                    <button
                        key={t}
                        type="button"
                        aria-pressed={t === trilha}
                        onClick={() => setParams({ trilha: t })}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border cursor-pointer ${
                            t === trilha ? 'bg-[#e0521f] border-[#e0521f] text-white' : 'ui-chip ui-chip-hover text-ui-muted hover:text-ui-ink'
                        }`}
                    >
                        {TRILHAS[t].label} <span className="opacity-70">· {TRILHA_LEVEL[t]}</span>
                    </button>
                ))}
            </div>

            {loading && <div className="flex justify-center py-10"><Spinner message="Loading…" color="text-ui-muted" textColor="text-ui-faint" /></div>}
            {error && <div className="rounded-xl bg-ui-danger-bg border border-ui-danger-line px-4 py-3 text-sm text-ui-danger">{error}</div>}

            {!loading && !error && (
                <div className="ui-card border rounded-2xl overflow-hidden">
                    <div className="hidden sm:grid grid-cols-[1fr_repeat(4,5.5rem)] gap-2 px-5 py-3 text-[11px] uppercase tracking-wide text-ui-faint border-b border-ui-line">
                        <span>{parts.length ? 'Unit' : 'Lesson'}</span>
                        {STAGES.map(s => <span key={s.key} className="text-center">{s.label}</span>)}
                    </div>
                    <ul aria-label={`${config.label} lessons`}>
                        {Array.from({ length: config.lessons }, (_, i) => i + 1).map(n => {
                            const mine = activities.filter(a => a.trilha === trilha && a.trilha_lesson === n);
                            const unplaced = mine.filter(a => !a.stage).length;
                            const topic = TRILHA_TOC[trilha]?.[n]?.[0];
                            return (
                                <li key={n} className="border-b border-ui-line last:border-b-0">
                                    <Link
                                        to={`/lessons/${trilha.toLowerCase()}/${n}`}
                                        className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(4,5.5rem)] gap-2 items-center px-5 py-3.5 hover:bg-ui-well"
                                    >
                                        <span className="min-w-0">
                                            <span className="text-ui-ink font-semibold">{parts.length ? 'Unit' : 'Lesson'} {n}</span>
                                            {topic && <span className="block text-ui-muted text-sm truncate">{topic}</span>}
                                            {parts.length > 0 && (
                                                <span className="block text-ui-faint text-xs" data-testid="unit-parts">
                                                    {parts.map(p => `${n}${p}: ${mine.filter(a => partOf(a) === p).length}`).join(' · ')}
                                                </span>
                                            )}
                                            {unplaced > 0 && <span className="text-ui-warn text-xs">{unplaced} not placed yet</span>}
                                        </span>
                                        <span className="flex sm:contents gap-3">
                                            {STAGES.map(s => {
                                                const count = mine.filter(a => a.stage === s.key).length;
                                                return (
                                                    <span key={s.key} className="flex sm:justify-center items-center gap-1.5 text-xs" title={`${s.label}: ${count}`}>
                                                        <span className={`w-3 h-3 rounded-full ${count ? 'bg-ui-good' : 'border border-ui-faint'}`} aria-hidden="true" />
                                                        <span className="sm:hidden text-ui-muted">{s.label}</span>
                                                        <span className="text-ui-muted">{count || ''}</span>
                                                        <span className="sr-only">{s.label}: {count}</span>
                                                    </span>
                                                );
                                            })}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
