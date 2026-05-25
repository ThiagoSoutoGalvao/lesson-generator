import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const LABELS = ['A', 'B', 'C', 'D'];
const FONT_SIZES   = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const OPTION_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const TEXT_COLORS  = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Orange', cls: 'text-orange-400', bg: '#fb923c' },
    { label: 'Red',    cls: 'text-red-400',    bg: '#f87171' },
    { label: 'Cyan',   cls: 'text-cyan-300',   bg: '#67e8f9' },
];

export default function QuizActivity({ quiz, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    // answers: { [questionIndex]: selectedAnswerIndex }
    const [answers, setAnswers]           = useState({});
    const [finished, setFinished]         = useState(false);
    const [backgrounds, setBackgrounds]   = useState([]);
    const [showSave, setShowSave]         = useState(false);
    const [fontSizeIdx, setFontSizeIdx]   = useState(1);
    const [textColor, setTextColor]       = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

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

            {showSave && <SavePanel activity={quiz} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium tracking-wide">
                    Question {currentIndex + 1} / {total}
                </span>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">
                        Score: <span className="text-yellow-400">{score}</span>
                    </span>
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
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors">✕</button>
                </div>
            </div>

            {/* Question + answers */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-10">
                {quiz.instruction && (
                    <p className="text-white/55 text-base text-center tracking-wide -mb-4">{quiz.instruction}</p>
                )}
                <h2 className={`${FONT_SIZES[fontSizeIdx]} font-bold ${textColor} text-center max-w-3xl leading-snug drop-shadow-lg`}>
                    {question.question}
                </h2>

                <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
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
