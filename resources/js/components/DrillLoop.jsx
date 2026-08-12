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
 * correct/incorrect flash and auto-advance. Used by the phoneme (minimal
 * pairs) drill, the -ed endings drill, the word stress drill, the
 * homophones drill, and the silent letters drill — they differ only in how
 * many choices are passed in, what headerExtra renders, and (word stress /
 * homophones / silent letters) whether the big choice label is plain text
 * instead of IPA wrapped in slashes.
 *
 * Answers are stored per item index (same pattern as QuizActivity.jsx) so a
 * "← Previous" button can step back through already-answered items and show
 * their outcome again, without allowing the answer to be changed — mirrors
 * Quiz's "navigating back restores answered state" behavior. Score is
 * derived from the stored answers rather than tracked separately, so it
 * stays correct regardless of how much back-and-forth navigation happens.
 *
 * `showReveal` (opt-in, only Homophones passes it) shows a toggle that
 * reveals the current item's `sentence` text — items without a `sentence`
 * field (every other drill) simply render nothing for it either way.
 *
 * `showWordLabel` (opt-in, only Silent Letters passes it) always-renders the
 * current item's `displayWord` text (the word's spelling) between the play
 * button and the choice grid — unlike `showReveal`, there's no toggle, since
 * the student needs to see the spelling to reason about which letter is
 * silent.
 */
export default function DrillLoop({ items, choices, onFinish, headerExtra, softCards = false, plainBigText = false, showReveal = false, showWordLabel = false }) {
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { [itemIndex]: chosenKey }
    const [isPlaying, setIsPlaying] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const audioRef = useRef(null);
    const timerRef = useRef(null);

    const item = items[index];
    const total = items.length;
    // Items can carry their own per-item choices (e.g. Minimal Pairs, where the
    // played word itself is one of the options); falls back to the static
    // top-level `choices` prop for drills where every item shares the same
    // fixed choice set (e.g. -ed Endings' /t/, /d/, /ɪd/).
    const activeChoices = item.choices ?? choices;

    const selectedKey = answers[index] ?? null;
    const status = selectedKey === null ? null : (selectedKey === item.correctKey ? 'correct' : 'wrong');
    const score = Object.entries(answers).filter(([idx, key]) => items[idx]?.correctKey === key).length;
    // Progression is always sequential (answering is the only way forward), so the
    // number of stored answers is exactly the index of the next unanswered item —
    // i.e. how far forward "Next" is allowed to go after stepping back with "Previous".
    const answeredCount = Object.keys(answers).length;

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
            clearTimeout(timerRef.current);
        };
    }, []);

    // Hide the sentence again whenever the item changes, so moving to a new
    // item never leaks its predecessor's revealed text.
    useEffect(() => {
        setRevealed(false);
    }, [index]);

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
        setAnswers(prev => ({ ...prev, [index]: key }));
        const finalScore = correct ? score + 1 : score;

        timerRef.current = setTimeout(() => {
            audioRef.current?.pause();
            setIsPlaying(false);
            if (index + 1 >= total) {
                onFinish(finalScore, total);
            } else {
                setIndex(i => i + 1);
            }
        }, correct ? 1500 : 2000);
    }

    function goPrev() {
        if (index === 0) return;
        audioRef.current?.pause();
        setIsPlaying(false);
        clearTimeout(timerRef.current);
        setIndex(i => i - 1);
    }

    function goNext() {
        if (index >= answeredCount) return; // nothing reached yet beyond this item
        audioRef.current?.pause();
        setIsPlaying(false);
        clearTimeout(timerRef.current);
        setIndex(i => Math.min(i + 1, total - 1));
    }

    const gridCols = activeChoices.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
            <div className="flex items-center gap-6">
                <p className="text-white/40 text-sm font-semibold">{index + 1} / {total}</p>
                {headerExtra}
            </div>

            <div className="flex flex-col items-center gap-4">
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

                {showWordLabel && item.displayWord && (
                    <p className="text-white text-3xl font-bold tracking-widest">{item.displayWord}</p>
                )}

                {showReveal && item.sentence && (
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={() => setRevealed(r => !r)}
                            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                            {revealed ? 'Hide Sentence' : '👁 Reveal Sentence'}
                        </button>
                        {revealed && (
                            <p className="text-white text-2xl font-semibold italic text-center max-w-2xl">{item.sentence}</p>
                        )}
                    </div>
                )}
            </div>

            <div className={`grid ${gridCols} gap-4 w-full max-w-2xl`}>
                {activeChoices.map((choice, i) => {
                    const isSelected = selectedKey === choice.key;
                    const isCorrectChoice = choice.key === item.correctKey;

                    let cls = softCards ? 'lg-surface-soft lg-surface-soft-hover border cursor-pointer' : 'lg-surface lg-surface-hover border cursor-pointer';
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
                            <span className="text-white text-4xl font-bold">{plainBigText ? choice.ipa : `/${choice.ipa}/`}</span>
                            {choice.example && <span className="text-white/60 text-sm">{choice.example}</span>}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={goPrev}
                    disabled={index === 0}
                    className="text-white/50 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed text-sm font-semibold transition-colors cursor-pointer"
                >
                    ← Previous
                </button>
                <button
                    onClick={goNext}
                    disabled={index >= answeredCount}
                    className="text-white/50 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed text-sm font-semibold transition-colors cursor-pointer"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
