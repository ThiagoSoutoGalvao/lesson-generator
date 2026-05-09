import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const CARD_SIZES  = ['text-sm', 'text-base', 'text-lg'];
const TEXT_COLORS = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Cream',  cls: 'text-amber-50',   bg: '#fffbeb' },
    { label: 'Yellow', cls: 'text-yellow-300',  bg: '#fde047' },
    { label: 'Sky',    cls: 'text-sky-300',     bg: '#7dd3fc' },
    { label: 'Green',  cls: 'text-green-300',   bg: '#86efac' },
];

function shuffle(arr) {
    const a = arr.map((item, i) => ({ item, i }));
    for (let j = a.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [a[j], a[k]] = [a[k], a[j]];
    }
    return a;
}

export default function MatchingPairsActivity({ activity, onClose }) {
    const pairs = activity.pairs;

    const shuffledDefs = useMemo(() => shuffle(pairs.map(p => p.definition)), []);

    const [selectedTerm, setSelectedTerm] = useState(null);
    const [matched, setMatched]           = useState(new Set());
    const [wrongTerm, setWrongTerm]       = useState(null);
    const [wrongDef, setWrongDef]         = useState(null);
    const [finished, setFinished]         = useState(false);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const [fontSizeIdx, setFontSizeIdx]   = useState(1);
    const [textColor, setTextColor]       = useState('text-white');
    const wrongTimer = useRef(null);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

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

    function handleTermClick(pairIdx) {
        if (matched.has(pairIdx)) return;
        setSelectedTerm(prev => prev === pairIdx ? null : pairIdx);
    }

    function handleDefClick(shuffledIdx) {
        const originalIdx = shuffledDefs[shuffledIdx].i;
        if (matched.has(originalIdx)) return;
        if (selectedTerm === null) return;

        if (originalIdx === selectedTerm) {
            const next = new Set([...matched, originalIdx]);
            setMatched(next);
            setSelectedTerm(null);
            if (next.size === pairs.length) setFinished(true);
        } else {
            setWrongTerm(selectedTerm);
            setWrongDef(shuffledIdx);
            setSelectedTerm(null);
            clearTimeout(wrongTimer.current);
            wrongTimer.current = setTimeout(() => { setWrongTerm(null); setWrongDef(null); }, 600);
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
                    <h2 className="text-5xl font-bold">All matched!</h2>
                    <p className="text-xl text-white/60">All {pairs.length} pairs correct</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => { setMatched(new Set()); setSelectedTerm(null); setFinished(false); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Play Again</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/50" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">{matched.size} / {pairs.length} matched</span>
                <div className="flex items-center gap-5">
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
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-green-400 rounded-full transition-all duration-500" style={{ width: `${(matched.size / pairs.length) * 100}%` }} />
                </div>
            </div>

            {/* Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4">
                <div className="min-h-full flex items-center justify-center">
                <div className="w-full max-w-4xl grid grid-cols-2 gap-y-3 gap-x-16">

                    {/* Terms column */}
                    <div className="flex flex-col gap-3">
                        <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-1">{activity.instruction?.split('with')[0].trim() || 'Terms'}</p>
                        {pairs.map((pair, idx) => {
                            const isMatched  = matched.has(idx);
                            const isSelected = selectedTerm === idx;
                            const isWrong    = wrongTerm === idx;

                            let cls = `bg-white/10 border-white/20 ${textColor} hover:bg-white/20 hover:border-white/40 cursor-pointer`;
                            if (isMatched)       cls = 'bg-green-500/25 border-green-400/50 text-green-300 cursor-default';
                            else if (isSelected) cls = `bg-blue-500/40 border-blue-400 ${textColor} scale-[1.02]`;
                            else if (isWrong)    cls = `bg-red-500/35 border-red-400 ${textColor}`;

                            return (
                                <button key={idx} onClick={() => handleTermClick(idx)} disabled={isMatched}
                                    className={`w-full px-4 py-4 rounded-xl border ${CARD_SIZES[fontSizeIdx]} font-semibold text-center flex items-center justify-center min-h-[72px] transition-all duration-150 ${cls}`}>
                                    {isMatched && <span className="mr-2 text-green-400">✓</span>}
                                    {pair.term}
                                </button>
                            );
                        })}
                    </div>

                    {/* Definitions column */}
                    <div className="flex flex-col gap-3">
                        <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-1">Definitions</p>
                        {shuffledDefs.map(({ item: definition, i: originalIdx }, shuffledIdx) => {
                            const isMatched = matched.has(originalIdx);
                            const isWrong   = wrongDef === shuffledIdx;

                            let cls = `bg-white/10 border-white/20 ${textColor} hover:bg-white/20 hover:border-white/40 cursor-pointer`;
                            if (isMatched)    cls = 'bg-green-500/25 border-green-400/50 text-green-300/80 cursor-default';
                            else if (isWrong) cls = `bg-red-500/35 border-red-400 ${textColor}`;
                            else if (selectedTerm !== null) cls += ' hover:bg-white/25 ring-1 ring-white/20';

                            return (
                                <button key={shuffledIdx} onClick={() => handleDefClick(shuffledIdx)} disabled={isMatched}
                                    className={`w-full px-4 py-4 rounded-xl border ${CARD_SIZES[fontSizeIdx]} text-left flex items-center min-h-[72px] transition-all duration-150 ${cls}`}>
                                    {isMatched && <span className="mr-2 shrink-0 text-green-400">✓</span>}
                                    {definition}
                                </button>
                            );
                        })}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
