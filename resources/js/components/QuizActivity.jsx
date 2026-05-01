import { useEffect, useState } from 'react';
import axios from 'axios';

const TIMER_SECONDS = 30;
const LABELS = ['A', 'B', 'C', 'D'];

export default function QuizActivity({ quiz, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [finished, setFinished] = useState(false);
    const [backgrounds, setBackgrounds] = useState([]);

    const question = quiz.questions[currentIndex];
    const total = quiz.questions.length;
    const answered = selectedAnswer !== null;

    useEffect(() => {
        Promise.all(
            quiz.questions.map(q =>
                axios.get('/api/background', { params: { topic: q.keyword || quiz.topic } })
                    .then(({ data }) => data.url)
                    .catch(() => null)
            )
        ).then(urls => setBackgrounds(urls));
    }, []);

    // Countdown timer — chains via dependency on timeLeft
    useEffect(() => {
        if (answered || finished) return;
        if (timeLeft <= 0) {
            setSelectedAnswer(-1); // -1 = time expired, no selection
            return;
        }
        const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [timeLeft, answered, finished]);

    // Reset state when moving to a new question
    useEffect(() => {
        setSelectedAnswer(null);
        setTimeLeft(TIMER_SECONDS);
    }, [currentIndex]);

    function handleAnswer(index) {
        if (answered) return;
        setSelectedAnswer(index);
        if (question.answers[index].correct) {
            setScore(s => s + 1);
        }
    }

    function handleNext() {
        if (currentIndex + 1 >= total) {
            setFinished(true);
        } else {
            setCurrentIndex(i => i + 1);
        }
    }

    function handleRestart() {
        setCurrentIndex(0);
        setScore(0);
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
                        You scored{' '}
                        <span className="text-yellow-400 font-bold">{score}</span>
                        {' '}out of{' '}
                        <span className="font-bold">{total}</span>
                    </p>
                    <p className="text-xl text-gray-300">{pct}%</p>
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={handleRestart}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors"
                        >
                            Play Again
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
            <div className="absolute inset-0 bg-black/55" />

            {/* Header bar */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium tracking-wide">
                    Question {currentIndex + 1} / {total}
                </span>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">
                        Score: <span className="text-yellow-400">{score}</span>
                    </span>
                    <span
                        className={`font-bold px-3 py-1 rounded-full text-sm tabular-nums ${
                            timeLeft <= 10
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-white/20 text-white'
                        }`}
                    >
                        {timeLeft}s
                    </span>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Question + answers */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white text-center max-w-3xl leading-snug drop-shadow-lg">
                    {question.question}
                </h2>

                {selectedAnswer === -1 && (
                    <p className="text-red-400 font-semibold text-lg -mt-4">Time's up!</p>
                )}

                <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
                    {question.answers.map((answer, i) => {
                        let cls = 'bg-white/15 hover:bg-white/25 text-white border border-white/25 cursor-pointer';
                        if (answered) {
                            if (answer.correct) {
                                cls = 'bg-green-500 text-white border border-green-400 cursor-default';
                            } else if (selectedAnswer === i) {
                                cls = 'bg-red-500 text-white border border-red-400 cursor-default';
                            } else {
                                cls = 'bg-white/8 text-white/40 border border-white/15 cursor-default';
                            }
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(i)}
                                disabled={answered}
                                className={`${cls} font-medium text-lg px-6 py-5 rounded-2xl text-left transition-all duration-200 backdrop-blur-sm`}
                            >
                                <span className="text-sm opacity-50 mr-2 font-bold">{LABELS[i]}.</span>
                                {answer.text}
                            </button>
                        );
                    })}
                </div>

                {answered && (
                    <button
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl text-lg transition-colors shadow-lg"
                    >
                        {currentIndex + 1 >= total ? 'See Results' : 'Next →'}
                    </button>
                )}
            </div>
        </div>
    );
}
