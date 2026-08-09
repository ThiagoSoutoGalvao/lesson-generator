import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';

const TEXT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const QUESTION_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const FONT_SIZE_MAX = TEXT_SIZES.length - 1;

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';

function LetterButton({ label, selected, isAnswer, revealed, disabled, onClick }) {
    let cls = 'w-14 h-14 rounded-xl border font-bold text-lg transition-all cursor-pointer flex items-center justify-center ';
    if (revealed) {
        if (isAnswer) cls += 'bg-green-500/25 border-green-400/50 text-green-200';
        else if (selected) cls += 'bg-red-500/25 border-red-400/50 text-red-200';
        else cls += 'bg-white/5 border-white/10 text-white/40';
    } else {
        cls += selected ? 'bg-amber-500/30 border-amber-400/60 text-amber-100' : 'bg-white/8 border-white/20 hover:bg-white/15 text-white';
    }
    return <button onClick={onClick} disabled={disabled} className={cls}>{label}</button>;
}

// Shared engine for both B2 First's Multiple Matching (Part 7 — one text answers each
// question) and C1 Advanced's Cross-Text Multiple Matching (Part 6 — questions compare
// across texts). The interaction is identical either way: lettered texts on the left,
// one question at a time on the right, pick a letter, reveal, next. Only the content
// (and whether questions reference other texts by letter) differs — see gappedText-style
// per-level JSON and the two thin wrappers, MultipleMatchingDrill / CrossTextMatchingDrill.
export default function TextMatchingDrill({ sets, title, selectSubtitle, selectIntro }) {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling | results
    const [set, setSet] = useState(null);
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [sessionKey, setSessionKey] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    function startSet(s) {
        setSet(s);
        setQIndex(0);
        setAnswers(new Array(s.questions.length).fill(null));
        setSessionKey(k => k + 1);
        setPhase('drilling');
    }

    function redo() {
        if (set) startSet(set);
    }

    const question = set?.questions[qIndex];
    const qState = (question && answers[qIndex]) || { given: null, revealed: false, correct: false };

    function handleAnswer(label) {
        if (qState.revealed) return;
        setAnswers(prev => {
            const next = [...prev];
            next[qIndex] = { given: label, revealed: true, correct: label === question.answer };
            return next;
        });
    }

    function nextQuestion() {
        if (qIndex + 1 < set.questions.length) setQIndex(i => i + 1);
        else setPhase('results');
    }

    const score = useMemo(() => {
        if (phase !== 'results') return null;
        return { correct: answers.filter(a => a?.correct).length, total: answers.length };
    }, [phase, answers]);

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title={title}
            subtitle={phase === 'drilling' ? set.title : selectSubtitle}
            progressLabel={phase === 'drilling' ? `Question ${qIndex + 1} of ${set.questions.length}` : undefined}
            onRedo={phase === 'drilling' ? redo : undefined}
            onBack={phase === 'select' ? backToTab : () => setPhase('select')}
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
                        <p className="text-white/60 text-sm text-center mb-2">{selectIntro}</p>
                        {sets.map(s => (
                            <button key={s.id} onClick={() => startSet(s)}
                                className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left">
                                <p className="text-lg">{s.title}</p>
                                <p className="text-white/40 text-xs font-normal mt-1">{s.texts.length} texts · {s.questions.length} questions</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'drilling' && set && question && (
                <div key={`${sessionKey}-${qIndex}`} className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    <div className={`md:w-[50%] overflow-y-auto p-8 border-b md:border-b-0 md:border-r border-white/10 ${TEXT_SIZES[fontSizeIdx]} leading-relaxed ${textColor} flex flex-col gap-5`}>
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">{set.instruction}</p>
                        {set.texts.map(t => (
                            <div key={t.label}>
                                <p className="font-bold mb-1">{t.label} — {t.name}</p>
                                <p>{t.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 px-8 py-8">
                            <p className={`${QUESTION_SIZES[fontSizeIdx]} font-semibold text-center max-w-xl ${textColor}`}>
                                {(set.questionPrefix ?? set.instruction)} {question.question}
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {set.texts.map(t => (
                                    <LetterButton
                                        key={t.label}
                                        label={t.label}
                                        selected={qState.given === t.label}
                                        isAnswer={t.label === question.answer}
                                        revealed={qState.revealed}
                                        disabled={qState.revealed}
                                        onClick={() => handleAnswer(t.label)}
                                    />
                                ))}
                            </div>
                            {qState.revealed && (
                                <p className={qState.correct ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>
                                    {qState.correct ? 'Correct!' : `Correct answer: ${question.answer}`}
                                </p>
                            )}
                        </div>
                        <div className="shrink-0 flex justify-center pb-8">
                            {qState.revealed && (
                                <button onClick={nextQuestion} className={primaryBtnCls}>
                                    {qIndex + 1 < set.questions.length ? 'Next Question →' : 'Finish'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {phase === 'results' && score && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-8 overflow-y-auto">
                    <p className="text-white text-6xl font-bold">{score.correct} / {score.total}</p>
                    <div className="flex gap-4">
                        <button onClick={redo} className={primaryBtnCls}>Try Again</button>
                        <button onClick={() => setPhase('select')} className={secondaryBtnCls}>Choose Another Set</button>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
