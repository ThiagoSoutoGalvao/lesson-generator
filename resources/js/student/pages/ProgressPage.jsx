import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { TRILHAS } from '@/lib/trilhas';
import { relativeTime } from '@/lib/time';
import { activityMeta } from '@/student/lib/activityMeta';

const cardBase = 'rounded-2xl border border-white/10 bg-[#291f66]/55 backdrop-blur-md';

function ScoreBadge({ item }) {
    const hasScore = item.score != null && item.max_score;
    return (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#3ecf8e]/15 text-[#5be0a4] px-2 py-0.5 text-[11px] font-display font-bold">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M5 13l4 4L19 7" /></svg>
            {hasScore && `${item.score}/${item.max_score}`}
        </span>
    );
}

function RecentRow({ item }) {
    const meta = activityMeta(item.type);
    return (
        <Link
            to={`/s/activity/${item.activity_id}`}
            className={`flex items-center gap-3 ${cardBase} p-3 transition-colors hover:border-white/20 hover:bg-[#342874]/70`}
        >
            <span className="shrink-0 w-8 h-8 rounded-lg bg-[#f8c63d]/12 text-[15px] grid place-items-center">{meta.icon}</span>
            <span className="flex-1 min-w-0">
                <span className="block font-display font-semibold text-[13.5px] text-white truncate">{item.name}</span>
                <span className="block text-[11px] text-[#9384bd] mt-0.5">
                    Lesson {item.lesson} · {relativeTime(item.completed_at)}
                </span>
            </span>
            <ScoreBadge item={item} />
        </Link>
    );
}

export default function ProgressPage({ user }) {
    const [data, setData]       = useState(null);
    const [error, setError]     = useState(null);
    const meta = TRILHAS[user.trilha];

    useEffect(() => {
        let alive = true;
        axios.get('/api/student/progress')
            .then(({ data }) => { if (alive) setData(data); })
            .catch(() => { if (alive) setError('Could not load your progress. Try again later.'); });
        return () => { alive = false; };
    }, []);

    const pct = data && data.activities_total > 0
        ? Math.round((data.activities_done / data.activities_total) * 100)
        : 0;

    // "Trilha complete" needs every configured lesson (not just the ones with
    // activities so far) to be fully done — activities_total/_done alone would
    // read 100% the moment every *existing* activity is done, even if the
    // teacher hasn't built half the lessons yet.
    const lessonsTotal = meta?.lessons ?? 0;
    const allLessonsDone = data && lessonsTotal > 0 && Array.from({ length: lessonsTotal }, (_, i) => i + 1)
        .every(n => {
            const l = data.lessons.find(x => x.lesson === n);
            return l && l.total > 0 && l.done === l.total;
        });

    return (
        <div className="px-5 pt-8">
            <h1 className="font-display font-bold text-[26px] text-white leading-tight">Your progress</h1>
            <p className="text-white/50 text-sm mt-1">{meta?.label ?? user.trilha} trilha</p>

            {error && (
                <div className={`${cardBase} p-6 mt-6 text-center`}>
                    <p className="text-white/70 text-sm">{error}</p>
                </div>
            )}

            {!error && !data && (
                <div className={`${cardBase} p-6 mt-6 text-center`}>
                    <p className="text-white/50 text-sm">Loading…</p>
                </div>
            )}

            {data && (
                <>
                    {allLessonsDone && (
                        <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#fc6840]/25 to-[#a01789]/25 border border-[#fc6840]/40 p-4 text-center">
                            <p className="font-display font-bold text-white text-base">🎉 Trilha complete!</p>
                            <p className="text-white/70 text-xs mt-1">Nice work — ask your teacher what's next.</p>
                        </div>
                    )}

                    <div className={`${cardBase} p-5 mt-6`}>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="font-display font-extrabold text-3xl text-white leading-none">
                                    {data.activities_done}<span className="text-white/40 text-lg">/{data.activities_total}</span>
                                </p>
                                <p className="text-[11px] text-[#9384bd] mt-1.5 uppercase tracking-wide">Activities completed</p>
                            </div>
                            <p className="font-display font-bold text-[#fc6840] text-xl">{pct}%</p>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-[#fc6840] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        {data.total_attempts > data.activities_done && (
                            <p className="text-[11px] text-[#9384bd] mt-3">
                                {data.total_attempts} total attempts — you've retried a few.
                            </p>
                        )}
                    </div>

                    <p className="font-display font-semibold text-[11px] tracking-[0.13em] uppercase text-[#9384bd] mt-8 mb-3">
                        Recent activity
                    </p>

                    {data.recent.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                            <p className="text-white/70 text-sm">Nothing here yet.</p>
                            <p className="text-white/40 text-xs mt-1.5">
                                Once you start completing activities, your scores and history will show up here.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {data.recent.map(item => <RecentRow key={item.id} item={item} />)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
