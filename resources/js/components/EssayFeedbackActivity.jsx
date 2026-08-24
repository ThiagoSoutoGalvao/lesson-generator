import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES        = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const EXPLANATION_SIZES = ['text-lg', 'text-xl',  'text-2xl', 'text-3xl', 'text-4xl'];
const PARAGRAPH_SIZES   = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const TEXT_COLORS = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Orange', cls: 'text-orange-400', bg: '#fb923c' },
    { label: 'Red',    cls: 'text-red-400',    bg: '#f87171' },
    { label: 'Cyan',   cls: 'text-cyan-300',   bg: '#67e8f9' },
];

function buildSteps(activity) {
    const steps = [];
    const paragraphs = (activity.essay_text ?? '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length > 0) {
        steps.push({ kind: 'essay', paragraphs });
    }
    (activity.mistakes ?? []).forEach(m => steps.push({ kind: 'mistake', ...m }));
    (activity.grammar_drills ?? []).forEach(g => steps.push({ kind: 'grammarDrill', ...g }));
    (activity.improvements ?? []).forEach(i => steps.push({ kind: 'improvement', ...i }));
    return steps;
}

function renderSentence(sentence, error, correction, isRevealed) {
    const parts = sentence.split(error);
    if (parts.length < 2) return <span>{sentence}</span>;
    return (
        <>
            {parts[0]}
            {isRevealed ? (
                <>
                    <span className="line-through text-red-400 mx-1">{error}</span>
                    <span className="text-green-300 font-bold mx-1">{correction}</span>
                </>
            ) : (
                <span className="border-b-2 border-red-400/60 text-white">{error}</span>
            )}
            {parts.slice(1).join(error)}
        </>
    );
}

export default function EssayFeedbackActivity({ activity, onClose }) {
    const [index, setIndex]             = useState(0);
    const [revealed, setRevealed]       = useState(false);
    const [bgUrl, setBgUrl]             = useState(null);
    const [showSave, setShowSave]       = useState(false);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor]     = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const steps = buildSteps(activity);
    const step  = steps[index];
    const total = steps.length;
    const needsReveal = step?.kind === 'mistake' || step?.kind === 'grammarDrill' || step?.kind === 'improvement';

    const mistakes = activity.mistakes ?? [];
    const grammarDrills = activity.grammar_drills ?? [];
    const improvements = activity.improvements ?? [];
    const essayParagraphs = (activity.essay_text ?? '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                (revealed || !needsReveal) ? handleNext() : setRevealed(true);
            }
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, revealed, needsReveal]);

    function handleNext() {
        if (index < total - 1) { setIndex(i => i + 1); setRevealed(false); }
    }

    function handlePrev() {
        if (index > 0) { setIndex(i => i - 1); setRevealed(false); }
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    if (total === 0) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center z-50 text-white gap-4" style={bgStyle}>
                <div className="absolute inset-0 bg-black/50" />
                <p className="relative z-10 text-lg">No feedback points were found for this essay.</p>
                <button onClick={onClose} className="relative z-10 bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2.5 rounded-xl cursor-pointer">Close</button>
            </div>
        );
    }

    let kindLabel = '';
    if (step.kind === 'essay')        kindLabel = 'The essay';
    if (step.kind === 'mistake')      kindLabel = 'Would this sound more natural?';
    if (step.kind === 'grammarDrill') kindLabel = 'Grammar practice';
    if (step.kind === 'improvement')  kindLabel = 'Ways to make it stronger';

    return (
      <>
        <div className="fixed inset-0 flex flex-col z-50 print:hidden" style={bgStyle}>
            <div className="absolute inset-0 bg-black/50" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">{index + 1} / {total}</span>
                </div>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(FONT_SIZES.length - 1, i + 1))} disabled={fontSizeIdx === FONT_SIZES.length - 1}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Larger text">A+</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {TEXT_COLORS.map(({ label, cls, bg }) => (
                            <button key={cls} onClick={() => setTextColor(cls)} title={label}
                                className={`w-4 h-4 rounded-full transition-all cursor-pointer ${textColor === cls ? 'ring-2 ring-white ring-offset-1 ring-offset-black/60 scale-110' : 'opacity-50 hover:opacity-90'}`}
                                style={{ backgroundColor: bg }} />
                        ))}
                    </div>
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={() => window.print()} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Download as PDF">⬇ PDF</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '≡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-fuchsia-400 rounded-full transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-6 overflow-y-auto">
                <div className="max-w-2xl w-full flex flex-col gap-4">

                    <p className="text-white/45 text-xs uppercase tracking-widest text-center">{kindLabel}</p>

                    <div className="flex flex-col rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 overflow-hidden">

                        {step.kind === 'essay' && (
                            <div className="px-8 py-8 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
                                {step.paragraphs.map((p, i) => (
                                    <p key={i} className={`${PARAGRAPH_SIZES[fontSizeIdx]} leading-relaxed ${textColor}`}>{p}</p>
                                ))}
                            </div>
                        )}

                        {step.kind === 'mistake' && (
                            <>
                                <div className="px-8 py-10 flex items-center justify-center">
                                    <p className={`${FONT_SIZES[fontSizeIdx]} leading-relaxed text-center ${textColor}`}>
                                        {step.original}
                                    </p>
                                </div>
                                {revealed && (
                                    <div className="px-8 pt-8 pb-8 border-t border-white/10 bg-white/5 flex flex-col gap-4">
                                        <div>
                                            <p className="text-white/45 text-xs uppercase tracking-widest mb-3">A more natural way to say this</p>
                                            <p className={`${FONT_SIZES[fontSizeIdx]} text-green-300 font-semibold leading-relaxed`}>{step.suggestion}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/45 text-xs uppercase tracking-widest mb-3">Why</p>
                                            <p className={`${EXPLANATION_SIZES[fontSizeIdx]} ${textColor} opacity-80 leading-relaxed`}>{step.explanation}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {step.kind === 'grammarDrill' && (
                            <>
                                <div className="px-8 py-10 flex items-center justify-center">
                                    <p className={`${FONT_SIZES[fontSizeIdx]} leading-relaxed text-center ${textColor}`}>
                                        {renderSentence(step.sentence, step.error, step.correction, revealed)}
                                    </p>
                                </div>
                                {revealed && (
                                    <div className="px-8 pt-8 pb-8 border-t border-white/10 bg-white/5">
                                        <p className="text-white/45 text-xs uppercase tracking-widest mb-4">Why</p>
                                        <p className={`${EXPLANATION_SIZES[fontSizeIdx]} ${textColor} opacity-80 leading-relaxed`}>{step.explanation}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {step.kind === 'improvement' && (
                            <>
                                <div className="px-8 py-10 flex items-center justify-center">
                                    <p className={`${FONT_SIZES[fontSizeIdx]} leading-relaxed text-center ${textColor}`}>
                                        💡 {step.suggestion}
                                    </p>
                                </div>
                                {revealed && (
                                    <div className="px-8 pt-8 pb-8 border-t border-white/10 bg-white/5">
                                        <p className="text-white/45 text-xs uppercase tracking-widest mb-4">Why</p>
                                        <p className={`${EXPLANATION_SIZES[fontSizeIdx]} ${textColor} opacity-80 leading-relaxed`}>{step.explanation}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex justify-center gap-4 shrink-0">
                        <button onClick={handlePrev} disabled={index === 0}
                            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer">← Prev</button>
                        {needsReveal && !revealed ? (
                            <button onClick={() => setRevealed(true)}
                                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Reveal</button>
                        ) : (
                            <button onClick={handleNext} disabled={index === total - 1}
                                className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Next →</button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Print-only view — light/printer-friendly, natural page flow, everything already revealed */}
        <div className="essay-print-root" style={{ display: 'none' }}>
            <p className="essay-print-meta">Essay feedback — {activity.topic}</p>

            {essayParagraphs.length > 0 && (
                <div className="essay-print-section">
                    <p className="essay-print-section-label">The essay</p>
                    {essayParagraphs.map((p, i) => (
                        <p key={i} className="essay-print-paragraph">{p}</p>
                    ))}
                </div>
            )}

            {mistakes.length > 0 && (
                <div className="essay-print-section">
                    <p className="essay-print-section-label">Sentences that could sound more natural</p>
                    {mistakes.map((m, i) => (
                        <div key={i} className="essay-print-item">
                            <p className="essay-print-original">{i + 1}. {m.original}</p>
                            <p className="essay-print-suggestion">→ {m.suggestion}</p>
                            <p className="essay-print-explanation">{m.explanation}</p>
                        </div>
                    ))}
                </div>
            )}

            {grammarDrills.length > 0 && (
                <div className="essay-print-section">
                    <p className="essay-print-section-label">Grammar practice</p>
                    {grammarDrills.map((g, i) => (
                        <div key={i} className="essay-print-item">
                            <p className="essay-print-original">
                                {i + 1}. {g.sentence.split(g.error)[0]}
                                <span className="essay-print-error">{g.error}</span>
                                <span className="essay-print-correction"> {g.correction}</span>
                                {g.sentence.split(g.error).slice(1).join(g.error)}
                            </p>
                            <p className="essay-print-explanation">{g.explanation}</p>
                        </div>
                    ))}
                </div>
            )}

            {improvements.length > 0 && (
                <div className="essay-print-section">
                    <p className="essay-print-section-label">Ways to make it stronger</p>
                    {improvements.map((imp, i) => (
                        <div key={i} className="essay-print-item">
                            <p className="essay-print-original">{i + 1}. {imp.suggestion}</p>
                            <p className="essay-print-explanation">{imp.explanation}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </>
    );
}
