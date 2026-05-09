import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const BUBBLE_SIZES = ['text-lg', 'text-xl', 'text-2xl'];
const OPTION_SIZES = ['text-base', 'text-lg', 'text-xl'];
const TEXT_COLORS  = [
    { label: 'White',  cls: 'text-white',     bg: '#ffffff' },
    { label: 'Cream',  cls: 'text-amber-50',  bg: '#fffbeb' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Sky',    cls: 'text-sky-300',    bg: '#7dd3fc' },
    { label: 'Green',  cls: 'text-green-300',  bg: '#86efac' },
];

export default function DialogGapFillActivity({ activity, onClose }) {
    const blanks = activity.dialog
        .map((line, i) => line.blank ? i : null)
        .filter(i => i !== null);

    const [currentBlank, setCurrentBlank] = useState(0);
    const [answers, setAnswers]           = useState({});
    const [selected, setSelected]         = useState(null);
    const [finished, setFinished]         = useState(false);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const [fontSizeIdx, setFontSizeIdx]   = useState(1);
    const [textColor, setTextColor]       = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const scrollRef = useRef(null);

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

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">Gap {currentBlank + 1} / {blanks.length}</span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-white font-semibold text-sm">Score: <span className="text-yellow-400">{score}</span></span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(2, i + 1))} disabled={fontSizeIdx === 2}
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
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Dialog scroll area */}
            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-6 md:px-16 py-4 flex flex-col gap-3">
                {activity.dialog.map((line, i) => lineDisplay(line, i))}
            </div>

            {/* Options + Next */}
            <div className="relative z-10 shrink-0 px-6 md:px-16 py-4 flex flex-col gap-3">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wide">
                    What does {activeLine?.speaker} say?
                </p>
                <div className="flex gap-3">
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
                                className={`${cls} flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border transition-all duration-150`}>
                                <span className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-sm font-bold opacity-80 shrink-0">{letter}</span>
                                <span className={`text-center ${OPTION_SIZES[fontSizeIdx]} font-medium leading-snug${!answered ? ` ${textColor}` : ''}`}>{opt.text}</span>
                            </button>
                        );
                    })}
                </div>
                {answered && (
                    <button onClick={handleNext} className="self-end bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors">
                        {currentBlank + 1 >= blanks.length ? 'See Results' : 'Next →'}
                    </button>
                )}
            </div>
        </div>
    );
}
