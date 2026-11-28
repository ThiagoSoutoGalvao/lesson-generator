import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';
import { useItemEdit } from '@/lib/itemEdit';

const OPTIONS = ['True', 'False', 'Not Given'];
// Light (Aurora Business) text sizes, indexed by the Display panel's size.
const L_TEXT_SIZES = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[22px]', 'text-[22px] sm:text-[26px]', 'text-[25px] sm:text-[30px]'];
const L_STATEMENT_SIZES = ['text-[19px]', 'text-[21px] sm:text-[24px]', 'text-[23px] sm:text-[28px]', 'text-[26px] sm:text-[32px]', 'text-[29px] sm:text-[36px]'];

// The passage with the answer's evidence sentence highlighted (only once answered, and only if it is really there).
function LightPassage({ passage, evidence }) {
    const at = evidence ? passage.indexOf(evidence) : -1;
    if (at === -1) return passage;
    return <>{passage.slice(0, at)}<mark data-evidence className="bg-[#FFE3D6] text-inherit rounded px-0.5 ring-1 ring-[#E0521F]/40">{evidence}</mark>{passage.slice(at + evidence.length)}</>;
}
const OPTION_COLORS = {
    True:      { base: 'bg-green-500/20 border-green-400/50 hover:bg-green-500/40 text-green-100',  selected: 'bg-green-500 border-green-400 text-white', correct: 'bg-green-500 border-green-400 text-white' },
    False:     { base: 'bg-red-500/20 border-red-400/50 hover:bg-red-500/40 text-red-100',          selected: 'bg-red-500 border-red-400 text-white',   correct: 'bg-red-500 border-red-400 text-white' },
    'Not Given': { base: 'bg-amber-500/20 border-amber-400/50 hover:bg-amber-500/40 text-amber-100', selected: 'bg-amber-500 border-amber-400 text-white', correct: 'bg-amber-500 border-amber-400 text-white' },
};

const FONT_SIZES  = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];

export default function TrueFalseActivity({ activity, onClose, onComplete, hideSave, onEditItems }) {
    const total   = activity.statements.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [chosen, setChosen]             = useState(null);
    const [answers, setAnswers]           = useState([]);
    const [finished, setFinished]         = useState(false);
    const [showOptions, setShowOptions]   = useState(true);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below (text left, statement right; no photo)
    // ✎ Edit inside the activity (teacher, saved activity).
    const ed = useItemEdit('true_false', activity, onEditItems, currentIndex, {
        onSaved: () => { setChosen(null); setAnswers(a => { const n = [...a]; n[currentIndex] = undefined; return n; }); },
        onRemoved: n => { setChosen(null); setAnswers([]); setCurrentIndex(i => Math.min(i, n - 1)); },
    });

    const statement = activity.statements[currentIndex];
    const answered  = chosen !== null;
    const isCorrect = answered && chosen === statement.answer;
    const score     = answers.filter(Boolean).length;

    useEffect(() => {
        if (light) return;
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        setChosen(null);
    }, [currentIndex]);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); if (answered) handleNext(); }
            if (e.code === 'KeyP')  setShowOptions(o => !o);
            if (e.code === 'KeyF')  toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answered, currentIndex]);

    // Student app (Phase S3): record the attempt when the results screen shows.
    useEffect(() => {
        if (finished) onComplete?.({ score, maxScore: total });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function handleChoose(option) {
        if (answered) return;
        setChosen(option);
        setAnswers(prev => [...prev, option === statement.answer]);
    }

    function handleNext() {
        if (currentIndex + 1 >= total) {
            setFinished(true);
        } else {
            setCurrentIndex(i => i + 1);
        }
    }

    function handleRestart() {
        setCurrentIndex(0); setAnswers([]); setChosen(null); setFinished(false);
    }

    if (light) {
        // Two buttons unless the set really uses Not Given (A1 / A2 sets don't, 2026-11-18).
        const options = activity.statements.some(s => s.answer === 'Not Given') ? OPTIONS : OPTIONS.slice(0, 2);
        const frame = {
            eyebrow: 'True or false', title: activity.topic || 'Read and decide',
            onSave: hideSave ? undefined : () => setShowSave(true),
            isFullscreen, onFullscreen: toggleFullscreen, onClose,
            overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
        };
        if (finished) {
            return (
                <LightFrame {...frame}>
                    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
                        <section className={`${LIGHT.glowCard} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="Results">
                            <p className={LIGHT.chipCenter}>All done</p>
                            <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-tight">{score} of {total} correct</h1>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                <button type="button" onClick={handleRestart} className={LIGHT.primary}>Play again</button>
                                {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                            </div>
                        </section>
                    </div>
                </LightFrame>
            );
        }
        return (
            <LightFrame {...frame} extra={<span className="hidden sm:flex items-center gap-4"><LightProgress index={currentIndex} total={total} label="Statement" /><span className="text-[15px] font-semibold">Score {score}</span></span>}>
                <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
                    <section aria-label="Text" className={`${LIGHT.card} p-5 sm:p-8`}>
                        <p className={`${LIGHT.eyebrow} mb-3`}>Read the text</p>
                        <p className={`${L_TEXT_SIZES[fontSizeIdx]} leading-relaxed whitespace-pre-line`}>
                            <LightPassage passage={activity.passage} evidence={answered ? statement.evidence : null} />
                        </p>
                    </section>

                    <section aria-label="Statement" className={`${LIGHT.card} p-5 sm:p-8 flex flex-col gap-5 lg:sticky lg:top-6`}>
                        <div className="flex items-start justify-between gap-3">
                            <p className={LIGHT.chip}>Statement {currentIndex + 1} of {total}<span className="sm:hidden"> · score {score}</span></p>
                            {ed.button}
                        </div>
                        {ed.editor ?? <>
                        <h1 className={`font-display ${L_STATEMENT_SIZES[fontSizeIdx]} font-semibold leading-snug`}>{statement.text}</h1>
                        <div role="group" aria-label="Options" className={`grid gap-3 ${options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                            {options.map(opt => {
                                let box = 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] font-semibold';
                                if (answered && opt === statement.answer) box = LIGHT.right;
                                else if (answered && opt === chosen) box = LIGHT.wrong;
                                else if (answered) box = 'border border-[#DDE1E8] bg-white opacity-60 font-semibold';
                                return (
                                    <button key={opt} type="button" onClick={() => handleChoose(opt)} disabled={answered}
                                        className={`${box} min-h-14 sm:min-h-16 rounded-[14px] px-4 text-[18px] sm:text-[20px] text-[#271D62] ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {answered && (
                            <p role="status" className={`rounded-xl px-4 sm:px-5 py-3.5 text-[17px] sm:text-[19px] leading-snug ${isCorrect ? 'bg-[#E5F4EC] text-[#14532D]' : 'bg-[#FDECEA] text-[#7F1D1D]'}`}>
                                <span className="font-semibold">{isCorrect ? 'Right! ' : `Not quite. It's ${statement.answer}. `}</span>
                                {statement.explanation}
                                {statement.evidence && activity.passage.includes(statement.evidence) && <span className="block mt-1 text-[15px] opacity-80">The line is highlighted in the text.</span>}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <button type="button" onClick={handleNext} disabled={!answered} className={LIGHT.primary}>
                                {!answered ? 'Choose an answer' : currentIndex + 1 >= total ? 'See results' : 'Next statement'}
                            </button>
                        </div>
                        </>}
                    </section>
                </div>
            </LightFrame>
        );
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' };

    if (finished) {
        const pct = Math.round((score / total) * 100);
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={bgStyle}>
                <div className="absolute inset-0 bg-black/65" />
                <div className="relative z-10 text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Complete!</h2>
                    <p className="text-2xl">
                        <span className="text-yellow-400 font-bold">{score}</span>
                        {' '}out of{' '}
                        <span className="font-bold">{total}</span> correct
                    </p>
                    <p className="text-xl text-gray-300">{pct}%</p>
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => { setCurrentIndex(0); setAnswers([]); setChosen(null); setFinished(false); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/65" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header — wraps to a second row on narrow screens (the "Hide/Show
                options" toggle is what tips this one over 390px, unlike most
                other activity headers) so the ✕ never ends up off-viewport. */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-y-2 px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">
                        Statement {currentIndex + 1} / {total}
                    </span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">
                        Score: <span className="text-yellow-400">{score}</span>
                    </span>
                    <DisplayControls />
                    <button
                        onClick={() => setShowOptions(o => !o)}
                        className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                        title="Toggle options (P)"
                    >
                        {showOptions ? 'Hide options' : 'Show options'}
                    </button>
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* On mobile (<md) this stacks into one column and the OUTER
                container is what scrolls, so the student can always scroll
                straight through passage -> statement -> options. On desktop
                (md:flex-row) it's still the split-screen with each panel
                scrolling independently, unchanged. */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-6 md:px-12 py-2 overflow-y-auto md:overflow-hidden">

                {/* Passage panel */}
                <div className={`${showOptions ? 'md:w-[62%] md:shrink-0' : 'md:flex-1'} bg-white/8 border border-white/15 rounded-2xl p-5 md:overflow-y-auto transition-all duration-300`}>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Reading Passage</p>
                    <p className={`leading-relaxed ${FONT_SIZES[fontSizeIdx]} ${textColor}`}>{activity.passage}</p>
                </div>

                {/* Statement + options */}
                {showOptions && (
                    <div className="md:flex-1 flex flex-col justify-center gap-6">
                        <h2 className={`font-bold leading-snug drop-shadow-lg ${FONT_SIZES[fontSizeIdx]} ${textColor}`}>
                            {statement.text}
                        </h2>

                        <div className="flex flex-col gap-3">
                            {OPTIONS.map(opt => {
                                const colors = OPTION_COLORS[opt];
                                const fs = FONT_SIZES[fontSizeIdx];
                                let cls = `${colors.base} border rounded-xl px-6 py-4 ${fs} font-semibold transition-all duration-150 cursor-pointer`;

                                if (answered) {
                                    if (opt === statement.answer) cls = `${colors.correct} border rounded-xl px-6 py-4 ${fs} font-semibold cursor-default`;
                                    else if (opt === chosen)      cls = `bg-white/10 border border-white/20 text-white/40 line-through rounded-xl px-6 py-4 ${fs} font-semibold cursor-default`;
                                    else                          cls = `bg-white/5 border border-white/10 text-white/25 rounded-xl px-6 py-4 ${fs} font-semibold cursor-default`;
                                }

                                return (
                                    <button
                                        key={opt}
                                        onClick={() => handleChoose(opt)}
                                        disabled={answered}
                                        className={cls}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {answered && (
                            <div className={`rounded-xl px-6 py-4 ${FONT_SIZES[fontSizeIdx]} leading-relaxed border ${isCorrect ? 'bg-green-500/15 border-green-400/30 text-green-200' : 'bg-red-500/15 border-red-400/30 text-red-200'}`}>
                                <span className="font-semibold">{isCorrect ? '✓ Correct. ' : `✗ The answer is ${statement.answer}. `}</span>
                                {statement.explanation}
                            </div>
                        )}

                        {answered && (
                            <button
                                onClick={handleNext}
                                className="self-start bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors"
                            >
                                {currentIndex + 1 >= total ? 'See Results' : 'Next →'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
