import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
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
    const [fontSizeIdx, setFontSizeIdx] = useState(1);
    const [textColor, setTextColor] = useState('text-white');

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    function chooseGenre(g) {
        setGenre(g);
        setIndex(0);
    }

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
            fontSizeIdx={fontSizeIdx}
            fontSizeMax={FONT_SIZE_MAX}
            onFontDecrease={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            onFontIncrease={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))}
            textColor={textColor}
            onTextColorChange={setTextColor}
        >
            <div key={index} className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto py-8">
                <div className="max-w-2xl w-full flex flex-col gap-6 items-center text-center">
                    <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">{genre.genre}</p>
                    <p className={`${PROMPT_SIZES[fontSizeIdx]} font-semibold leading-relaxed whitespace-pre-line ${textColor}`}>{item.prompt}</p>
                    <p className="text-white/40 text-sm">Write about 140–190 words.</p>
                </div>

                <div className="flex justify-center gap-4">
                    <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} className={navBtnCls}>← Prev</button>
                    <button onClick={() => setIndex(i => Math.min(total - 1, i + 1))} disabled={index === total - 1} className={navBtnCls}>Next →</button>
                </div>
            </div>
        </PracticeSessionShell>
    );
}
