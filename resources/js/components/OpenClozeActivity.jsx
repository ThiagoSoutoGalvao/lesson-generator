import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

// Cambridge-style Open Cloze: a connected passage with single-word gaps and no
// word bank. Teacher clicks a gap to reveal the answer. Same presentation model
// as ClozeActivity, without the word bank.
export default function OpenClozeActivity({ activity, onClose, onComplete }) {
    const [revealed, setRevealed]      = useState(new Set());
    const [bgUrl, setBgUrl]            = useState(null);
    const [showSave, setShowSave]      = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const processedParts = useMemo(() => {
        let counter = 0;
        return (activity.parts ?? []).map(part =>
            part.blank !== undefined ? { ...part, blankIndex: counter++ } : part
        );
    }, [activity]);

    const totalBlanks = processedParts.filter(p => p.blank !== undefined).length;

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

    // Student app (Phase S4): reveal-only — completion once every blank is revealed.
    const complete = totalBlanks > 0 && revealed.size === totalBlanks;
    useEffect(() => {
        if (complete) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complete]);

    function revealBlank(idx) { setRevealed(r => new Set([...r, idx])); }
    function revealAll() { setRevealed(new Set(Array.from({ length: totalBlanks }, (_, i) => i))); }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">{revealed.size} / {totalBlanks} revealed</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto py-6">

                {activity.instruction && (
                    <p className="text-white/50 text-sm uppercase tracking-widest text-center">{activity.instruction}</p>
                )}

                <div className="max-w-4xl w-full rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 px-8 py-6">
                    <p className={`${textColor} ${FONT_SIZES[fontSizeIdx]} leading-loose`}>
                        {processedParts.map((part, i) => {
                            if (part.text !== undefined) return <span key={i}>{part.text}</span>;
                            const isRev = revealed.has(part.blankIndex);
                            return isRev ? (
                                <mark key={i} className="bg-yellow-400/25 text-yellow-300 font-bold rounded px-1 not-italic">{part.blank}</mark>
                            ) : (
                                <button key={i} onClick={() => revealBlank(part.blankIndex)}
                                    className="inline-block border-b-2 border-white/50 hover:border-white text-white/40 hover:text-white/70 min-w-[64px] text-center transition-colors cursor-pointer mx-0.5"
                                    title="Click to reveal">({part.blankIndex + 1})</button>
                            );
                        })}
                    </p>
                </div>

                {revealed.size < totalBlanks && (
                    <button onClick={revealAll} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Reveal All</button>
                )}
                {totalBlanks > 0 && revealed.size === totalBlanks && (
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Close</button>
                )}
            </div>
        </div>
    );
}
