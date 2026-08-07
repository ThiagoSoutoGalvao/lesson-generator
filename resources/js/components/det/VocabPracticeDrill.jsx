import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';
import vocabItems from '@/data/det/vocabPractice.json';

const SESSION_SIZE = 12;
const WORD_SIZES = ['text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
const DEF_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const FONT_SIZE_MAX = WORD_SIZES.length - 1;
const DIFFICULTY_ORDER = ['medium', 'hard'];
const LETTERS = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
    const a = [...arr];
    for (let j = a.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [a[j], a[k]] = [a[k], a[j]];
    }
    return a;
}

function buildSession(difficulty) {
    const pool = vocabItems.filter(v => v.difficulty === difficulty);
    return shuffle(pool).slice(0, SESSION_SIZE).map(item => ({
        ...item,
        choices: shuffle([item.correctDefinition, ...item.distractors]),
    }));
}

const AVAILABLE_DIFFICULTIES = DIFFICULTY_ORDER.filter(d => vocabItems.some(v => v.difficulty === d));

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';

export default function VocabPracticeDrill() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling | results
    const [difficulty, setDifficulty] = useState(AVAILABLE_DIFFICULTIES[0]);
    const [session, setSession] = useState(null);
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState(null); // null | 'correct' | 'wrong'
    const [selected, setSelected] = useState(null);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    function start(d) {
        setDifficulty(d);
        setSession(buildSession(d));
        setIndex(0);
        setScore(0);
        setStatus(null);
        setSelected(null);
        setPhase('drilling');
    }

    function choose(def) {
        if (status !== null) return;
        const item = session[index];
        const correct = def === item.correctDefinition;
        setSelected(def);
        setStatus(correct ? 'correct' : 'wrong');
        setScore(s => correct ? s + 1 : s);

        timerRef.current = setTimeout(() => {
            if (index + 1 >= session.length) {
                setPhase('results');
            } else {
                setIndex(i => i + 1);
                setStatus(null);
                setSelected(null);
            }
        }, correct ? 1500 : 2200);
    }

    const item = session?.[index];

    return (
        <PracticeSessionShell
            title="Vocabulary Practice"
            subtitle={
                phase === 'select' ? 'Choose a difficulty to practice' :
                phase === 'drilling' ? `${difficulty} vocabulary` :
                `${difficulty} vocabulary — results`
            }
            progressLabel={phase === 'drilling' ? `${index + 1} / ${session.length}` : undefined}
            onBack={phase === 'select' ? backToDetTab : () => setPhase('select')}
            fontSizeIdx={fontSizeIdx}
            fontSizeMax={FONT_SIZE_MAX}
            onFontDecrease={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            onFontIncrease={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))}
            textColor={textColor}
            onTextColorChange={setTextColor}
        >
            {phase === 'select' && (
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="flex flex-col gap-6 max-w-md w-full mx-auto">
                        <p className="text-white/60 text-sm text-center">
                            See the word, pick the correct definition — reinforces the harder vocabulary from Read and Select and Fill in the Blanks.
                        </p>
                        <div className="flex flex-col gap-3">
                            {AVAILABLE_DIFFICULTIES.map(d => (
                                <button
                                    key={d}
                                    onClick={() => start(d)}
                                    className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white text-xl font-bold capitalize transition-all cursor-pointer"
                                >
                                    {d} · {vocabItems.filter(v => v.difficulty === d).length} words
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'drilling' && item && (
                <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
                    <p className={`${WORD_SIZES[fontSizeIdx]} font-bold ${textColor}`}>{item.word}</p>

                    <div className="grid grid-cols-1 gap-3 w-full max-w-2xl">
                        {item.choices.map((def, i) => {
                            const isSelected = selected === def;
                            const isCorrectChoice = def === item.correctDefinition;
                            let cls = 'bg-white/8 border-white/20 hover:bg-white/15 hover:border-white/35 cursor-pointer';
                            if (status !== null) {
                                if (isSelected && status === 'correct') cls = 'bg-green-500/30 border-green-400 scale-[1.01]';
                                else if (isSelected && status === 'wrong') cls = 'bg-red-500/30 border-red-400';
                                else if (isCorrectChoice) cls = 'bg-green-500/20 border-green-400/60';
                                else cls = 'bg-white/5 border-white/10 opacity-50';
                            }
                            return (
                                <button
                                    key={def}
                                    onClick={() => choose(def)}
                                    disabled={status !== null}
                                    className={`flex items-start gap-3 text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${cls}`}
                                >
                                    <span className="text-white/50 text-sm font-bold shrink-0 mt-0.5">{LETTERS[i]}</span>
                                    <span className={`${DEF_SIZES[fontSizeIdx]} text-white`}>{def}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {phase === 'results' && session && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="text-white/50 text-lg capitalize">{difficulty} vocabulary</p>
                    <p className="text-white text-6xl font-bold">{score} / {session.length}</p>
                    <div className="flex gap-4">
                        <button onClick={() => start(difficulty)} className={primaryBtnCls}>Practice Again</button>
                        <button onClick={() => setPhase('select')} className={secondaryBtnCls}>Choose Another Difficulty</button>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
