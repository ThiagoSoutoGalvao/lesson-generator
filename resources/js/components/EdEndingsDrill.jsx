import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import edEndings from '@/data/pronunciation/edEndings.json';
import DrillLoop, { shuffle } from '@/components/DrillLoop';

const SESSION_SIZE = 12;

function modeLabel(mode) {
    return mode === 'mixed' ? 'Mixed (/t/, /d/, /ɪd/)' : `/${mode}/ only`;
}

// Same approach as the Phoneme Drill: the played word itself is one of the
// three choice cards, paired with a randomly picked word from each of the
// other two endings — instead of one fixed anchor word per ending shown for
// the whole session regardless of what's actually playing.
function buildSession(mode) {
    const pool = mode === 'mixed'
        ? edEndings.flatMap(g => g.words)
        : edEndings.find(g => g.ending === mode).words;

    const items = shuffle(pool)
        .slice(0, SESSION_SIZE)
        .map((w, i) => {
            const target = { key: w.word, ipa: w.ending, example: w.word };
            const foils = edEndings
                .filter(g => g.ending !== w.ending)
                .map(g => {
                    const pick = g.words[Math.floor(Math.random() * g.words.length)];
                    return { key: pick.word, ipa: pick.ending, example: pick.word };
                });
            const choices = shuffle([target, ...foils]);
            return { id: i, audio: w.audio, correctKey: w.word, word: w.word, choices };
        });

    return { items };
}

export default function EdEndingsDrill() {
    const navigate = useNavigate();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const [phase, setPhase] = useState('select'); // select | drilling | results
    const [mode, setMode] = useState(null);
    const [session, setSession] = useState(null);
    const [result, setResult] = useState(null);
    const [showRule, setShowRule] = useState(false);

    function backToPronunciation() {
        navigate('/upload', { state: { tab: 'pronunciation' } });
    }

    function startMode(m) {
        setMode(m);
        setSession(buildSession(m));
        setResult(null);
        setShowRule(false);
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

    const showRuleBtn = (
        <button
            onClick={() => setShowRule(r => !r)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                showRule
                    ? 'bg-amber-500/30 border-amber-400/60 text-amber-200'
                    : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
        >
            {showRule ? 'Hide Rule' : 'Show Rule'}
        </button>
    );

    return (
        <div
            className="fixed inset-0 flex flex-col z-50"
            style={{ backgroundImage: "url('/backgrounds/pronunciation.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">-ed Endings Drill</h2>
                    <p className="text-white/50 text-xs">
                        {phase === 'select' && 'Drill all endings mixed, or focus on one at a time'}
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
                        title={phase === 'select' ? 'Back to Upload (Esc)' : 'Back to options (Esc)'}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {phase === 'select' && (
                <div className="relative z-10 flex-1 flex items-center justify-center px-8">
                    <div className="flex flex-col gap-4 max-w-2xl w-full">
                        <button
                            onClick={() => startMode('mixed')}
                            className="px-6 py-8 rounded-2xl lg-surface-soft lg-surface-soft-hover border text-white text-2xl font-bold transition-all cursor-pointer"
                        >
                            Mixed — all three endings
                        </button>
                        <div className="grid grid-cols-3 gap-4">
                            {edEndings.map(group => (
                                <button
                                    key={group.ending}
                                    onClick={() => startMode(group.ending)}
                                    className="px-6 py-6 rounded-2xl lg-surface-soft lg-surface-soft-hover border text-white text-xl font-bold transition-all cursor-pointer"
                                >
                                    /{group.ending}/
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'drilling' && session && (
                <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
                    {showRule && (
                        <div className="px-8 py-6 lg-surface-soft border-b border-amber-400/20 flex flex-col md:flex-row justify-center gap-6">
                            {edEndings.map(group => (
                                <div key={group.ending} className="flex-1 min-w-[220px] flex flex-col items-center gap-2 text-center">
                                    <span className="text-amber-300 text-4xl font-black tracking-wide">/{group.ending}/</span>
                                    <p className="text-amber-100/90 text-base leading-snug max-w-xs">{group.rule}</p>
                                    <div className="flex flex-wrap justify-center gap-2 mt-1">
                                        {group.words.slice(0, 3).map(w => (
                                            <span
                                                key={w.word}
                                                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-500/10 border border-amber-400/30 text-amber-200"
                                            >
                                                {w.word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <DrillLoop items={session.items} onFinish={handleFinish} headerExtra={showRuleBtn} softCards />
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
                            Choose Another Option
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
