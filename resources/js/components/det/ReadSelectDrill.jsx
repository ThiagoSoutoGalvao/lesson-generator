import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';
import readSelectSets from '@/data/det/readSelect.json';

const SPEED_OPTIONS = [
    { label: '3s / word', seconds: 3 },
    { label: '5s / word', seconds: 5 },
    { label: '8s / word', seconds: 8 },
    { label: 'Untimed', seconds: null },
];

const WORD_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const FONT_SIZE_MAX = WORD_SIZES.length - 1;
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';

const AVAILABLE_DIFFICULTIES = DIFFICULTY_ORDER.filter(d => readSelectSets.some(s => s.difficulty === d));

export default function ReadSelectDrill() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling
    const [set, setSet] = useState(null);
    const [speed, setSpeed] = useState(SPEED_OPTIONS[1]);
    const [selected, setSelected] = useState(new Set());
    const [checked, setChecked] = useState(false);
    const [paused, setPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [sessionKey, setSessionKey] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');
    const [difficulty, setDifficulty] = useState(AVAILABLE_DIFFICULTIES[0]);

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    function startSet(s) {
        setSet(s);
        setSelected(new Set());
        setChecked(false);
        setPaused(false);
        setTimeLeft(speed.seconds ? s.items.length * speed.seconds : null);
        setSessionKey(k => k + 1);
        setPhase('drilling');
    }

    useEffect(() => {
        if (phase !== 'drilling' || paused || checked || timeLeft === null || timeLeft <= 0) return;
        const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, paused, checked, timeLeft]);

    function toggleWord(word) {
        if (checked) return;
        setSelected(prev => {
            const next = new Set(prev);
            next.has(word) ? next.delete(word) : next.add(word);
            return next;
        });
    }

    const score = useMemo(() => {
        if (!set || !checked) return null;
        const correct = set.items.filter(item => selected.has(item.word) === item.isReal).length;
        return { correct, total: set.items.length };
    }, [checked, set, selected]);

    function redo() {
        if (set) startSet(set);
    }

    return (
        <PracticeSessionShell
            title="Read and Select"
            subtitle={phase === 'select' ? 'Choose a word set to practice' : `${set.difficulty} set`}
            progressLabel={phase === 'drilling' && !checked && timeLeft !== null ? `${timeLeft}s` : undefined}
            paused={paused}
            onTogglePause={phase === 'drilling' && !checked ? () => setPaused(p => !p) : undefined}
            onRedo={phase === 'drilling' ? redo : undefined}
            onBack={phase === 'select' ? backToDetTab : () => setPhase('select')}
            fontSizeIdx={fontSizeIdx}
            fontSizeMax={FONT_SIZE_MAX}
            onFontDecrease={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            onFontIncrease={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))}
            textColor={textColor}
            onTextColorChange={setTextColor}
        >
            {phase === 'select' && (
                <div className="flex-1 flex items-center justify-center px-8">
                    <div className="flex flex-col gap-6 max-w-md w-full">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Difficulty</p>
                            <div className="flex gap-2">
                                {AVAILABLE_DIFFICULTIES.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer capitalize ${
                                            difficulty === d
                                                ? 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                                                : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70'
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Timer</p>
                            <div className="flex gap-2 flex-wrap">
                                {SPEED_OPTIONS.map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setSpeed(opt)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                            speed.label === opt.label
                                                ? 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                                                : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {readSelectSets.filter(s => s.difficulty === difficulty).map((s, i) => (
                                <button
                                    key={s.id}
                                    onClick={() => startSet(s)}
                                    className={`px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 ${WORD_SIZES[fontSizeIdx]} font-bold transition-all cursor-pointer ${textColor}`}
                                >
                                    Set {i + 1} · {s.items.length} words
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'drilling' && set && (
                <div key={sessionKey} className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto py-8">
                    <p className="text-white/60 text-sm">Click every real English word</p>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-3xl">
                        {set.items.map(item => {
                            const isSelected = selected.has(item.word);
                            let cls = `px-6 py-5 rounded-2xl border ${WORD_SIZES[fontSizeIdx]} font-bold transition-all cursor-pointer `;
                            if (checked) {
                                const correct = isSelected === item.isReal;
                                cls += correct
                                    ? 'bg-green-500/25 border-green-400/50 text-green-200'
                                    : 'bg-red-500/25 border-red-400/50 text-red-200';
                            } else {
                                cls += isSelected
                                    ? 'bg-amber-500/30 border-amber-400/60 text-amber-100 scale-[1.03]'
                                    : `bg-white/8 border-white/20 ${textColor} hover:bg-white/15`;
                            }
                            return (
                                <button key={item.word} onClick={() => toggleWord(item.word)} className={cls}>
                                    {item.word}
                                </button>
                            );
                        })}
                    </div>

                    {!checked ? (
                        <button onClick={() => setChecked(true)} className={primaryBtnCls}>
                            Check Answers
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-white text-4xl font-bold">{score.correct} / {score.total}</p>
                            <div className="flex gap-4">
                                <button onClick={redo} className={primaryBtnCls}>Try Again</button>
                                <button onClick={() => setPhase('select')} className={secondaryBtnCls}>Choose Another Set</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PracticeSessionShell>
    );
}
