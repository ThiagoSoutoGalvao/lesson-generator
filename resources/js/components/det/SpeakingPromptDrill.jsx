import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';

const PREP_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const PROMPT_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const FONT_SIZE_MAX = PREP_SIZES.length - 1;

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';
const ghostBtnCls = 'text-white/50 hover:text-white text-sm font-semibold transition-colors cursor-pointer';

// Shared engine for every Part B speaking type — deliberately has no clock anywhere.
// Real DET timing is silent-read / countdown-speak; this app's whole point is to strip
// that pressure back out and let the teacher pace the exchange live over Zoom instead.
// A prompt-having item shows its prep content (photo or text) first; the teacher clicks
// a plain button — no numbers, no auto-advance — when the student is ready to speak,
// which reveals the prompt. Items with no prep skip straight to the prompt view.
export default function SpeakingPromptDrill({
    title,
    subtitle,
    items,
    prepLabel = 'Read',
    revealLabel = 'Ready to Speak →',
    promptLabel = 'Now speak',
    backToPrepLabel = '← Re-read',
    onBack,
    doneSecondaryLabel = 'Back to DET Practice',
    watermark,
}) {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState(items[0]?.prep ? 'prep' : 'prompt'); // prep | prompt | done
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    function restart() {
        setIndex(0);
        setPhase(items[0]?.prep ? 'prep' : 'prompt');
    }

    function goNext() {
        if (index + 1 < items.length) {
            const next = items[index + 1];
            setIndex(i => i + 1);
            setPhase(next.prep ? 'prep' : 'prompt');
        } else {
            setPhase('done');
        }
    }

    function goPrev() {
        if (index === 0) return;
        const prev = items[index - 1];
        setIndex(i => i - 1);
        setPhase(prev.prep ? 'prep' : 'prompt');
    }

    const item = items[index];

    return (
        <PracticeSessionShell
            title={title}
            subtitle={phase === 'done' ? subtitle : `Prompt ${index + 1} of ${items.length}`}
            onRedo={phase !== 'done' ? restart : undefined}
            onBack={onBack || backToDetTab}
            fontSizeIdx={fontSizeIdx}
            fontSizeMax={FONT_SIZE_MAX}
            onFontDecrease={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            onFontIncrease={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))}
            textColor={textColor}
            onTextColorChange={setTextColor}
            watermark={watermark}
        >
            {phase === 'prep' && item?.prep && (
                <div key={`${index}-prep`} className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto py-8">
                    <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">{prepLabel}</p>

                    {item.prep.type === 'photos' ? (
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            {item.prep.content.map((src, i) => (
                                <div key={src} className="flex flex-col items-center gap-2">
                                    <img src={src} alt="" className="max-h-[42vh] max-w-[42vw] rounded-2xl border border-white/20 object-contain" />
                                    <span className="text-white/40 text-xs font-semibold uppercase tracking-wide">Photo {String.fromCharCode(65 + i)}</span>
                                </div>
                            ))}
                        </div>
                    ) : item.prep.type === 'photo' ? (
                        <img src={item.prep.content} alt="" className="max-h-[55vh] max-w-full rounded-2xl border border-white/20 object-contain" />
                    ) : item.prep.type === 'list' ? (
                        <div className="flex flex-col gap-3 max-w-2xl w-full">
                            {item.prep.intro && (
                                <p className={`${PREP_SIZES[fontSizeIdx]} leading-relaxed text-center ${textColor} mb-2`}>{item.prep.intro}</p>
                            )}
                            {item.prep.content.map((option, i) => (
                                <div key={i} className="px-5 py-3 rounded-xl bg-white/8 border border-white/15 text-white/85 text-base">
                                    {option}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={`${PREP_SIZES[fontSizeIdx]} leading-relaxed text-center max-w-3xl ${textColor}`}>
                            {item.prep.content}
                        </p>
                    )}

                    <div className="flex items-center gap-4">
                        {index > 0 && <button onClick={goPrev} className={ghostBtnCls}>← Previous</button>}
                        <button onClick={() => setPhase('prompt')} className={primaryBtnCls}>{revealLabel}</button>
                    </div>
                </div>
            )}

            {phase === 'prompt' && item && (
                <div key={`${index}-prompt`} className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto py-8">
                    <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">{promptLabel}</p>

                    {item.prep?.type === 'photos' && (
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {item.prep.content.map(src => (
                                <img key={src} src={src} alt="" className="max-h-[28vh] max-w-[32vw] rounded-2xl border border-white/20 object-contain opacity-80" />
                            ))}
                        </div>
                    )}
                    {item.prep?.type === 'photo' && (
                        <img src={item.prep.content} alt="" className="max-h-[35vh] max-w-full rounded-2xl border border-white/20 object-contain opacity-80" />
                    )}

                    <p className={`${PROMPT_SIZES[fontSizeIdx]} font-semibold leading-relaxed text-center max-w-3xl ${textColor}`}>
                        {item.prompt}
                    </p>

                    <div className="flex items-center gap-4">
                        {item.prep && <button onClick={() => setPhase('prep')} className={ghostBtnCls}>{backToPrepLabel}</button>}
                        <button onClick={goNext} className={primaryBtnCls}>
                            {index + 1 < items.length ? 'Next Prompt →' : 'Finish'}
                        </button>
                    </div>
                </div>
            )}

            {phase === 'done' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-8 overflow-y-auto">
                    <p className="text-white text-3xl font-bold">That's the end of this set.</p>
                    <p className="text-white/50 text-sm">No score to review here — just talk through how it went with the student.</p>
                    <div className="flex gap-4">
                        <button onClick={restart} className={primaryBtnCls}>Start Again</button>
                        <button onClick={onBack || backToDetTab} className={secondaryBtnCls}>{doneSecondaryLabel}</button>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
