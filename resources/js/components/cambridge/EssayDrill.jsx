import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import essayItems from '@/data/cambridge/b2/writingEssay.json';

const QUESTION_SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const BODY_SIZES     = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const FONT_SIZE_MAX = QUESTION_SIZES.length - 1;

const navBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-default text-white font-semibold transition-colors cursor-pointer';

// No auto-checking, ever — this is a prompt browser, not a drill. The teacher shows a
// prompt, the student writes it out on paper or in their own doc (this app is a Zoom
// screen-share display, so it can't capture what they write), and the teacher gives
// feedback live. No reveal, no score, no timer — just Prev/Next through the bank.
export default function EssayDrill() {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(1);
    const [textColor, setTextColor] = useState('text-white');

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    const item = essayItems[index];
    const total = essayItems.length;

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title="Essay — B2 First"
            subtitle="Writing, Part 1 — compulsory question"
            progressLabel={`Prompt ${index + 1} of ${total}`}
            onBack={backToTab}
            fontSizeIdx={fontSizeIdx}
            fontSizeMax={FONT_SIZE_MAX}
            onFontDecrease={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            onFontIncrease={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))}
            textColor={textColor}
            onTextColorChange={setTextColor}
        >
            <div key={index} className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto py-8">
                <div className="max-w-3xl w-full flex flex-col gap-6 items-center text-center">
                    <p className={`${BODY_SIZES[fontSizeIdx]} text-white/60 leading-relaxed`}>{item.context}</p>

                    <p className={`${QUESTION_SIZES[fontSizeIdx]} font-bold leading-snug ${textColor}`}>{item.question}</p>

                    <div className="rounded-2xl bg-black/30 border border-white/15 px-8 py-6 flex flex-col gap-3 items-start text-left w-full max-w-xl">
                        <p className="text-white/40 text-xs uppercase tracking-widest">Write about:</p>
                        <ul className={`${BODY_SIZES[fontSizeIdx]} ${textColor} list-disc pl-5 flex flex-col gap-1`}>
                            <li>{item.points[0]}</li>
                            <li>{item.points[1]}</li>
                            <li className="text-white/50 italic">…and your own idea</li>
                        </ul>
                    </div>

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
