import { useParams, Link } from 'react-router-dom';
import { TRILHAS, TRILHA_TOC } from '@/lib/trilhas';
import { useStudentLessons } from '@/student/lib/useStudentLessons';
import { activityMeta } from '@/student/lib/activityMeta';

const cardBase = 'rounded-2xl border border-white/10 bg-[#291f66]/55 backdrop-blur-md';

function ProgressBadge({ item }) {
    if (!item.done) return null;
    const hasScore = item.last_score != null && item.last_max;
    return (
        <span
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#3ecf8e]/15 text-[#5be0a4] px-2 py-0.5 text-[11px] font-display font-bold"
            title={item.attempts > 1 ? `${item.attempts} attempts` : 'Completed'}
        >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M5 13l4 4L19 7" /></svg>
            {hasScore && `${item.last_score}/${item.last_max}`}
        </span>
    );
}

function ActivityRow({ item }) {
    const meta = activityMeta(item.type);
    return (
        <Link
            to={`/s/activity/${item.id}`}
            className={`flex items-center gap-3.5 ${cardBase} p-3.5 transition-colors hover:border-white/20 hover:bg-[#342874]/70`}
        >
            <span className="shrink-0 w-9 h-9 rounded-xl bg-[#f8c63d]/12 text-[17px] grid place-items-center">
                {meta.icon}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block font-display font-semibold text-[14.5px] text-white truncate">{item.name}</span>
                <span className="block text-[12px] text-[#9384bd] mt-0.5">{meta.label}</span>
            </span>
            <ProgressBadge item={item} />
            <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 5l7 7-7 7" /></svg>
        </Link>
    );
}

function Practice({ n }) {
    const { loading, error, lessons } = useStudentLessons();
    const items = lessons?.[n] ?? [];

    if (loading) {
        return (
            <div className={`${cardBase} p-6 text-center`}>
                <p className="text-white/50 text-sm">Loading activities…</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                <p className="text-white/70 text-sm">{error}</p>
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                <p className="text-white/70 text-sm">No activities for this lesson yet.</p>
                <p className="text-white/40 text-xs mt-1.5">Your teacher is still building them — check back soon.</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-2.5">
            {items.map(item => <ActivityRow key={item.id} item={item} />)}
        </div>
    );
}

export default function LessonPage({ user }) {
    const n = Number(useParams().n);
    const meta = TRILHAS[user.trilha];
    const valid = Number.isInteger(n) && n >= 1 && n <= (meta?.lessons ?? 0);
    const toc = TRILHA_TOC[user.trilha]?.[n] ?? [];

    return (
        <div className="px-5 pt-6">
            <Link to="/s" className="inline-flex items-center gap-1.5 font-display font-semibold text-sm text-white/60 hover:text-white mb-4">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 5l-7 7 7 7" /></svg>
                {meta?.label ?? user.trilha}
            </Link>

            {!valid ? (
                <p className="text-white/60 text-sm mt-6">That lesson doesn't exist in your trilha.</p>
            ) : (
                <>
                    <p className="font-display font-semibold text-[11px] tracking-[0.14em] uppercase text-[#9384bd]">
                        Lesson {n}
                    </p>
                    <h1 className="font-display font-bold text-[25px] text-white leading-tight mt-1">
                        {(toc[0] ?? `Lesson ${n}`)}
                    </h1>

                    {toc.length > 0 && (
                        <>
                            <p className="font-display font-semibold text-[11px] tracking-[0.13em] uppercase text-[#9384bd] mt-7 mb-3">
                                What this lesson covers
                            </p>
                            <div className={`${cardBase} p-4`}>
                                <ul className="flex flex-col">
                                    {toc.map((item, i) => (
                                        <li key={i} className="relative pl-5 py-2 text-[13.5px] text-white leading-snug border-b border-white/[0.06] last:border-b-0">
                                            <span className="absolute left-0.5 top-[15px] w-1.5 h-1.5 rounded-full bg-[#fc6840]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    <p className="font-display font-semibold text-[11px] tracking-[0.13em] uppercase text-[#9384bd] mt-8 mb-3">
                        Practice
                    </p>
                    <Practice n={n} />
                </>
            )}
        </div>
    );
}
