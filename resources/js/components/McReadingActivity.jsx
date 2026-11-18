import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';

const FONT_SIZES  = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
// Light (Aurora Business) sizes — the same steps as the light True / False.
const L_TEXT_SIZES = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[22px]', 'text-[22px] sm:text-[26px]', 'text-[25px] sm:text-[30px]'];
const L_Q_SIZES    = ['text-[19px]', 'text-[21px] sm:text-[24px]', 'text-[23px] sm:text-[28px]', 'text-[26px] sm:text-[32px]', 'text-[29px] sm:text-[36px]'];
const L_OPT_SIZES  = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];

// The passage with the answer's evidence sentence highlighted (once answered, and only if it is really there).
function LightPassage({ passage, evidence }) {
    const at = evidence ? passage.indexOf(evidence) : -1;
    if (at === -1) return passage;
    return <>{passage.slice(0, at)}<mark data-evidence className="bg-[#FFE3D6] text-inherit rounded px-0.5 ring-1 ring-[#E0521F]/40">{evidence}</mark>{passage.slice(at + evidence.length)}</>;
}

// Cambridge-style Multiple Choice Reading: a passage that stays visible while the
// student works one comprehension question at a time. Same split-panel model as
// TrueFalseActivity, with generic 4-option questions.
export default function McReadingActivity({ activity, onClose, onComplete, hideSave }) {
    const questions = activity.questions ?? [];
    const total = questions.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [chosen, setChosen]             = useState(null);
    const [answers, setAnswers]           = useState([]);
    const [finished, setFinished]         = useState(false);
    const [showQuestion, setShowQuestion] = useState(true);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below (text left, question right; no photo)

    const question  = questions[currentIndex];
    const answered  = chosen !== null;
    const isCorrect = answered && chosen === question?.answer;
    const score     = answers.filter(Boolean).length;

    useEffect(() => {
        if (light) return;
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => { setChosen(null); }, [currentIndex]);

    // Student app (Phase S3): record the attempt when the results screen shows.
    useEffect(() => {
        if (finished) onComplete?.({ score, maxScore: total });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); if (answered) handleNext(); }
            if (e.code === 'KeyP')  setShowQuestion(o => !o);
            if (e.code === 'KeyF')  toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answered, currentIndex]);

    function handleChoose(option) {
        if (answered) return;
        setChosen(option);
        setAnswers(prev => [...prev, option === question.answer]);
    }

    function handleNext() {
        if (currentIndex + 1 >= total) setFinished(true);
        else setCurrentIndex(i => i + 1);
    }

    function handleRestart() { setCurrentIndex(0); setAnswers([]); setChosen(null); setFinished(false); }

    if (light) {
        const frame = {
            eyebrow: 'Reading', title: activity.topic || 'Read and answer',
            onSave: hideSave ? undefined : () => setShowSave(true),
            isFullscreen, onFullscreen: toggleFullscreen, onClose,
            overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
        };
        if (finished || !question) {
            return (
                <LightFrame {...frame}>
                    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
                        <section className={`${LIGHT.card} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="Results">
                            <p className={LIGHT.eyebrow}>All done</p>
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
        const hasEvidence = question.evidence && activity.passage.includes(question.evidence);
        return (
            <LightFrame {...frame} extra={<span className="hidden sm:flex items-center gap-4"><LightProgress index={currentIndex} total={total} /><span className="text-[15px] font-semibold">Score {score}</span></span>}>
                <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
                    <section aria-label="Text" className={`${LIGHT.card} p-5 sm:p-8`}>
                        <p className={`${LIGHT.eyebrow} mb-3`}>Read the text</p>
                        <p className={`${L_TEXT_SIZES[fontSizeIdx]} leading-relaxed whitespace-pre-line`}>
                            <LightPassage passage={activity.passage} evidence={answered ? question.evidence : null} />
                        </p>
                    </section>

                    <section aria-label="Question" className={`${LIGHT.card} p-5 sm:p-8 flex flex-col gap-5 lg:sticky lg:top-6`}>
                        <p className={LIGHT.eyebrow}>Question {currentIndex + 1} of {total}<span className="sm:hidden"> · score {score}</span></p>
                        <h1 className={`font-display ${L_Q_SIZES[fontSizeIdx]} font-semibold leading-snug`}>{question.text}</h1>
                        <div role="group" aria-label="Options" className="flex flex-col gap-3">
                            {question.options.map((opt, oi) => {
                                let box = 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] font-medium cursor-pointer';
                                let chip = 'bg-[#F1F2F5] text-[#4A5163]';
                                if (answered && opt === question.answer) { box = `${LIGHT.right} cursor-default`; chip = LIGHT.rightChip; }
                                else if (answered && opt === chosen) { box = `${LIGHT.wrong} cursor-default`; chip = LIGHT.wrongChip; }
                                else if (answered) box = 'border border-[#DDE1E8] bg-white opacity-60 cursor-default';
                                return (
                                    <button key={oi} type="button" onClick={() => handleChoose(opt)} disabled={answered}
                                        className={`${box} ${L_OPT_SIZES[fontSizeIdx]} min-h-14 w-full text-left flex items-center gap-4 px-4 py-3 rounded-[14px] text-[#271D62]`}>
                                        <span className={`${chip} shrink-0 w-8 h-8 rounded-[10px] grid place-items-center text-[14px] font-semibold`}>{LETTERS[oi]}</span>
                                        <span className="min-w-0 break-words">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {answered && (
                            <p role="status" className={`rounded-xl px-4 sm:px-5 py-3.5 text-[17px] sm:text-[19px] leading-snug ${isCorrect ? 'bg-[#E5F4EC] text-[#14532D]' : 'bg-[#FDECEA] text-[#7F1D1D]'}`}>
                                <span className="font-semibold">{isCorrect ? 'Right! ' : `Not quite. The answer is “${question.answer}”. `}</span>
                                {question.explanation}
                                {hasEvidence && <span className="block mt-1 text-[15px] opacity-80">The line is highlighted in the text.</span>}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <button type="button" onClick={handleNext} disabled={!answered} className={LIGHT.primary}>
                                {!answered ? 'Choose an answer' : currentIndex + 1 >= total ? 'See results' : 'Next question'}
                            </button>
                        </div>
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
                    <p className="text-2xl"><span className="text-yellow-400 font-bold">{score}</span> out of <span className="font-bold">{total}</span> correct</p>
                    <p className="text-xl text-gray-300">{pct}%</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => { setCurrentIndex(0); setAnswers([]); setChosen(null); setFinished(false); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Try Again</button>
                        <button onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Close</button>
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
                question" toggle is what tips this one over 390px, unlike most
                other activity headers) so the ✕ never ends up off-viewport. */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-y-2 px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">Question {currentIndex + 1} / {total}</span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">Score: <span className="text-yellow-400">{score}</span></span>
                    <DisplayControls />
                    <button onClick={() => setShowQuestion(o => !o)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Toggle question (P)">
                        {showQuestion ? 'Hide question' : 'Show question'}
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
                straight through passage -> options -> next. On desktop
                (md:flex-row) it's still the split-screen with each panel
                scrolling independently inside a fixed-height row, unchanged. */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-6 md:px-12 py-2 overflow-y-auto md:overflow-hidden">

                {/* Passage panel */}
                <div className={`${showQuestion ? 'md:w-[52%] md:shrink-0' : 'md:flex-1'} bg-white/8 border border-white/15 rounded-2xl p-5 md:overflow-y-auto transition-all duration-300`}>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Reading Passage</p>
                    <p className={`leading-relaxed whitespace-pre-line ${FONT_SIZES[fontSizeIdx]} ${textColor}`}>{activity.passage}</p>
                </div>

                {/* Question + options */}
                {showQuestion && question && (
                    <div className="md:flex-1 flex flex-col justify-center gap-5 md:overflow-y-auto py-2">
                        <h2 className={`font-bold leading-snug drop-shadow-lg ${FONT_SIZES[fontSizeIdx]} ${textColor}`}>{question.text}</h2>

                        <div className="flex flex-col gap-3">
                            {question.options.map((opt, oi) => {
                                const fs = FONT_SIZES[Math.max(0, fontSizeIdx - 1)];
                                let cls = `bg-white/10 border-white/20 text-white/85 hover:bg-white/20 border rounded-xl px-5 py-3 ${fs} font-semibold transition-all duration-150 cursor-pointer text-left`;
                                if (answered) {
                                    if (opt === question.answer) cls = `bg-green-500/30 border-green-400/60 text-green-50 border rounded-xl px-5 py-3 ${fs} font-semibold cursor-default text-left`;
                                    else if (opt === chosen)     cls = `bg-red-500/25 border-red-400/50 text-red-100 line-through border rounded-xl px-5 py-3 ${fs} font-semibold cursor-default text-left`;
                                    else                         cls = `bg-white/5 border-white/10 text-white/30 border rounded-xl px-5 py-3 ${fs} font-semibold cursor-default text-left`;
                                }
                                return (
                                    <button key={oi} onClick={() => handleChoose(opt)} disabled={answered} className={cls}>
                                        <span className="text-white/40 mr-2">{LETTERS[oi]}</span>{opt}
                                    </button>
                                );
                            })}
                        </div>

                        {answered && (
                            <div className={`rounded-xl px-5 py-3 ${FONT_SIZES[Math.max(0, fontSizeIdx - 1)]} leading-relaxed border ${isCorrect ? 'bg-green-500/15 border-green-400/30 text-green-200' : 'bg-red-500/15 border-red-400/30 text-red-200'}`}>
                                <span className="font-semibold">{isCorrect ? '✓ Correct. ' : `✗ The answer is ${question.answer}. `}</span>
                                {question.explanation}
                            </div>
                        )}

                        {answered && (
                            <button onClick={handleNext} className="self-start bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors">
                                {currentIndex + 1 >= total ? 'See Results' : 'Next →'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
