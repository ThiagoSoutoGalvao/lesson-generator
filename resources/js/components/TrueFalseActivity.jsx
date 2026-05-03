import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const OPTIONS = ['True', 'False', 'Not Given'];
const OPTION_COLORS = {
    True:      { base: 'bg-green-500/20 border-green-400/50 hover:bg-green-500/40 text-green-100',  selected: 'bg-green-500 border-green-400 text-white', correct: 'bg-green-500 border-green-400 text-white' },
    False:     { base: 'bg-red-500/20 border-red-400/50 hover:bg-red-500/40 text-red-100',          selected: 'bg-red-500 border-red-400 text-white',   correct: 'bg-red-500 border-red-400 text-white' },
    'Not Given': { base: 'bg-amber-500/20 border-amber-400/50 hover:bg-amber-500/40 text-amber-100', selected: 'bg-amber-500 border-amber-400 text-white', correct: 'bg-amber-500 border-amber-400 text-white' },
};

export default function TrueFalseActivity({ activity, onClose }) {
    const total   = activity.statements.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [chosen, setChosen]             = useState(null);   // the option the student picked
    const [answers, setAnswers]           = useState([]);     // array of booleans (correct?)
    const [finished, setFinished]         = useState(false);
    const [showPassage, setShowPassage]   = useState(true);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const statement = activity.statements[currentIndex];
    const answered  = chosen !== null;
    const isCorrect = answered && chosen === statement.answer;
    const score     = answers.filter(Boolean).length;

    useEffect(() => {
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
            if (e.code === 'KeyP')  setShowPassage(p => !p);
            if (e.code === 'KeyF')  toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answered, currentIndex]);

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

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
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
                    <button
                        onClick={() => setShowPassage(p => !p)}
                        className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                        title="Toggle passage (P)"
                    >
                        {showPassage ? 'Hide passage' : 'Show passage'}
                    </button>
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-6 md:px-12 py-2 overflow-hidden">

                {/* Passage panel */}
                {showPassage && (
                    <div className="md:w-2/5 shrink-0 bg-white/8 border border-white/15 rounded-2xl p-5 overflow-y-auto">
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Reading Passage</p>
                        <p className="text-white/85 text-sm leading-relaxed">{activity.passage}</p>
                    </div>
                )}

                {/* Statement + options */}
                <div className="flex-1 flex flex-col justify-center gap-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug drop-shadow-lg">
                        {statement.text}
                    </h2>

                    <div className="flex flex-col gap-3">
                        {OPTIONS.map(opt => {
                            const colors = OPTION_COLORS[opt];
                            let cls = `${colors.base} border rounded-xl px-6 py-4 text-lg font-semibold transition-all duration-150 cursor-pointer`;

                            if (answered) {
                                if (opt === statement.answer) cls = `${colors.correct} border rounded-xl px-6 py-4 text-lg font-semibold cursor-default`;
                                else if (opt === chosen)      cls = 'bg-white/10 border border-white/20 text-white/40 line-through rounded-xl px-6 py-4 text-lg font-semibold cursor-default';
                                else                          cls = 'bg-white/5 border border-white/10 text-white/25 rounded-xl px-6 py-4 text-lg font-semibold cursor-default';
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
                        <div className={`rounded-xl px-5 py-3 text-sm leading-relaxed border ${isCorrect ? 'bg-green-500/15 border-green-400/30 text-green-200' : 'bg-red-500/15 border-red-400/30 text-red-200'}`}>
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
            </div>
        </div>
    );
}
