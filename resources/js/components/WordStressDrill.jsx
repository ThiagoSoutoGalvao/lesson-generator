import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import wordStress from '@/data/pronunciation/wordStress.json';
import DrillLoop, { shuffle } from '@/components/DrillLoop';

const SESSION_SIZE = 20;

function modeLabel(mode) {
    return mode === 'mixed' ? 'Mixed — all categories' : mode;
}

// Renders the word once per syllable, capitalizing whichever syllable that
// choice claims is stressed — e.g. "PHO-to-graph" / "pho-TO-graph" /
// "pho-to-GRAPH". The choice count naturally matches the word's syllable
// count (2–3 here), same adaptive-grid support DrillLoop already has.
function markStress(syllables, stressIndex) {
    return syllables
        .map((syl, i) => (i === stressIndex ? syl.toUpperCase() : syl.toLowerCase()))
        .join('-');
}

function buildSession(mode) {
    const pool = mode === 'mixed'
        ? wordStress.flatMap(g => g.words)
        : wordStress.find(g => g.category === mode).words;

    const items = shuffle(pool)
        .slice(0, SESSION_SIZE)
        .map((w, i) => {
            const choices = w.syllables.map((_, si) => ({
                key: si,
                ipa: markStress(w.syllables, si),
            }));
            return { id: i, audio: w.audio, correctKey: w.stressIndex, word: w.word, choices };
        });

    return { items };
}

export default function WordStressDrill() {
    const navigate = useNavigate();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const [phase, setPhase] = useState('select'); // select | drilling | results
    const [mode, setMode] = useState(null);
    const [session, setSession] = useState(null);
    const [result, setResult] = useState(null);

    function backToPronunciation() {
        navigate('/upload', { state: { tab: 'pronunciation' } });
    }

    function startMode(m) {
        setMode(m);
        setSession(buildSession(m));
        setResult(null);
        setPhase('drilling');
    }

    function handleFinish(score, total) {
        setResult({ score, total });
        setPhase('results');
    }

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'KeyF') toggleFullscreen();
            if (e.code === 'Escape' && !document.fullscreenElement) {
                if (phase === 'select') backToPronunciation();
                else setPhase('select');
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toggleFullscreen, phase]);

    return (
        <div
            className="fixed inset-0 flex flex-col z-50"
            style={{ backgroundImage: "url('/backgrounds/pronunciation.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">Word Stress Drill</h2>
                    <p className="text-white/50 text-xs">
                        {phase === 'select' && 'Pick a category — hear a word, choose which syllable is stressed'}
                        {phase === 'drilling' && modeLabel(mode)}
                        {phase === 'results' && `${modeLabel(mode)} — results`}
                    </p>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={backToPronunciation}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        ← Back
                    </button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button
                        onClick={phase === 'select' ? backToPronunciation : () => setPhase('select')}
                        className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer"
                        title={phase === 'select' ? 'Back to Upload (Esc)' : 'Back to categories (Esc)'}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {phase === 'select' && (
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
                    <div className="flex flex-col gap-4 max-w-2xl w-full mx-auto">
                        <button
                            onClick={() => startMode('mixed')}
                            className="px-6 py-8 rounded-2xl lg-surface-soft lg-surface-soft-hover border text-white text-2xl font-bold transition-all cursor-pointer"
                        >
                            Mixed — all categories
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {wordStress.map(group => (
                                <button
                                    key={group.category}
                                    onClick={() => startMode(group.category)}
                                    className="px-6 py-6 rounded-2xl lg-surface-soft lg-surface-soft-hover border text-white text-lg font-bold transition-all cursor-pointer capitalize"
                                >
                                    {group.category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'drilling' && session && (
                <div className="relative z-10 flex-1 flex flex-col min-h-0">
                    <DrillLoop
                        items={session.items}
                        onFinish={handleFinish}
                        softCards
                        plainBigText
                    />
                </div>
            )}

            {phase === 'results' && result && (
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="text-white/50 text-lg">{modeLabel(mode)}</p>
                    <p className="text-white text-6xl font-bold">{result.score} / {result.total}</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => startMode(mode)}
                            className="px-6 py-3 rounded-xl bg-teal-500/30 border border-teal-400/50 hover:bg-teal-500/40 text-white font-semibold transition-colors cursor-pointer"
                        >
                            Drill Again
                        </button>
                        <button
                            onClick={() => setPhase('select')}
                            className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
                        >
                            Choose Another Category
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
