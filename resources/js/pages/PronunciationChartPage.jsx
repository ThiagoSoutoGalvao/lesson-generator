import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import phonemes from '@/data/pronunciation/phonemes.json';

const SECTION_COLS = { monophthong: 4, diphthong: 5, consonant: 6 };
const SECTION_TITLES = {
    monophthong: 'Monophthongs',
    diphthong: 'Diphthongs',
    consonant: 'Consonants',
};

function bySection(category) {
    return phonemes
        .filter(p => p.category === category)
        .sort((a, b) => a.row - b.row || a.col - b.col);
}

function PhonemeCell({ phoneme, isPlaying, onPlay }) {
    return (
        <button
            onClick={() => onPlay(phoneme)}
            style={{ gridColumn: phoneme.col, gridRow: phoneme.row }}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-3 px-2 transition-all cursor-pointer ${
                isPlaying
                    ? 'bg-teal-500/40 border-teal-300 scale-105'
                    : 'bg-white/8 border-white/15 hover:bg-white/15 hover:border-white/30'
            }`}
        >
            <span className="text-2xl font-semibold text-white">{phoneme.symbol}</span>
            <span className="text-xs text-white/50">{phoneme.example}</span>
        </button>
    );
}

function PhonemeSection({ category, playingSymbol, onPlay }) {
    const items = bySection(category);
    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-white/60 text-sm font-semibold tracking-wide uppercase">{SECTION_TITLES[category]}</h3>
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${SECTION_COLS[category]}, minmax(0, 1fr))` }}
            >
                {items.map(p => (
                    <PhonemeCell key={p.symbol} phoneme={p} isPlaying={playingSymbol === p.symbol} onPlay={onPlay} />
                ))}
            </div>
        </div>
    );
}

export default function PronunciationChartPage() {
    const navigate = useNavigate();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const [playingSymbol, setPlayingSymbol] = useState(null);
    const audioRef = useRef(null);

    function playPhoneme(phoneme) {
        audioRef.current?.pause();
        const audio = new Audio(phoneme.audio);
        audioRef.current = audio;
        setPlayingSymbol(phoneme.symbol);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingSymbol(null);
    }

    function backToPronunciation() {
        navigate('/upload', { state: { tab: 'pronunciation' } });
    }

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'KeyF') toggleFullscreen();
            if (e.code === 'Escape' && !document.fullscreenElement) backToPronunciation();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toggleFullscreen, navigate]);

    return (
        <div className="fixed inset-0 flex flex-col z-50 bg-[#1a1a2e]">
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">Phonemic Chart</h2>
                    <p className="text-white/40 text-xs">Tap a symbol to hear it — British English (RP)</p>
                </div>
                <div className="flex items-center gap-5">
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={backToPronunciation} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer" title="Back to Upload (Esc)">✕</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
                    <PhonemeSection category="monophthong" playingSymbol={playingSymbol} onPlay={playPhoneme} />
                    <PhonemeSection category="diphthong" playingSymbol={playingSymbol} onPlay={playPhoneme} />
                </div>
                <PhonemeSection category="consonant" playingSymbol={playingSymbol} onPlay={playPhoneme} />
            </div>
        </div>
    );
}
