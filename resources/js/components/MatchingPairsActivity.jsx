import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

function shuffle(arr) {
    const a = arr.map((item, i) => ({ item, i }));
    for (let j = a.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [a[j], a[k]] = [a[k], a[j]];
    }
    return a; // [{ item, i: originalIndex }]
}

export default function MatchingPairsActivity({ activity, onClose }) {
    const pairs = activity.pairs;

    // Shuffle definitions once on mount; each entry knows its original pair index
    const shuffledDefs = useMemo(() => shuffle(pairs.map(p => p.definition)), []);

    const [selectedTerm, setSelectedTerm] = useState(null); // original pair index
    const [matched, setMatched]           = useState(new Set()); // original pair indices
    const [wrongTerm, setWrongTerm]       = useState(null);
    const [wrongDef, setWrongDef]         = useState(null);
    const [finished, setFinished]         = useState(false);
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
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
            // Correct match
            const next = new Set([...matched, originalIdx]);
            setMatched(next);
            setSelectedTerm(null);
            if (next.size === pairs.length) setFinished(true);
        } else {
            // Wrong match — flash both red
            setWrongTerm(selectedTerm);
            setWrongDef(shuffledIdx);
            setSelectedTerm(null);
            clearTimeout(wrongTimer.current);
            wrongTimer.current = setTimeout(() => {
                setWrongTerm(null);
                setWrongDef(null);
            }, 600);
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
                        <button
                            onClick={() => { setMatched(new Set()); setSelectedTerm(null); setFinished(false); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer"
                        >
                            Play Again
                        </button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            Close
                        </button>
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
                <span className="text-white/70 text-sm font-medium">
                    {matched.size} / {pairs.length} matched
                </span>
                <div className="flex items-center gap-5">
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
                    <div
                        className="h-1 bg-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${(matched.size / pairs.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-4">
                <div className="w-full max-w-4xl grid grid-cols-2 gap-3">

                    {/* Terms column */}
                    <div className="flex flex-col gap-3">
                        <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-1">{activity.instruction?.split('with')[0].trim() || 'Terms'}</p>
                        {pairs.map((pair, idx) => {
                            const isMatched  = matched.has(idx);
                            const isSelected = selectedTerm === idx;
                            const isWrong    = wrongTerm === idx;

                            let cls = 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 cursor-pointer';
                            if (isMatched) cls = 'bg-green-500/25 border-green-400/50 text-green-300 cursor-default';
                            else if (isSelected) cls = 'bg-blue-500/40 border-blue-400 text-white scale-[1.02]';
                            else if (isWrong) cls = 'bg-red-500/35 border-red-400 text-white';

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleTermClick(idx)}
                                    disabled={isMatched}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all duration-150 ${cls}`}
                                >
                                    {isMatched && <span className="mr-2 text-green-400">✓</span>}
                                    {pair.term}
                                </button>
                            );
                        })}
                    </div>

                    {/* Definitions column (shuffled) */}
                    <div className="flex flex-col gap-3">
                        <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-1">Definitions</p>
                        {shuffledDefs.map(({ item: definition, i: originalIdx }, shuffledIdx) => {
                            const isMatched = matched.has(originalIdx);
                            const isWrong   = wrongDef === shuffledIdx;

                            let cls = 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/40 cursor-pointer';
                            if (isMatched) cls = 'bg-green-500/25 border-green-400/50 text-green-300/80 cursor-default';
                            else if (isWrong) cls = 'bg-red-500/35 border-red-400 text-white';
                            else if (selectedTerm !== null) cls += ' hover:bg-white/25 ring-1 ring-white/20';

                            return (
                                <button
                                    key={shuffledIdx}
                                    onClick={() => handleDefClick(shuffledIdx)}
                                    disabled={isMatched}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150 ${cls}`}
                                >
                                    {isMatched && <span className="mr-2 text-green-400">✓</span>}
                                    {definition}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
