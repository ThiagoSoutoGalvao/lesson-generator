import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function ImageVocabMatchActivity({ activity, onClose }) {
    const pairs = activity.pairs;
    const total = pairs.length;

    const [imageUrls, setImageUrls] = useState(Array(total).fill(null));
    const [wordOrder, setWordOrder] = useState(() => shuffle(pairs.map((_, i) => i)));
    const [revealed, setRevealed]   = useState(false);
    const [showSave, setShowSave]   = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    useEffect(() => {
        Promise.all(
            pairs.map(pair =>
                axios.get('/api/background', { params: { topic: pair.keyword } })
                    .then(({ data }) => data.url)
                    .catch(() => null)
            )
        ).then(urls => setImageUrls(urls));
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'KeyR') setRevealed(r => !r);
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function handleReset() {
        setWordOrder(shuffle(pairs.map((_, i) => i)));
        setRevealed(false);
    }

    const gridCols = total <= 4 ? 'grid-cols-2' : total <= 6 ? 'grid-cols-3' : 'grid-cols-4';
    const bgStyle  = { background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/65" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setRevealed(r => !r)}
                        className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                            revealed
                                ? 'bg-green-500/20 border-green-400/50 text-green-300 hover:bg-green-500/30'
                                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
                        }`}
                        title="Toggle answers (R)"
                    >
                        {revealed ? 'Hide answers' : 'Reveal (R)'}
                    </button>
                    <button onClick={handleReset} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Reset</button>
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Word tiles — display only, shuffled */}
            <div className="relative z-10 px-6 pt-1 pb-3 flex flex-wrap gap-2 justify-center shrink-0">
                {wordOrder.map(originalIdx => (
                    <span
                        key={originalIdx}
                        className="px-4 py-2 rounded-xl font-semibold text-base bg-white/10 border border-white/20 text-white select-none"
                    >
                        {pairs[originalIdx].word}
                    </span>
                ))}
            </div>

            {/* Image grid */}
            <div className={`relative z-10 flex-1 grid ${gridCols} gap-3 px-6 pb-4 overflow-hidden`}>
                {pairs.map((pair, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/15">
                        {imageUrls[idx]
                            ? <img src={imageUrls[idx]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-white/10 animate-pulse" />
                        }
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Number badge */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white font-bold text-sm w-7 h-7 rounded-lg flex items-center justify-center">
                            {idx + 1}
                        </div>

                        {/* Word overlay on reveal */}
                        {revealed && (
                            <div className="absolute inset-0 flex items-end justify-center pb-3">
                                <span className="bg-green-500 text-white font-bold px-4 py-1.5 rounded-xl text-sm shadow-lg">
                                    {pair.word}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
