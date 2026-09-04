import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES  = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const TEXT_COLORS = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Cream',  cls: 'text-amber-50',   bg: '#fffbeb' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Sky',    cls: 'text-sky-300',    bg: '#7dd3fc' },
    { label: 'Green',  cls: 'text-green-300',  bg: '#86efac' },
];

// Cambridge-style Multiple Choice Reading: a passage that stays visible while the
// student works one comprehension question at a time. Same split-panel model as
// TrueFalseActivity, with generic 4-option questions.
export default function McReadingActivity({ activity, onClose }) {
    const questions = activity.questions ?? [];
    const total = questions.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [chosen, setChosen]             = useState(null);
    const [answers, setAnswers]           = useState([]);
    const [finished, setFinished]         = useState(false);
    const [showQuestion, setShowQuestion] = useState(true);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const [fontSizeIdx, setFontSizeIdx]   = useState(2);
    const [textColor, setTextColor]       = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const question  = questions[currentIndex];
    const answered  = chosen !== null;
    const isCorrect = answered && chosen === question?.answer;
    const score     = answers.filter(Boolean).length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => { setChosen(null); }, [currentIndex]);

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

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">Question {currentIndex + 1} / {total}</span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">Score: <span className="text-yellow-400">{score}</span></span>
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
                    <button onClick={() => setShowQuestion(o => !o)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Toggle question (P)">
                        {showQuestion ? 'Hide question' : 'Show question'}
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
                <div className={`${showQuestion ? 'md:w-[52%] shrink-0' : 'flex-1'} bg-white/8 border border-white/15 rounded-2xl p-5 overflow-y-auto transition-all duration-300`}>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Reading Passage</p>
                    <p className={`leading-relaxed whitespace-pre-line ${FONT_SIZES[fontSizeIdx]} ${textColor}`}>{activity.passage}</p>
                </div>

                {/* Question + options */}
                {showQuestion && question && (
                    <div className="flex-1 flex flex-col justify-center gap-5 overflow-y-auto py-2">
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
