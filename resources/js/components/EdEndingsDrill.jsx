import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import edEndings from '@/data/pronunciation/edEndings.json';
import DrillLoop, { shuffle } from '@/components/DrillLoop';

const SESSION_SIZE = 12;

const CHOICES = edEndings.map(group => ({
    key: group.ending,
    ipa: group.ending,
    example: group.words[0]?.word ?? '',
}));

function modeLabel(mode) {
    return mode === 'mixed' ? 'Mixed (/t/, /d/, /ɪd/)' : `/${mode}/ only`;
}

function buildSession(mode) {
    const pool = mode === 'mixed'
        ? edEndings.flatMap(g => g.words)
        : edEndings.find(g => g.ending === mode).words;

    const items = shuffle(pool)
        .slice(0, SESSION_SIZE)
        .map((w, i) => ({ id: i, audio: w.audio, correctKey: w.ending, word: w.word }));

    return { items, choices: CHOICES };
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
                    ? 'bg-teal-500/30 border-teal-400/60 text-teal-200'
                    : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
        >
            {showRule ? 'Hide Rule' : 'Show Rule'}
        </button>
    );

    return (
        <div className="fixed inset-0 flex flex-col z-50 bg-[#1a1a2e]">
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">-ed Endings Drill</h2>
                    <p className="text-white/40 text-xs">
                        {phase === 'select' && 'Drill all endings mixed, or focus on one at a time'}
                        {phase === 'drilling' && modeLabel(mode)}
                        {phase === 'results' && `${modeLabel(mode)} — results`}
                    </p>
                </div>
                <div className="flex items-center gap-5">
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
                <div className="flex-1 flex items-center justify-center px-8">
                    <div className="flex flex-col gap-4 max-w-2xl w-full">
                        <button
                            onClick={() => startMode('mixed')}
                            className="px-6 py-8 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white text-2xl font-bold transition-all cursor-pointer"
                        >
                            Mixed — all three endings
                        </button>
                        <div className="grid grid-cols-3 gap-4">
                            {edEndings.map(group => (
                                <button
                                    key={group.ending}
                                    onClick={() => startMode(group.ending)}
                                    className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white text-xl font-bold transition-all cursor-pointer"
                                >
                                    /{group.ending}/
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'drilling' && session && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {showRule && (
                        <div className="px-8 py-4 bg-teal-500/10 border-b border-teal-400/20 flex flex-col gap-1.5">
                            {edEndings.map(group => (
                                <p key={group.ending} className="text-teal-200/90 text-sm text-center">
                                    <span className="font-bold">/{group.ending}/</span> — {group.rule}
                                </p>
                            ))}
                        </div>
                    )}
                    <DrillLoop items={session.items} choices={session.choices} onFinish={handleFinish} headerExtra={showRuleBtn} />
                </div>
            )}

            {phase === 'results' && result && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
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
