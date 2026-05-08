import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

export default function ErrorCorrectionActivity({ activity, onClose }) {
    const [index, setIndex]       = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [bgUrl, setBgUrl]       = useState(null);
    const [showSave, setShowSave] = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const items = activity.items;
    const item  = items[index];
    const total = items.length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); revealed ? handleNext() : setRevealed(true); }
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, revealed]);

    function handleNext() {
        if (index < total - 1) {
            setIndex(i => i + 1);
            setRevealed(false);
        }
    }

    function handlePrev() {
        if (index > 0) {
            setIndex(i => i - 1);
            setRevealed(false);
        }
    }

    // Split the sentence to highlight the error word
    function renderSentence(sentence, error, correction, isRevealed) {
        const parts = sentence.split(error);
        if (parts.length < 2) return <span>{sentence}</span>;

        return (
            <>
                {parts[0]}
                {isRevealed ? (
                    <>
                        <span className="line-through text-red-400 mx-1">{error}</span>
                        <span className="text-green-300 font-bold mx-1">{correction}</span>
                    </>
                ) : (
                    <span className="border-b-2 border-red-400/60 text-white">{error}</span>
                )}
                {parts.slice(1).join(error)}
            </>
        );
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/50" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">
                    Sentence {index + 1} / {total}
                </span>
                <div className="flex items-center gap-5">
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button
                        onClick={toggleFullscreen}
                        className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                        title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                    >
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-1 bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${((index + 1) / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6">
                <div className="max-w-2xl w-full flex flex-col gap-5">

                    <p className="text-white/45 text-xs uppercase tracking-widest text-center">{activity.instruction}</p>

                    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 overflow-hidden">

                        {/* Sentence */}
                        <div className="px-8 py-8">
                            <p className="text-white text-2xl leading-relaxed text-center">
                                {renderSentence(item.sentence, item.error, item.correction, revealed)}
                            </p>
                        </div>

                        {/* Explanation — shown after reveal */}
                        {revealed && (
                            <div className="px-8 py-5 border-t border-white/10 bg-white/5">
                                <p className="text-white/45 text-xs uppercase tracking-widest mb-2">Why?</p>
                                <p className="text-white/80 text-base">{item.explanation}</p>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={index === 0}
                            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer"
                        >
                            ← Prev
                        </button>
                        {!revealed ? (
                            <button
                                onClick={() => setRevealed(true)}
                                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer"
                            >
                                Reveal
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={index === total - 1}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer"
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
