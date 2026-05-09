import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

export default function WordFormationActivity({ activity, onClose }) {
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

    // Replace ___ in the sentence with the answer or a styled blank
    function renderSentence(sentence, answer, isRevealed) {
        const parts = sentence.split('___');
        if (parts.length < 2) return <span>{sentence}</span>;
        return (
            <>
                {parts[0]}
                {isRevealed
                    ? <mark className="bg-green-400/25 text-green-300 font-bold rounded px-2 not-italic mx-0.5">{answer}</mark>
                    : <span className="inline-block border-b-2 border-white/50 min-w-[100px] mx-1 text-center text-white/20">___</span>
                }
                {parts.slice(1).join('___')}
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

                    <p className="text-white/45 text-xs uppercase tracking-widest text-center">{activity.instruction}</p>

                    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 overflow-hidden">

                        {/* Root word */}
                        <div className="px-8 py-6 flex items-center justify-center border-b border-white/10">
                            <span className="text-5xl font-black tracking-widest text-white">{item.root}</span>
                        </div>

                        {/* Sentence */}
                        <div className="px-8 py-6">
                            <p className="text-white/45 text-xs uppercase tracking-widest mb-3">Complete the sentence</p>
                            <p className="text-white text-2xl leading-relaxed">
                                {renderSentence(item.sentence, item.answer, revealed)}
                            </p>
                        </div>

                        {/* Word form hint + answer — shown after reveal */}
                        {revealed && (
                            <div className="px-8 py-4 border-t border-white/10 bg-white/5 flex items-center gap-3">
                                <span className="text-white/40 text-xs uppercase tracking-widest">Word class</span>
                                <span className="text-white/70 text-sm font-medium">{item.form}</span>
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
