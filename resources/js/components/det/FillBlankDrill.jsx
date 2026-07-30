import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';
import fillBlankItems from '@/data/det/fillBlank.json';

const SENTENCE_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const HINT_SIZES     = ['text-sm', 'text-base', 'text-lg',  'text-xl',  'text-2xl'];
const FONT_SIZE_MAX = SENTENCE_SIZES.length - 1;

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';
const toggleActiveCls = 'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer bg-amber-500/30 border-amber-400/50 text-amber-200';
const toggleInactiveCls = 'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70';
const tabActiveCls = 'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer capitalize bg-amber-500/30 border-amber-400/50 text-amber-200';
const tabInactiveCls = 'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer capitalize bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70';

const DIFFICULTY_OPTIONS = ['all', 'easy', 'medium', 'hard'];

function normalize(s) {
    return s.trim().toLowerCase();
}

function buildMask(target, revealCount) {
    return target.split('').map((ch, i) => (i < revealCount ? ch : '_')).join('');
}

function baseRevealCount(hint) {
    return hint.split('').filter(ch => ch !== '_').length;
}

export default function FillBlankDrill() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('intro'); // intro | drilling | results
    const [feedbackMode, setFeedbackMode] = useState('immediate'); // immediate | end
    const [index, setIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [sessionKey, setSessionKey] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');
    const [hintLevel, setHintLevel] = useState(0);
    const [difficulty, setDifficulty] = useState('all');
    const [sessionItems, setSessionItems] = useState(fillBlankItems);

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    function start() {
        const items = difficulty === 'all' ? fillBlankItems : fillBlankItems.filter(i => i.difficulty === difficulty);
        setSessionItems(items);
        setIndex(0);
        setInputValue('');
        setRevealed(false);
        setAnswers([]);
        setHintLevel(0);
        setSessionKey(k => k + 1);
        setPhase('drilling');
    }

    const current = sessionItems[index];
    const isLast = index + 1 >= sessionItems.length;
    const revealCount = current ? Math.min(current.target.length, baseRevealCount(current.hint) + hintLevel) : 0;
    const displayedHint = current ? buildMask(current.target, revealCount) : '';
    const hintExhausted = current && revealCount >= current.target.length;

    function isCorrect(value) {
        return normalize(value) === normalize(current.target);
    }

    function check() {
        if (feedbackMode === 'immediate') {
            setRevealed(true);
        } else {
            advance();
        }
    }

    function advance() {
        setAnswers(prev => [...prev, { given: inputValue, correct: isCorrect(inputValue) }]);
        if (!isLast) {
            setIndex(i => i + 1);
            setInputValue('');
            setRevealed(false);
            setHintLevel(0);
        } else {
            setPhase('results');
        }
    }

    const score = useMemo(() => {
        if (phase !== 'results') return null;
        return { correct: answers.filter(a => a.correct).length, total: answers.length };
    }, [phase, answers]);

    function redo() {
        start();
    }

    return (
        <PracticeSessionShell
            title="Fill in the Blanks"
            subtitle={phase === 'drilling' ? `Sentence ${index + 1} of ${sessionItems.length}` : undefined}
            onRedo={phase !== 'intro' ? redo : undefined}
            onBack={phase === 'intro' ? backToDetTab : () => setPhase('intro')}
            fontSizeIdx={fontSizeIdx}
            fontSizeMax={FONT_SIZE_MAX}
            onFontDecrease={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            onFontIncrease={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))}
            textColor={textColor}
            onTextColorChange={setTextColor}
        >
            {phase === 'intro' && (
                <div className="flex-1 flex items-center justify-center px-8">
                    <div className="flex flex-col gap-6 max-w-md w-full items-stretch">
                        <p className="text-white/60 text-sm text-center">Type the missing word using the letter hint as a guide.</p>
                        <div className="flex flex-col gap-1.5">
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Difficulty</p>
                            <div className="flex gap-2">
                                {DIFFICULTY_OPTIONS.map(d => (
                                    <button key={d} onClick={() => setDifficulty(d)} className={difficulty === d ? tabActiveCls : tabInactiveCls}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Feedback</p>
                            <div className="flex gap-2">
                                <button onClick={() => setFeedbackMode('immediate')} className={feedbackMode === 'immediate' ? toggleActiveCls : toggleInactiveCls}>
                                    Immediate
                                </button>
                                <button onClick={() => setFeedbackMode('end')} className={feedbackMode === 'end' ? toggleActiveCls : toggleInactiveCls}>
                                    End of Set
                                </button>
                            </div>
                        </div>
                        <button onClick={start} className={primaryBtnCls}>Start</button>
                    </div>
                </div>
            )}

            {phase === 'drilling' && current && (
                <div key={`${sessionKey}-${index}`} className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
                    <p className={`${SENTENCE_SIZES[fontSizeIdx]} font-semibold text-center max-w-2xl ${textColor}`}>{current.sentence}</p>

                    <div className="flex items-center gap-3">
                        <p className={`${HINT_SIZES[fontSizeIdx]} text-white/40 tracking-widest font-mono`}>{displayedHint}</p>
                        {!revealed && !hintExhausted && (
                            <button
                                onClick={() => setHintLevel(h => h + 1)}
                                className="text-xs font-semibold text-amber-300/80 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1 transition-colors cursor-pointer"
                            >
                                💡 Hint
                            </button>
                        )}
                    </div>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !revealed && inputValue.trim() && check()}
                        disabled={revealed}
                        autoFocus
                        className={`w-64 text-center ${HINT_SIZES[fontSizeIdx]} bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-70`}
                    />

                    {revealed && (
                        <p className={isCorrect(inputValue) ? 'text-green-300 font-semibold text-lg' : 'text-red-300 font-semibold text-lg'}>
                            {isCorrect(inputValue) ? 'Correct!' : `Correct answer: ${current.target}`}
                        </p>
                    )}

                    {!revealed ? (
                        <button onClick={check} disabled={!inputValue.trim()} className={primaryBtnCls}>
                            {feedbackMode === 'immediate' ? 'Check' : (isLast ? 'Finish' : 'Next →')}
                        </button>
                    ) : (
                        <button onClick={advance} className={secondaryBtnCls}>
                            {isLast ? 'Finish' : 'Next →'}
                        </button>
                    )}
                </div>
            )}

            {phase === 'results' && score && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-8 overflow-y-auto">
                    <p className="text-white text-6xl font-bold">{score.correct} / {score.total}</p>
                    <div className="flex flex-col gap-2 max-w-lg w-full">
                        {sessionItems.map((item, i) => (
                            <div
                                key={item.id}
                                className={`px-4 py-2 rounded-lg text-sm flex justify-between gap-4 ${
                                    answers[i]?.correct ? 'bg-green-500/10 text-green-200' : 'bg-red-500/10 text-red-200'
                                }`}
                            >
                                <span className="font-semibold">{item.target}</span>
                                <span className="text-white/50">{answers[i]?.given || '(blank)'}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={redo} className={primaryBtnCls}>Try Again</button>
                        <button onClick={() => setPhase('intro')} className={secondaryBtnCls}>Back to Settings</button>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
