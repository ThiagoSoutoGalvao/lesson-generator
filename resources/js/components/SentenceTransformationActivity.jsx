import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

export default function SentenceTransformationActivity({ activity, onClose }) {
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
                    Item {index + 1} / {total}
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

                    {/* Instruction */}
                    <p className="text-white/45 text-xs uppercase tracking-widest text-center">{activity.instruction}</p>

                    {/* Card */}
                    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 overflow-hidden">

                        {/* Original sentence */}
                        <div className="px-8 py-6 border-b border-white/10">
                            <p className="text-white/45 text-xs uppercase tracking-widest mb-3">Original</p>
                            <p className="text-white text-2xl leading-snug">{item.original}</p>
                        </div>

                        {/* Key word */}
                        <div className="px-8 py-4 border-b border-white/10 flex items-center gap-3">
                            <p className="text-white/45 text-xs uppercase tracking-widest">Key word</p>
                            <span className="text-yellow-300 font-bold text-lg tracking-widest">{item.key_word}</span>
                        </div>

                        {/* Stem + answer */}
                        <div className="px-8 py-6">
                            <p className="text-white/45 text-xs uppercase tracking-widest mb-3">Complete</p>
                            {revealed ? (
                                <p className="text-green-300 text-2xl leading-snug font-medium">{item.answer}</p>
                            ) : (
                                <p className="text-white text-2xl leading-snug">
                                    {item.stem}{' '}
                                    <span className="border-b-2 border-white/40 text-white/20 pl-2 pr-16">&nbsp;</span>
                                </p>
                            )}
                        </div>
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
