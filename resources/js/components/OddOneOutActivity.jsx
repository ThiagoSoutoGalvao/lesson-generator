import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES = ['text-xl', 'text-2xl', 'text-3xl'];

export default function OddOneOutActivity({ activity, onClose }) {
    const [groupIndex, setGroupIndex] = useState(0);
    const [wrongIdx, setWrongIdx]     = useState(null);
    const [revealed, setRevealed]     = useState(false);
    const [finished, setFinished]     = useState(false);
    const [bgUrl, setBgUrl]           = useState(null);
    const [showSave, setShowSave]     = useState(false);
    const [fontSizeIdx, setFontSizeIdx] = useState(1);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const wrongTimer = useRef(null);

    const groups = activity.groups;
    const group  = groups[groupIndex];
    const total  = groups.length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => () => clearTimeout(wrongTimer.current), []);

    function handleGuess(word, idx) {
        if (revealed) return;
        if (word === group.odd_one) {
            setRevealed(true);
        } else {
            setWrongIdx(idx);
            clearTimeout(wrongTimer.current);
            wrongTimer.current = setTimeout(() => setWrongIdx(null), 600);
        }
    }

    function handleReveal() { setRevealed(true); }

    function handleNext() {
        if (groupIndex + 1 >= total) {
            setFinished(true);
        } else {
            setGroupIndex(g => g + 1);
            setRevealed(false);
            setWrongIdx(null);
        }
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">All done!</h2>
                    <p className="text-xl text-white/70">Completed all {total} groups</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => { setGroupIndex(0); setRevealed(false); setFinished(false); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Start Over</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">Group {groupIndex + 1} / {total}</span>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(2, i + 1))} disabled={fontSizeIdx === 2}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Larger text">A+</button>
                    </div>
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(groupIndex / total) * 100}%` }} />
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-8">
                <p className="text-white/50 text-sm uppercase tracking-widest">Which one doesn't belong?</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                    {group.words.map((word, idx) => {
                        const isOdd   = word === group.odd_one;
                        const isWrong = wrongIdx === idx;
                        let tileClass = 'bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 hover:border-white/50 text-white cursor-pointer';

                        if (revealed) {
                            tileClass = isOdd
                                ? 'bg-green-500/40 border-green-400 text-white scale-105'
                                : 'bg-white/5 border-white/10 text-white/30 cursor-default';
                        } else if (isWrong) {
                            tileClass = 'bg-red-500/40 border-red-400 text-white animate-pulse cursor-pointer';
                        }

                        return (
                            <button key={idx} onClick={() => handleGuess(word, idx)} disabled={revealed}
                                className={`rounded-2xl py-8 px-6 ${FONT_SIZES[fontSizeIdx]} font-bold text-center transition-all duration-200 border-2 ${tileClass}`}>
                                {word}
                            </button>
                        );
                    })}
                </div>

                {revealed && (
                    <div className="max-w-lg w-full rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 px-6 py-4 text-center">
                        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Why?</p>
                        <p className="text-white text-base">{group.reason}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    {!revealed && (
                        <button onClick={handleReveal} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Reveal</button>
                    )}
                    {revealed && (
                        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">
                            {groupIndex + 1 < total ? 'Next →' : 'Finish'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
