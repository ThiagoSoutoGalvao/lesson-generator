import { Link } from 'react-router-dom';
import { TRILHAS, TRILHA_TOC } from '@/lib/trilhas';

// A one-line preview of what a lesson covers, from its ToC.
function preview(trilha, n) {
    const toc = TRILHA_TOC[trilha]?.[n] ?? [];
    if (!toc.length) return 'Topics coming soon';
    return toc.slice(0, 2).join(' · ');
}

export default function MyTrilhaPage({ user }) {
    const meta = TRILHAS[user.trilha];
    const lessons = Array.from({ length: meta?.lessons ?? 0 }, (_, i) => i + 1);
    const firstName = (user.name || '').trim().split(/\s+/)[0] || 'there';

    return (
        <div className="px-5 pt-8">
            <p className="font-display font-semibold text-[11px] tracking-[0.14em] uppercase text-[#9384bd] mb-2">
                Hi, {firstName} 👋
            </p>
            <h1 className="font-display font-bold text-[26px] text-white leading-tight">
                Your {meta?.label ?? user.trilha} trilha
            </h1>
            <p className="text-white/60 text-sm mt-2">
                {lessons.length} lessons · practise them in any order, as many times as you like.
            </p>

            <p className="font-display font-semibold text-[11px] tracking-[0.13em] uppercase text-[#9384bd] mt-8 mb-3">
                Lessons
            </p>

            <div className="flex flex-col gap-2.5">
                {lessons.map(n => (
                    <Link
                        key={n}
                        to={`/s/lesson/${n}`}
                        className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#291f66]/55 backdrop-blur-md p-3.5 transition-colors hover:border-white/20 hover:bg-[#342874]/70"
                    >
                        <span className="shrink-0 w-9 h-9 rounded-xl bg-[#f8c63d]/12 text-[#f8c63d] font-display font-extrabold text-[15px] grid place-items-center">
                            {n}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block font-display font-semibold text-[14.5px] text-white">Lesson {n}</span>
                            <span className="block text-[12px] text-[#9384bd] truncate mt-0.5">{preview(user.trilha, n)}</span>
                        </span>
                        <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 5l7 7-7 7" /></svg>
                    </Link>
                ))}
            </div>
        </div>
    );
}
