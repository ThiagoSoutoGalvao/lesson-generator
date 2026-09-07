import { useParams, Link } from 'react-router-dom';
import { TRILHAS, TRILHA_TOC } from '@/lib/trilhas';

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
                            <div className="rounded-2xl border border-white/10 bg-[#291f66]/55 backdrop-blur-md p-4">
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
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                        <p className="text-white/70 text-sm">Activities for this lesson will appear here soon.</p>
                        <p className="text-white/40 text-xs mt-1.5">Your teacher is still building them.</p>
                    </div>
                </>
            )}
        </div>
    );
}
