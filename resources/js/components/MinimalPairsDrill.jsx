import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import minimalPairs from '@/data/pronunciation/minimalPairs.json';
import DrillLoop, { shuffle } from '@/components/DrillLoop';

const SESSION_SIZE = 10;

function buildSession(group) {
    const items = shuffle(group.words)
        .slice(0, SESSION_SIZE)
        .map((w, i) => ({ id: i, audio: w.audio, correctKey: w.correctSound, word: w.word }));

    const choices = group.sounds.map(sound => {
        const anchor = group.words.find(w => w.correctSound === sound);
        return { key: sound, ipa: sound, example: anchor ? anchor.word : '' };
    });

    return { items, choices };
}

export default function MinimalPairsDrill() {
    const navigate = useNavigate();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const [phase, setPhase] = useState('select'); // select | drilling | results
    const [session, setSession] = useState(null);
    const [result, setResult] = useState(null);

    function backToPronunciation() {
        navigate('/upload', { state: { tab: 'pronunciation' } });
    }

    function startGroup(group) {
        setSession({ group, ...buildSession(group) });
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
        <div className="fixed inset-0 flex flex-col z-50 bg-[#1a1a2e]">
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">Phoneme Drill</h2>
                    <p className="text-white/40 text-xs">
                        {phase === 'select' && 'Pick a confusable sound pair to drill'}
                        {phase === 'drilling' && session.group.label}
                        {phase === 'results' && `${session.group.label} — results`}
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
                <div className="flex-1 flex items-center justify-center px-8">
                    <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
                        {minimalPairs.map(group => (
                            <button
                                key={group.label}
                                onClick={() => startGroup(group)}
                                className="px-6 py-8 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white text-2xl font-bold transition-all cursor-pointer"
                            >
                                {group.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'drilling' && session && (
                <DrillLoop items={session.items} choices={session.choices} onFinish={handleFinish} />
            )}

            {phase === 'results' && result && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="text-white/50 text-lg">{session.group.label}</p>
                    <p className="text-white text-6xl font-bold">{result.score} / {result.total}</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => startGroup(session.group)}
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
