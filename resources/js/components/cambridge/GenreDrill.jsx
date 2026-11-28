import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeBack } from '@/hooks/usePracticeBack';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import { useDisplay } from '@/hooks/useDisplay';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import genreSets from '@/data/cambridge/b2/writingGenre.json';

const PROMPT_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const FONT_SIZE_MAX = PROMPT_SIZES.length - 1;

const navBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-default text-white font-semibold transition-colors cursor-pointer';

// Same no-auto-checking prompt-browser pattern as EssayDrill — the only difference is the
// genre-select step first, since the real exam offers a choice of genre for this part.
export default function GenreDrill() {
    const navigate = useNavigate();
    const [genre, setGenre] = useState(null);
    const [index, setIndex] = useState(0);
    const [showModel, setShowModel] = useState(false); // a model answer (reports have one, 2026-11-28)
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();

    const backTo = usePracticeBack({ path: '/practice', state: { tab: 'cambridge' } });
    function backToTab() {
        navigate(backTo.path, { state: backTo.state });
    }

    function chooseGenre(g) {
        setGenre(g);
        setIndex(0);
        setShowModel(false);
    }
    function go(i) { setIndex(i); setShowModel(false); }

    if (!genre) {
        return (
            <PracticeSessionShell
                watermark={<CambridgeWatermark />}
                title="Genre Choice — B2 First"
                subtitle="Choose a genre — Writing, Part 2"
                onBack={backToTab}
            >
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="flex flex-col gap-3 max-w-md w-full mx-auto">
                        <p className="text-white/60 text-sm text-center mb-2">In the real exam, the student picks one of several genres. Choose one to practice.</p>
                        {genreSets.map(g => (
                            <button
                                key={g.id}
                                onClick={() => chooseGenre(g)}
                                className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left"
                            >
                                <p className="text-lg">{g.genre}</p>
                                <p className="text-white/40 text-xs font-normal mt-1">{g.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </PracticeSessionShell>
        );
    }

    const item = genre.items[index];
    const total = genre.items.length;

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title={`${genre.genre} — B2 First`}
            subtitle="Writing, Part 2 — genre choice"
            progressLabel={`Prompt ${index + 1} of ${total}`}
            onBack={() => setGenre(null)}
        >
            <div key={index} className="flex-1 min-h-0 flex flex-col items-center gap-8 px-4 sm:px-8 overflow-y-auto py-8">
                <div className="max-w-2xl w-full flex flex-col gap-6 items-center text-center">
                    <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">{genre.genre}</p>
                    <p className={`${PROMPT_SIZES[fontSizeIdx]} font-semibold leading-relaxed whitespace-pre-line ${textColor}`}>{item.prompt}</p>
                    <p className="text-white/40 text-sm">Write about 140–190 words.</p>
                    {genre.tips?.length > 0 && (
                        <div className="rounded-2xl bg-black/30 border border-white/15 px-6 py-5 text-left w-full" data-testid="genre-tips">
                            <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide mb-2">How to write a {genre.genre.toLowerCase()}</p>
                            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-white/80 text-sm leading-relaxed">
                                {genre.tips.map(t => <li key={t}>{t}</li>)}
                            </ul>
                        </div>
                    )}
                    {item.model && (showModel ? (
                        <div className="rounded-2xl bg-white/95 text-[#1c1540] px-6 py-5 text-left w-full" data-testid="model-answer">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#9A3412]">Model answer</p>
                                <button type="button" onClick={() => setShowModel(false)} className="text-sm font-semibold underline cursor-pointer">Hide</button>
                            </div>
                            {item.model.split(/\n\n/).map((block, i) => {
                                const [head, ...rest] = block.split(/\n/);
                                return i === 0 && rest.length === 0
                                    ? <p key={i} className="font-bold text-lg mb-3">{head}</p>
                                    : <div key={i} className="mb-3">{rest.length ? <><p className="font-bold">{head}</p><p className="leading-relaxed">{rest.join(' ')}</p></> : <p className="leading-relaxed">{head}</p>}</div>;
                            })}
                        </div>
                    ) : (
                        <button type="button" onClick={() => setShowModel(true)} className={navBtnCls}>Show a model answer</button>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <button onClick={() => go(Math.max(0, index - 1))} disabled={index === 0} className={navBtnCls}>← Prev</button>
                    <button onClick={() => go(Math.min(total - 1, index + 1))} disabled={index === total - 1} className={navBtnCls}>Next →</button>
                </div>
            </div>
        </PracticeSessionShell>
    );
}
