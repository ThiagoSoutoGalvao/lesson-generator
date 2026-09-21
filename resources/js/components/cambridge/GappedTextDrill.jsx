import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeBack } from '@/hooks/usePracticeBack';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import { useDisplay } from '@/hooks/useDisplay';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import b2Sets from '@/data/cambridge/b2/gappedText.json';
import a2Sets from '@/data/cambridge/a2/gappedText.json';
import { CAMBRIDGE_LEVEL_LABEL, partHint } from '@/lib/cambridgeLevels';

const PARAGRAPH_SIZES = ['text-lg',   'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const REF_SIZES       = ['text-base', 'text-lg', 'text-xl',  'text-2xl', 'text-3xl'];
const FONT_SIZE_MAX = PARAGRAPH_SIZES.length - 1;

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer';

function parseParagraph(paragraph) {
    return paragraph.split(/(\{\{\d+\}\})/g).map((part, i) => {
        const m = part.match(/^\{\{(\d+)\}\}$/);
        return m ? { type: 'blank', id: Number(m[1]), key: `b${i}` } : { type: 'text', value: part, key: `t${i}` };
    });
}

function InlineGap({ blank, value, revealed, sentences, onChange }) {
    if (revealed) {
        const isCorrect = value === blank.answer;
        return (
            <span className={`inline-flex items-center gap-1.5 mx-1 px-2 py-0.5 rounded-md border font-bold align-middle ${isCorrect ? 'bg-green-500/20 border-green-400/50 text-green-200' : 'bg-red-500/20 border-red-400/50 text-red-200'}`}>
                [ {value || '?'} ]
                {!isCorrect && <span className="text-white/50 text-xs font-normal">→ {blank.answer}</span>}
            </span>
        );
    }
    return (
        <select
            value={value || ''}
            onChange={e => onChange(blank.id, e.target.value)}
            className="mx-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/30 text-white font-bold align-middle focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
        >
            <option value="" disabled className="text-black bg-white">[ {blank.id} ]</option>
            {sentences.map(s => (
                <option key={s.label} value={s.label} className="text-black bg-white">{s.label}</option>
            ))}
        </select>
    );
}

const NUM_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

export default function GappedTextDrill({ level = 'b2' }) {
    const sets = level === 'a2' ? a2Sets : b2Sets;
    // The intro counts the gaps / sentences in the data, so B2 (6 gaps, A–G) and A2 (4 gaps, A–E) both read right.
    const nGaps = sets[0]?.blanks.length ?? 6;
    const lastLabel = String.fromCharCode(64 + (sets[0]?.sentences.length ?? 7));
    const intro = `${NUM_WORDS[nGaps] ?? nGaps} sentences have been removed from the text. Choose the correct sentence (A–${lastLabel}) for each gap — one option is a distractor and doesn't fit anywhere.`;
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling
    const [set, setSet] = useState(null);
    const [answers, setAnswers] = useState({});
    const [revealed, setRevealed] = useState(false);
    const [sessionKey, setSessionKey] = useState(0);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();

    const backTo = usePracticeBack({ path: '/upload', state: { tab: 'cambridge' } });
    function backToTab() {
        navigate(backTo.path, { state: backTo.state });
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
            watermark={<CambridgeWatermark />}
            title={`Gapped Text — ${CAMBRIDGE_LEVEL_LABEL[level]}`}
            subtitle={phase === 'drilling' ? set.title : `Choose a text to practice — ${partHint(level, 6)}`}
            onRedo={phase === 'drilling' ? redo : undefined}
            onBack={phase === 'select' ? backToTab : () => setPhase('select')}
        >
            {phase === 'select' && (
                <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="flex flex-col gap-3 max-w-md w-full mx-auto">
                        <p className="text-white/60 text-sm text-center mb-2">{intro}</p>
                        {sets.map(s => (
                            <button key={s.id} onClick={() => startSet(s)}
                                className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left">
                                <p className="text-lg">{s.title}</p>
                                <p className="text-white/40 text-xs font-normal mt-1">{s.blanks.length} gaps</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'drilling' && set && (
                <div key={sessionKey} className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    <div className={`md:w-[52%] overflow-y-auto p-8 border-b md:border-b-0 md:border-r border-white/10 ${PARAGRAPH_SIZES[fontSizeIdx]} leading-relaxed ${textColor}`}>
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Passage</p>
                        <p>
                            {segments.map(seg => seg.type === 'text'
                                ? <span key={seg.key}>{seg.value}</span>
                                : (
                                    <InlineGap
                                        key={seg.key}
                                        blank={set.blanks.find(b => b.id === seg.id)}
                                        value={answers[seg.id]}
                                        revealed={revealed}
                                        sentences={set.sentences}
                                        onChange={setAnswer}
                                    />
                                ))}
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-8">
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Removed sentences</p>
                            <div className="flex flex-col gap-2.5">
                                {set.sentences.map(s => (
                                    <p key={s.label} className={`${REF_SIZES[fontSizeIdx]} text-white/75 leading-snug`}>
                                        <span className="font-bold text-amber-300/90 mr-1.5">{s.label}</span>{s.text}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="shrink-0 flex justify-center pb-8">
                            {!revealed ? (
                                <button onClick={() => setRevealed(true)} disabled={!allAnswered} className={primaryBtnCls}>
                                    Submit
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-white text-4xl font-bold">{score.correct} / {score.total}</p>
                                    <div className="flex gap-4">
                                        <button onClick={redo} className={primaryBtnCls}>Try Again</button>
                                        <button onClick={() => setPhase('select')} className={secondaryBtnCls}>Choose Another Text</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
