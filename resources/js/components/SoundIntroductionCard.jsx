import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import soundCards from '@/data/pronunciation/soundCards.json';

export default function SoundIntroductionCard() {
    const navigate = useNavigate();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const [index, setIndex] = useState(0);
    const [playingWord, setPlayingWord] = useState(null);
    const audioRef = useRef(null);

    const card = soundCards[index];
    const atStart = index === 0;
    const atEnd = index === soundCards.length - 1;

    function backToPronunciation() {
        navigate('/upload', { state: { tab: 'pronunciation' } });
    }

    function goPrev() { setIndex(i => Math.max(0, i - 1)); }
    function goNext() { setIndex(i => Math.min(soundCards.length - 1, i + 1)); }

    function playWord(word) {
        audioRef.current?.pause();
        const audio = new Audio(word.audio);
        audioRef.current = audio;
        setPlayingWord(word.word);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingWord(null);
    }

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'KeyF') toggleFullscreen();
            if (e.code === 'Escape' && !document.fullscreenElement) backToPronunciation();
            if (e.code === 'ArrowLeft') goPrev();
            if (e.code === 'ArrowRight') goNext();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toggleFullscreen, navigate, index]);

    return (
        <div className="fixed inset-0 flex flex-col z-50 bg-[#1a1a2e]">
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">Sound Introduction</h2>
                    <p className="text-white/40 text-xs">{index + 1} / {soundCards.length}</p>
                </div>
                <div className="flex items-center gap-5">
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={backToPronunciation} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer" title="Back to Upload (Esc)">✕</button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-6 px-8">
                <button
                    onClick={goPrev}
                    disabled={atStart}
                    className="text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-4xl px-2 transition-colors cursor-pointer"
                    title="Previous (←)"
                >
                    ‹
                </button>

                <div className="flex flex-col items-center gap-6 max-w-lg w-full">
                    <div className="text-9xl font-bold text-white">{card.symbol}</div>
                    <div className="text-teal-300 text-sm font-semibold uppercase tracking-wide">{card.category}</div>
                    <p className="text-white/70 text-center text-base">{card.mouthPosition}</p>

                    <div className="grid grid-cols-3 gap-3 w-full">
                        {card.exampleWords.map(w => (
                            <button
                                key={w.word}
                                onClick={() => playWord(w)}
                                className={`flex flex-col items-center gap-1 py-4 rounded-xl border transition-all cursor-pointer ${
                                    playingWord === w.word
                                        ? 'bg-teal-500/40 border-teal-300 scale-105'
                                        : 'bg-white/8 border-white/15 hover:bg-white/15 hover:border-white/30'
                                }`}
                            >
                                <span className="text-lg">🔊</span>
                                <span className="text-white text-sm font-medium">{w.word}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={goNext}
                    disabled={atEnd}
                    className="text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-4xl px-2 transition-colors cursor-pointer"
                    title="Next (→)"
                >
                    ›
                </button>
            </div>
        </div>
    );
}
