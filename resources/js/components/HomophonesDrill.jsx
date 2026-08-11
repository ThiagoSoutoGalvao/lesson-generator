import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import homophones from '@/data/pronunciation/homophones.json';
import DrillLoop, { shuffle } from '@/components/DrillLoop';

const SESSION_SIZE = 20;

function modeLabel(mode) {
    return mode === 'mixed' ? 'Mixed — all groups' : mode;
}

// Every group's choice set is just its distinct spellings (2 or 3), each
// captioned with its meaning hint so a teacher can explain a wrong answer
// on the spot. Built once per group rather than per item, since every item
// in a group shares the same choice set regardless of which sentence played.
function buildChoicesForGroup(group) {
    const bySpelling = new Map();
    for (const w of group.words) {
        if (!bySpelling.has(w.spelling)) {
            bySpelling.set(w.spelling, { key: w.spelling, ipa: w.spelling, example: w.hint });
        }
    }
    return [...bySpelling.values()];
}

function buildSession(mode) {
    const groups = mode === 'mixed' ? homophones : homophones.filter(g => g.label === mode);

    const pool = groups.flatMap(group => {
        const choices = buildChoicesForGroup(group);
        return group.words.map(w => ({ ...w, choices }));
    });

    const items = shuffle(pool)
        .slice(0, SESSION_SIZE)
        .map((w, i) => ({ id: i, audio: w.audio, correctKey: w.spelling, word: w.spelling, choices: w.choices }));

    return { items };
}

export default function HomophonesDrill() {
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
                    <h2 className="text-xl font-bold text-white">Homophones Drill</h2>
                    <p className="text-white/50 text-xs">
                        {phase === 'select' && 'Pick a group — hear a sentence, choose the spelling that fits'}
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
                        title={phase === 'select' ? 'Back to Upload (Esc)' : 'Back to groups (Esc)'}
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
                            Mixed — all groups
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {homophones.map(group => (
                                <button
                                    key={group.label}
                                    onClick={() => startMode(group.label)}
                                    className="px-6 py-6 rounded-2xl lg-surface-soft lg-surface-soft-hover border text-white text-xl font-bold transition-all cursor-pointer"
                                >
                                    {group.label}
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
                            Choose Another Group
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
