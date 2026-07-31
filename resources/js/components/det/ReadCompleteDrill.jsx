import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';
import readCompleteSets from '@/data/det/readComplete.json';

const PARAGRAPH_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const FONT_SIZE_MAX = PARAGRAPH_SIZES.length - 1;

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';

function parseParagraph(paragraph) {
    return paragraph.split(/(\{\{\d+\}\})/g).map((part, i) => {
        const m = part.match(/^\{\{(\d+)\}\}$/);
        return m ? { type: 'blank', id: Number(m[1]), key: `b${i}` } : { type: 'text', value: part, key: `t${i}` };
    });
}

function InlineBlank({ blank, value, revealed, onChange }) {
    if (revealed) {
        const isCorrect = value === blank.answer;
        return (
            <span className={`inline-flex items-center gap-1.5 mx-1 px-2 py-0.5 rounded-md border font-semibold align-middle ${isCorrect ? 'bg-green-500/20 border-green-400/50 text-green-200' : 'bg-red-500/20 border-red-400/50 text-red-200'}`}>
                {value || '(blank)'}
                {!isCorrect && <span className="text-white/50 text-xs font-normal">→ {blank.answer}</span>}
            </span>
        );
    }
    return (
        <select
            value={value || ''}
            onChange={e => onChange(blank.id, e.target.value)}
            className="mx-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/30 text-white font-semibold align-middle focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
        >
            <option value="" disabled className="text-black bg-white">choose…</option>
            {blank.options.map(opt => (
                <option key={opt} value={opt} className="text-black bg-white">{opt}</option>
            ))}
        </select>
    );
}

export default function ReadCompleteDrill() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling
    const [set, setSet] = useState(null);
    const [answers, setAnswers] = useState({});
    const [revealed, setRevealed] = useState(false);
    const [sessionKey, setSessionKey] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    function startSet(s) {
        setSet(s);
        setAnswers({});
        setRevealed(false);
        setSessionKey(k => k + 1);
        setPhase('drilling');
    }

    function setAnswer(blankId, value) {
        if (revealed) return;
        setAnswers(prev => ({ ...prev, [blankId]: value }));
    }

    const segments = useMemo(() => (set ? parseParagraph(set.paragraph) : []), [set]);
    const allAnswered = set ? set.blanks.every(b => answers[b.id]) : false;

    const score = useMemo(() => {
        if (!set || !revealed) return null;
        const correct = set.blanks.filter(b => answers[b.id] === b.answer).length;
        return { correct, total: set.blanks.length };
    }, [set, revealed, answers]);

    function redo() {
        if (set) startSet(set);
    }

    return (
        <PracticeSessionShell
            title="Read and Complete"
            subtitle={phase === 'drilling' ? set.title : 'Choose a paragraph to practice'}
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
                        <p className="text-white/60 text-sm text-center mb-2">Choose a paragraph. Fill every blank, then submit to reveal your score.</p>
                        {readCompleteSets.map(s => (
                            <button
                                key={s.id}
                                onClick={() => startSet(s)}
                                className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left"
                            >
                                <p className="text-lg">{s.title}</p>
                                <p className="text-white/40 text-xs font-normal mt-1">{s.blanks.length} blanks</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'drilling' && set && (
                <div key={sessionKey} className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto py-8">
                    <p className={`${PARAGRAPH_SIZES[fontSizeIdx]} leading-relaxed max-w-3xl text-center ${textColor}`}>
                        {segments.map(seg => seg.type === 'text'
                            ? <span key={seg.key}>{seg.value}</span>
                            : (
                                <InlineBlank
                                    key={seg.key}
                                    blank={set.blanks.find(b => b.id === seg.id)}
                                    value={answers[seg.id]}
                                    revealed={revealed}
                                    onChange={setAnswer}
                                />
                            ))}
                    </p>

                    {!revealed ? (
                        <button onClick={() => setRevealed(true)} disabled={!allAnswered} className={primaryBtnCls}>
                            Submit
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-white text-4xl font-bold">{score.correct} / {score.total}</p>
                            <div className="flex gap-4">
                                <button onClick={redo} className={primaryBtnCls}>Try Again</button>
                                <button onClick={() => setPhase('select')} className={secondaryBtnCls}>Choose Another Paragraph</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PracticeSessionShell>
    );
}
