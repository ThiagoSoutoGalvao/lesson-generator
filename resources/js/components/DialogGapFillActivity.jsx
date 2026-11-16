import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightPhoto, LIGHT } from '@/components/light/LightFrame';

const BUBBLE_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const OPTION_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const L_BUBBLE_SIZES = ['text-[15px]', 'text-base sm:text-[17px]', 'text-[17px] sm:text-xl', 'text-lg sm:text-2xl', 'text-xl sm:text-[28px]'];
const L_OPTION_SIZES = ['text-[15px]', 'text-base sm:text-[17px]', 'text-[17px] sm:text-[19px]', 'text-lg sm:text-[22px]', 'text-xl sm:text-[26px]'];

export default function DialogGapFillActivity({ activity, onClose, onComplete, hideSave }) {
    const blanks = activity.dialog
        .map((line, i) => line.blank ? i : null)
        .filter(i => i !== null);

    const [currentBlank, setCurrentBlank] = useState(0);
    const [answers, setAnswers]           = useState({});
    const [selected, setSelected]         = useState(null);
    const [finished, setFinished]         = useState(false);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const scrollRef = useRef(null);
    const light = useIsLightUi(); // Aurora Business: the light layout below

    const activeDialogIndex = blanks[currentBlank];
    const activeLine        = activity.dialog[activeDialogIndex];
    const answered          = selected !== null;
    const score             = Object.values(answers).filter(a => a.correct).length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [currentBlank]);

    // Student app (Phase S3): record the attempt when the results screen shows.
    useEffect(() => {
        if (finished) onComplete?.({ score, maxScore: blanks.length });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); if (answered) handleNext(); }
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answered, currentBlank, finished]);

    function handleChoose(optionIndex) {
        if (answered) return;
        const correct = activeLine.options[optionIndex].correct;
        setSelected(optionIndex);
        setAnswers(prev => ({ ...prev, [activeDialogIndex]: { chosen: optionIndex, correct } }));
    }

    function handleRestart() {
        setCurrentBlank(0);
        setAnswers({});
        setSelected(null);
        setFinished(false);
    }

    function handleNext() {
        if (currentBlank + 1 >= blanks.length) {
            setFinished(true);
        } else {
            setCurrentBlank(i => i + 1);
            setSelected(null);
        }
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' };

    const speakers = [...new Set(activity.dialog.map(l => l.speaker))];

    function lineDisplay(line, i) {
        const isRight    = i === activeDialogIndex;
        const answerData = answers[i];
        const isSecond   = line.speaker === speakers[1];

        let content;
        if (!line.blank) {
            content = <span className={textColor}>{line.line}</span>;
        } else if (answerData) {
            const wasCorrect = answerData.correct;
            content = (
                <span className={wasCorrect ? 'text-green-300' : 'text-red-300'}>
                    {wasCorrect ? '✓ ' : '✗ '}
                    {line.line}
                    {!wasCorrect && <span className="block text-xs text-green-300/80 mt-0.5">✓ {line.line}</span>}
                </span>
            );
        } else if (isRight) {
            content = <span className="italic text-white/50 animate-pulse">▢ Choose below…</span>;
        } else {
            content = <span className="italic text-white/30">___</span>;
        }

        return (
            <div key={i} className={`flex flex-col ${isSecond ? 'items-end' : 'items-start'} gap-0.5`}>
                <span className="text-xs font-semibold text-white/40 px-1">{line.speaker}</span>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${BUBBLE_SIZES[fontSizeIdx]} leading-snug shadow
                    ${isSecond ? 'bg-blue-600/70 text-white rounded-tr-sm' : 'bg-white/15 text-white rounded-tl-sm'}
                    ${isRight ? 'ring-2 ring-yellow-400/70' : ''}
                `}>
                    {content}
                </div>
            </div>
        );
    }

    // Aurora Business light layout (2026-11-16): the conversation on the left in a white card (chat bubbles, the gap
    // being answered ringed in coral), the question + options + Next on the right with the scene photo in its own panel
    // above them (never behind text; hidden on a phone to keep the options near the dialogue). On a phone the two stack
    // and the page scrolls (LightFrame's main) — only the desktop dialogue card scrolls on its own. Same logic, scoring
    // and keys (Space next, F fullscreen) as the dark one.
    if (light) {
        const frame = children => (
            <LightFrame
                eyebrow={finished ? 'Dialogue gap-fill' : `Dialogue gap-fill · gap ${currentBlank + 1} of ${blanks.length} · score ${score}`} title={activity.topic}
                onSave={hideSave ? null : () => setShowSave(true)} isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={!hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null}
            >
                {children}
            </LightFrame>
        );
        if (finished) {
            return frame(
                <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-5">
                    <div className={`${LIGHT.card} px-6 py-8 text-center`}>
                        <h2 className="font-display text-3xl sm:text-4xl font-semibold">Dialogue complete!</h2>
                        <p className={`${LIGHT.muted} text-lg mt-2`}>{score} of {blanks.length} correct</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={handleRestart} className={LIGHT.secondary}>Play again</button>
                        <button type="button" onClick={onClose} className={LIGHT.primary}>Close</button>
                    </div>
                </div>
            );
        }
        const bubble = (line, i) => {
            const isActive = i === activeDialogIndex && !answered;
            const a = answers[i];
            const second = line.speaker === speakers[1];
            let body;
            if (!line.blank || (a && a.correct)) {
                body = <span>{a?.correct && <span className="text-[#1E7A4C] font-bold" aria-label="correct">✓ </span>}{line.line}</span>;
            } else if (a) {
                body = (
                    <span>
                        <span className="block line-through text-[#B42318]"><span aria-label="wrong">✗ </span>{line.options[a.chosen]?.text}</span>
                        <span className="block text-[#1E7A4C] font-semibold mt-1">✓ {line.line}</span>
                    </span>
                );
            } else if (i === activeDialogIndex) {
                body = <span className="italic text-[#4A5163]">Choose the line →</span>;
            } else {
                body = <span className="text-[#8A90A0]">_____</span>;
            }
            return (
                <div key={i} className={`flex flex-col gap-1 ${second ? 'items-end' : 'items-start'}`}>
                    <span className="text-[13px] font-semibold text-[#4A5163] px-1">{line.speaker}</span>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${L_BUBBLE_SIZES[fontSizeIdx]} leading-snug text-[#271D62] ${
                        second ? 'bg-[#EEEDF8] border border-[#D9D6EE] rounded-tr-md' : 'bg-white border border-[#DDE1E8] rounded-tl-md'
                    } ${isActive ? 'ring-[3px] ring-[#E0521F] border-transparent' : ''}`}>{body}</div>
                </div>
            );
        };
        return frame(
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 sm:py-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 sm:gap-6 md:h-full">
                <section ref={scrollRef} aria-label="Dialogue"
                    className={`${LIGHT.card} bg-[#FAFBFC] p-4 sm:p-5 flex flex-col gap-3 md:min-h-0 md:overflow-y-auto`}>
                    {activity.dialog.map((line, i) => bubble(line, i))}
                </section>
                <div className="flex flex-col gap-4 min-w-0 md:min-h-0">
                    <LightPhoto url={bgUrl} className="hidden sm:block h-[160px] md:h-auto md:flex-1 md:min-h-[140px] md:max-h-[300px]" />
                    <p className={`${LIGHT.eyebrow} !normal-case !tracking-normal`}>What does {activeLine?.speaker} say?</p>
                    <div className="flex flex-col gap-3" role="group" aria-label="Options">
                        {activeLine?.options.map((opt, i) => {
                            let cls = 'bg-white border border-[#DDE1E8] hover:border-[#E0521F] hover:bg-[#FFF8F5] cursor-pointer';
                            let chip = 'border border-[#C6CCD6] text-[#4A5163]';
                            if (answered) {
                                if (opt.correct)         { cls = `${LIGHT.right} cursor-default`; chip = LIGHT.rightChip; }
                                else if (selected === i) { cls = `${LIGHT.wrong} cursor-default`; chip = LIGHT.wrongChip; }
                                else                     { cls = 'bg-white border border-[#E6E9EE] opacity-60 cursor-default'; }
                            }
                            return (
                                <button key={i} type="button" onClick={() => handleChoose(i)} disabled={answered}
                                    className={`${cls} w-full flex items-center gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl text-left text-[#271D62] transition-colors`}>
                                    <span className={`w-9 h-9 rounded-full grid place-items-center text-sm font-bold shrink-0 ${chip}`}>{String.fromCharCode(65 + i)}</span>
                                    <span className={`flex-1 ${L_OPTION_SIZES[fontSizeIdx]} font-medium leading-snug`}>{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-end min-h-12 sm:min-h-14">
                        {answered && (
                            <button type="button" onClick={handleNext} className={LIGHT.primary}>
                                {currentBlank + 1 >= blanks.length ? 'See results' : 'Next gap'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (finished) {
        const pct = Math.round((score / blanks.length) * 100);
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={bgStyle}>
                <div className="absolute inset-0 bg-black/65" />
                <div className="relative z-10 text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Dialog Complete!</h2>
                    <p className="text-2xl">You got <span className="text-yellow-400 font-bold">{score}</span> out of <span className="font-bold">{blanks.length}</span></p>
                    <p className="text-xl text-gray-300">{pct}%</p>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/65" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">Gap {currentBlank + 1} / {blanks.length}</span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">Score: <span className="text-yellow-400">{score}</span></span>
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-6 md:px-12 py-2 overflow-hidden">

                {/* Dialog panel */}
                <div ref={scrollRef} className="md:w-[52%] shrink-0 bg-white/8 border border-white/15 rounded-2xl p-5 overflow-y-auto flex flex-col gap-3">
                    {activity.dialog.map((line, i) => lineDisplay(line, i))}
                </div>

                {/* Options + Next */}
                <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wide">
                        What does {activeLine?.speaker} say?
                    </p>
                    <div className="flex flex-col gap-3">
                        {activeLine?.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            let cls = 'bg-white/10 hover:bg-white/18 text-white border border-white/20 cursor-pointer';
                            if (answered) {
                                if (opt.correct)          cls = 'bg-green-500 text-white border-green-400 cursor-default';
                                else if (selected === i)  cls = 'bg-red-500 text-white border-red-400 cursor-default';
                                else                      cls = 'bg-white/5 text-white/30 border-white/10 cursor-default';
                            }
                            return (
                                <button key={i} onClick={() => handleChoose(i)} disabled={answered}
                                    className={`${cls} w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-150`}>
                                    <span className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-sm font-bold opacity-80 shrink-0">{letter}</span>
                                    <span className={`text-left flex-1 ${OPTION_SIZES[fontSizeIdx]} font-medium leading-snug${!answered ? ` ${textColor}` : ''}`}>{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                    {answered && (
                        <button onClick={handleNext} className="self-start bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors">
                            {currentBlank + 1 >= blanks.length ? 'See Results' : 'Next →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
