import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightPhoto, LightProgress, LIGHT } from '@/components/light/LightFrame';

const LABELS = ['A', 'B', 'C', 'D'];
const FONT_SIZES   = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const OPTION_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
// Light layout (Aurora Business): the question is 34px at the default size, answers 22px.
const LIGHT_Q_SIZES   = ['text-[22px] sm:text-2xl', 'text-2xl sm:text-[28px]', 'text-[23px] sm:text-[34px]', 'text-[27px] sm:text-[40px]', 'text-[31px] sm:text-[48px]'];
const LIGHT_OPT_SIZES = ['text-base', 'text-lg', 'text-[19px] sm:text-[22px]', 'text-[22px] sm:text-[26px]', 'text-[26px] sm:text-[30px]'];

export default function QuizActivity({ quiz, onClose, onComplete, hideSave }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    // answers: { [questionIndex]: selectedAnswerIndex }
    const [answers, setAnswers]           = useState({});
    const [finished, setFinished]         = useState(false);
    const [backgrounds, setBackgrounds]   = useState([]);
    const [showSave, setShowSave]         = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below

    const question       = quiz.questions[currentIndex];
    const total          = quiz.questions.length;
    const selectedAnswer = answers[currentIndex] ?? null;
    const answered       = selectedAnswer !== null;
    const score          = Object.entries(answers).filter(
        ([idx, ans]) => quiz.questions[idx]?.answers[ans]?.correct
    ).length;

    useEffect(() => {
        Promise.all(
            quiz.questions.map(q =>
                axios.get('/api/background', { params: { topic: q.keyword || quiz.topic } })
                    .then(({ data }) => data.url)
                    .catch(() => null)
            )
        ).then(urls => setBackgrounds(urls));
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); if (answered && !finished) handleNext(); }
            if (e.code === 'KeyF')  toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answered, finished, currentIndex]);

    // Student app (Phase S3): record the attempt when the results screen shows.
    // Re-fires if the student replays — that's an intentional new attempt.
    useEffect(() => {
        if (finished) onComplete?.({ score, maxScore: total });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function handleAnswer(index) {
        if (answered) return;
        setAnswers(prev => ({ ...prev, [currentIndex]: index }));
    }

    function handleNext() {
        if (currentIndex + 1 >= total) setFinished(true);
        else setCurrentIndex(i => i + 1);
    }

    function handlePrev() {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
    }

    function handleRestart() {
        setCurrentIndex(0);
        setAnswers({});
        setFinished(false);
    }

    const bgUrl = backgrounds[currentIndex] || null;
    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    if (light) {
        return (
            <LightQuiz
                quiz={quiz} question={question} index={currentIndex} total={total} score={score}
                selected={selectedAnswer} answered={answered} finished={finished} photo={bgUrl} sizeIdx={fontSizeIdx}
                onAnswer={handleAnswer} onNext={handleNext} onPrev={handlePrev} onRestart={handleRestart} onClose={onClose}
                onSave={hideSave ? null : () => setShowSave(true)} saving={!hideSave && showSave} onSaved={() => setShowSave(false)}
                isFullscreen={isFullscreen} onFullscreen={toggleFullscreen}
            />
        );
    }

    if (finished) {
        const pct = Math.round((score / total) * 100);
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={bgStyle}>
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Quiz Complete!</h2>
                    <p className="text-2xl">
                        You scored <span className="text-yellow-400 font-bold">{score}</span> out of <span className="font-bold">{total}</span>
                    </p>
                    <p className="text-xl text-gray-300">{pct}%</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Play Again</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {!hideSave && showSave && <SavePanel activity={quiz} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium tracking-wide">
                    Question {currentIndex + 1} / {total}
                </span>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">
                        Score: <span className="text-yellow-400">{score}</span>
                    </span>
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors">✕</button>
                </div>
            </div>

            {/* Question + answers */}
            {/* Top-aligned + scrollable (not centered) so a long question/4
                options can't push Next off-screen on a phone — see
                Claude.md's items-center/justify-center + overflow-y-auto note. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-8 gap-10 overflow-y-auto py-8">
                {quiz.instruction && (
                    <p className="text-white/55 text-base text-center tracking-wide -mb-4">{quiz.instruction}</p>
                )}
                <h2 className={`${FONT_SIZES[fontSizeIdx]} font-bold ${textColor} text-center max-w-3xl leading-snug drop-shadow-lg`}>
                    {question.question}
                </h2>

                {/* Single column on a phone: a 2-column grid sizes each row by
                    its tallest cell, so one long answer forces a short
                    neighbor into a huge matching box — same fix already used
                    by the newer drills (HomophonesDrill, etc). */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
                    {question.answers.map((answer, i) => {
                        let cls = 'bg-white/15 hover:bg-white/25 border-white/25 cursor-pointer';
                        if (answered) {
                            if (answer.correct)          cls = 'bg-green-500 border-green-400 cursor-default';
                            else if (selectedAnswer === i) cls = 'bg-red-500 border-red-400 cursor-default';
                            else                         cls = 'bg-white/8 border-white/15 cursor-default';
                        }
                        const dimmed = answered && !answer.correct && selectedAnswer !== i;
                        return (
                            <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                                className={`${cls} border font-medium ${OPTION_SIZES[fontSizeIdx]} px-6 py-5 rounded-2xl text-left transition-all duration-200 backdrop-blur-sm ${dimmed ? 'text-white/40' : textColor}`}>
                                <span className="text-sm opacity-50 mr-2 font-bold">{LABELS[i]}.</span>
                                {answer.text}
                            </button>
                        );
                    })}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-4">
                    {currentIndex > 0 && (
                        <button onClick={handlePrev}
                            className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors shadow-lg">
                            ← Previous
                        </button>
                    )}
                    {answered && (
                        <button onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl text-lg transition-colors shadow-lg">
                            {currentIndex + 1 >= total ? 'See Results' : 'Next →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Aurora Business light layout (AuroraBusiness.md §4, mockup "Activity · Quiz"): the photo in its own panel beside
// the question (a band above it on a phone), the question on a white card, coral Next. Same state as the dark one.
function LightQuiz({ quiz, question, index, total, score, selected, answered, finished, photo, sizeIdx,
    onAnswer, onNext, onPrev, onRestart, onClose, onSave, saving, onSaved, isFullscreen, onFullscreen }) {
    const frame = {
        eyebrow: 'Quiz', title: quiz.topic || quiz.title || 'Choose the right answer',
        onSave, isFullscreen, onFullscreen, onClose,
        overlay: saving ? <SavePanel activity={quiz} onDone={onSaved} /> : null,
    };

    if (finished) {
        const pct = Math.round((score / total) * 100);
        return (
            <LightFrame {...frame}>
                <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
                    <section className={`${LIGHT.glowCard} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="Results">
                        <p className={LIGHT.chipCenter}>Quiz complete</p>
                        <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-tight">You scored {score} out of {total}</h1>
                        <p className="text-[20px] text-[#4A5163]">{pct}%</p>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            <button type="button" onClick={onRestart} className={LIGHT.primary}>Play again</button>
                            {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                        </div>
                    </section>
                </div>
            </LightFrame>
        );
    }

    const right = answered && question.answers[selected]?.correct;
    const correctText = question.answers.find(a => a.correct)?.text;
    return (
        <LightFrame {...frame} extra={<span className="hidden sm:flex"><LightProgress index={index} total={total} /></span>}>
            <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 sm:gap-8">
                <LightPhoto url={photo} className="h-[150px] sm:h-[220px] lg:h-auto lg:min-h-[480px] lg:w-[420px] lg:shrink-0" />

                <section className={`${LIGHT.card} flex-1 min-w-0 p-5 sm:p-10 flex flex-col gap-5 sm:gap-6`} aria-label="Question">
                    <p className={LIGHT.chip}><span className="sm:hidden">Question {index + 1} of {total} · </span>{quiz.instruction || 'Choose the right answer'}</p>
                    <h1 className={`font-display ${LIGHT_Q_SIZES[sizeIdx]} font-semibold leading-snug`}>{question.question}</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {question.answers.map((answer, i) => {
                            let box = 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] font-medium';
                            let chip = 'bg-[#F1F2F5] text-[#4A5163]';
                            if (answered && answer.correct) { box = LIGHT.right; chip = LIGHT.rightChip; }
                            else if (answered && selected === i) { box = LIGHT.wrong; chip = LIGHT.wrongChip; }
                            else if (answered) box = 'border border-[#DDE1E8] bg-white opacity-70';
                            return (
                                <button key={i} type="button" onClick={() => onAnswer(i)} disabled={answered}
                                    className={`${box} ${LIGHT_OPT_SIZES[sizeIdx]} min-h-14 sm:min-h-[76px] w-full text-left flex items-center gap-4 px-4 sm:px-5 py-3 rounded-[14px] text-[#271D62] ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                                    <span className={`${chip} shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] grid place-items-center text-[14px] sm:text-[16px] font-semibold`}>{LABELS[i]}</span>
                                    <span className="min-w-0 break-words">{answer.text}</span>
                                </button>
                            );
                        })}
                    </div>

                    {answered && (
                        <p role="status" className={`rounded-xl px-4 sm:px-5 py-3.5 text-[17px] sm:text-[20px] leading-snug ${right ? 'bg-[#E5F4EC] text-[#14532D]' : 'bg-[#FDECEA] text-[#7F1D1D]'}`}>
                            {right ? 'Right!' : `Not quite. The answer is “${correctText}”.`}
                        </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-2">
                        {index > 0 && <button type="button" onClick={onPrev} className={LIGHT.secondary}>← Previous</button>}
                        <button type="button" onClick={onNext} disabled={!answered} className={LIGHT.primary}>
                            {!answered ? 'Choose an answer' : index + 1 >= total ? 'See results' : 'Next question'}
                        </button>
                    </div>
                    <p className="sr-only" aria-live="polite">Score {score} of {total}</p>
                </section>
            </div>
        </LightFrame>
    );
}
