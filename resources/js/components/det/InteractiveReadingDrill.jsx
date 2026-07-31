import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';
import interactiveReadingSets from '@/data/det/interactiveReading.json';

const PASSAGE_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const TASK_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const FONT_SIZE_MAX = PASSAGE_SIZES.length - 1;

const TASK_LABELS = {
    complete_sentence: 'Complete the Sentence',
    complete_passage: 'Complete the Passage',
    highlight_answer: 'Highlight the Answer',
    identify_idea: 'Identify the Idea',
    title_passage: 'Title the Passage',
};

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function OptionButton({ label, selected, isAnswer, revealed, disabled, onClick }) {
    let cls = 'w-full text-left px-5 py-3 rounded-xl border font-medium transition-all cursor-pointer ';
    if (revealed) {
        if (isAnswer) cls += 'bg-green-500/25 border-green-400/50 text-green-200';
        else if (selected) cls += 'bg-red-500/25 border-red-400/50 text-red-200';
        else cls += 'bg-white/5 border-white/10 text-white/40';
    } else {
        cls += selected
            ? 'bg-amber-500/30 border-amber-400/60 text-amber-100'
            : 'bg-white/8 border-white/20 hover:bg-white/15 text-white';
    }
    return (
        <button onClick={onClick} disabled={disabled} className={cls}>
            {label}
        </button>
    );
}

function PassageView({ passage, task, onSentenceClick, taskState }) {
    return (
        <div className="flex flex-col gap-2">
            {passage.map((sentence, i) => {
                let text = sentence;
                let extraCls = '';
                let clickable = false;

                if (task.type === 'complete_passage' && i === task.sentenceIndex) {
                    const re = new RegExp(escapeRegExp(task.maskedWord), 'i');
                    text = sentence.replace(re, '_____');
                    extraCls = 'bg-amber-500/10 rounded px-1';
                }

                if (task.type === 'highlight_answer') {
                    clickable = !taskState.revealed;
                    if (taskState.revealed) {
                        if (i === task.answerSentenceIndex) extraCls = 'bg-green-500/20 rounded px-1';
                        else if (i === taskState.given) extraCls = 'bg-red-500/20 rounded px-1';
                    } else if (i === taskState.given) {
                        extraCls = 'bg-amber-500/20 rounded px-1';
                    }
                }

                return (
                    <span
                        key={i}
                        onClick={clickable ? () => onSentenceClick(i) : undefined}
                        className={`${clickable ? 'cursor-pointer hover:bg-white/10 rounded px-1 transition-colors' : ''} ${extraCls}`}
                    >
                        {text}{' '}
                    </span>
                );
            })}
        </div>
    );
}

function TaskPanel({ task, taskState, onAnswer, textSizeCls }) {
    if (task.type === 'highlight_answer') {
        return <p className="text-white/50 text-sm text-center">Click the sentence in the passage on the left that answers the prompt.</p>;
    }

    if (task.type === 'complete_sentence') {
        return (
            <>
                <p className={`${textSizeCls} font-semibold text-center max-w-xl`}>{task.sentence}</p>
                <div className="flex flex-col gap-2 w-full max-w-md">
                    {task.options.map(opt => (
                        <OptionButton
                            key={opt}
                            label={opt}
                            selected={taskState.given === opt}
                            isAnswer={opt === task.answer}
                            revealed={taskState.revealed}
                            disabled={taskState.revealed}
                            onClick={() => onAnswer(opt)}
                        />
                    ))}
                </div>
            </>
        );
    }

    // complete_passage, identify_idea, title_passage all share the options-list pattern
    return (
        <div className="flex flex-col gap-2 w-full max-w-xl">
            {task.options.map(opt => (
                <OptionButton
                    key={opt}
                    label={opt}
                    selected={taskState.given === opt}
                    isAnswer={opt === task.answer}
                    revealed={taskState.revealed}
                    disabled={taskState.revealed}
                    onClick={() => onAnswer(opt)}
                />
            ))}
        </div>
    );
}

export default function InteractiveReadingDrill() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling | results
    const [set, setSet] = useState(null);
    const [taskIndex, setTaskIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [sessionKey, setSessionKey] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    function startSet(s) {
        setSet(s);
        setTaskIndex(0);
        setAnswers(new Array(s.tasks.length).fill(null));
        setSessionKey(k => k + 1);
        setPhase('drilling');
    }

    function redo() {
        if (set) startSet(set);
    }

    const task = set?.tasks[taskIndex];
    const taskState = (task && answers[taskIndex]) || { given: null, revealed: false, correct: false };

    function commitAnswer(given, correct) {
        setAnswers(prev => {
            const next = [...prev];
            next[taskIndex] = { given, revealed: true, correct };
            return next;
        });
    }

    function handleOptionAnswer(opt) {
        if (taskState.revealed) return;
        commitAnswer(opt, opt === task.answer);
    }

    function handleSentenceClick(i) {
        if (taskState.revealed) return;
        commitAnswer(i, i === task.answerSentenceIndex);
    }

    function nextTask() {
        if (taskIndex + 1 < set.tasks.length) {
            setTaskIndex(i => i + 1);
        } else {
            setPhase('results');
        }
    }

    const score = useMemo(() => {
        if (phase !== 'results') return null;
        return { correct: answers.filter(a => a?.correct).length, total: answers.length };
    }, [phase, answers]);

    return (
        <PracticeSessionShell
            title="Interactive Reading"
            subtitle={phase === 'drilling' ? set.title : 'Choose a passage to practice'}
            progressLabel={phase === 'drilling' ? `Task ${taskIndex + 1} of ${set.tasks.length}` : undefined}
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
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="flex flex-col gap-3 max-w-md w-full mx-auto">
                        <p className="text-white/60 text-sm text-center mb-2">Choose a passage. Work through all 5 tasks in order.</p>
                        {interactiveReadingSets.map(s => (
                            <button
                                key={s.id}
                                onClick={() => startSet(s)}
                                className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left"
                            >
                                <p className="text-lg">{s.title}</p>
                                <p className="text-white/40 text-xs font-normal mt-1">{s.tasks.length} tasks · {s.passage.length} sentences</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'drilling' && set && task && (
                <div key={`${sessionKey}-${taskIndex}`} className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    <div className={`md:w-[46%] overflow-y-auto p-8 border-b md:border-b-0 md:border-r border-white/10 ${PASSAGE_SIZES[fontSizeIdx]} leading-relaxed ${textColor}`}>
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Passage</p>
                        <h3 className="font-bold mb-4">{set.title}</h3>
                        <PassageView passage={set.passage} task={task} onSentenceClick={handleSentenceClick} taskState={taskState} />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 px-8 py-8">
                            <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">{TASK_LABELS[task.type]}</p>
                            <p className={`${TASK_SIZES[fontSizeIdx]} font-semibold text-center max-w-xl ${textColor}`}>{task.prompt}</p>
                            <TaskPanel task={task} taskState={taskState} onAnswer={handleOptionAnswer} textSizeCls={`${TASK_SIZES[fontSizeIdx]} ${textColor}`} />
                            {taskState.revealed && (
                                <p className={taskState.correct ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>
                                    {taskState.correct ? 'Correct!' : 'Not quite — check the highlighted answer.'}
                                </p>
                            )}
                        </div>
                        <div className="shrink-0 flex justify-center pb-8">
                            {taskState.revealed && (
                                <button onClick={nextTask} className={primaryBtnCls}>
                                    {taskIndex + 1 < set.tasks.length ? 'Next Task →' : 'Finish'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'results' && score && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-8 overflow-y-auto">
                    <p className="text-white text-6xl font-bold">{score.correct} / {score.total}</p>
                    <div className="flex flex-col gap-2 max-w-lg w-full">
                        {set.tasks.map((t, i) => (
                            <div
                                key={i}
                                className={`px-4 py-2 rounded-lg text-sm flex justify-between gap-4 ${
                                    answers[i]?.correct ? 'bg-green-500/10 text-green-200' : 'bg-red-500/10 text-red-200'
                                }`}
                            >
                                <span className="font-semibold">{TASK_LABELS[t.type]}</span>
                                <span className="text-white/50">{answers[i]?.correct ? 'Correct' : 'Missed'}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={redo} className={primaryBtnCls}>Try Again</button>
                        <button onClick={() => setPhase('select')} className={secondaryBtnCls}>Choose Another Passage</button>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
