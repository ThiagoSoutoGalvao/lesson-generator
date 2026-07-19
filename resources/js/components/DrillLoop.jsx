import { useEffect, useRef, useState } from 'react';

export function shuffle(arr) {
    const a = [...arr];
    for (let j = a.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [a[j], a[k]] = [a[k], a[j]];
    }
    return a;
}

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Shared drill loop: progress counter, play button, choice cards with
 * correct/incorrect flash and auto-advance. Used by both the phoneme
 * (minimal pairs) drill and the -ed endings drill — they differ only in
 * how many choices are passed in and what headerExtra renders.
 */
export default function DrillLoop({ items, choices, onFinish, headerExtra }) {
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState(null); // null | 'correct' | 'wrong'
    const [selectedKey, setSelectedKey] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const timerRef = useRef(null);

    const item = items[index];
    const total = items.length;

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
            clearTimeout(timerRef.current);
        };
    }, []);

    function playAudio() {
        audioRef.current?.pause();
        const audio = new Audio(item.audio);
        audioRef.current = audio;
        setIsPlaying(true);
        audio.play().catch(() => {});
        audio.onended = () => setIsPlaying(false);
    }

    function selectChoice(key) {
        if (status !== null) return;
        const correct = key === item.correctKey;
        setSelectedKey(key);
        setStatus(correct ? 'correct' : 'wrong');
        if (correct) setScore(s => s + 1);

        const nextScore = correct ? score + 1 : score;
        timerRef.current = setTimeout(() => {
            audioRef.current?.pause();
            setIsPlaying(false);
            if (index + 1 >= total) {
                onFinish(nextScore, total);
            } else {
                setIndex(i => i + 1);
                setStatus(null);
                setSelectedKey(null);
            }
        }, correct ? 1500 : 2000);
    }

    const gridCols = choices.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
            <div className="flex items-center gap-6">
                <p className="text-white/40 text-sm font-semibold">{index + 1} / {total}</p>
                {headerExtra}
            </div>

            <button
                onClick={playAudio}
                className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl border-2 transition-all cursor-pointer ${
                    isPlaying
                        ? 'bg-teal-500/40 border-teal-300 scale-105'
                        : 'bg-white/10 border-white/25 hover:bg-white/20 hover:border-white/40'
                }`}
                title="Play word"
            >
                🔊
            </button>

            <div className={`grid ${gridCols} gap-4 w-full max-w-2xl`}>
                {choices.map((choice, i) => {
                    const isSelected = selectedKey === choice.key;
                    const isCorrectChoice = choice.key === item.correctKey;

                    let cls = 'bg-white/8 border-white/20 hover:bg-white/15 hover:border-white/35 cursor-pointer';
                    if (status !== null) {
                        if (isSelected && status === 'correct') cls = 'bg-green-500/30 border-green-400 scale-[1.03]';
                        else if (isSelected && status === 'wrong') cls = 'bg-red-500/30 border-red-400';
                        else if (isCorrectChoice) cls = 'bg-green-500/20 border-green-400/60';
                        else cls = 'bg-white/5 border-white/10 opacity-50';
                    }

                    return (
                        <button
                            key={choice.key}
                            onClick={() => selectChoice(choice.key)}
                            disabled={status !== null}
                            className={`flex flex-col items-center gap-2 py-8 rounded-2xl border transition-all duration-150 ${cls}`}
                        >
                            <span className="text-white/50 text-sm font-bold">{LETTERS[i]}</span>
                            <span className="text-white text-4xl font-bold">/{choice.ipa}/</span>
                            <span className="text-white/60 text-sm">{choice.example}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
