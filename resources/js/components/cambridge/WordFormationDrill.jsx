import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import wordFormationSets from '@/data/cambridge/b2/wordFormation.json';

const ROOT_SIZES     = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
const SENTENCE_SIZES = ['text-lg',  'text-xl',   'text-2xl', 'text-3xl', 'text-4xl'];
const FORM_SIZES     = ['text-sm',  'text-base', 'text-lg',  'text-xl',  'text-2xl'];
const FONT_SIZE_MAX = ROOT_SIZES.length - 1;

const primaryBtnCls = 'px-6 py-3 rounded-xl bg-amber-500/30 border border-amber-400/50 hover:bg-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer';
const secondaryBtnCls = 'px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-default text-white font-semibold transition-colors cursor-pointer';

function renderSentence(sentence, answer, revealed) {
    const parts = sentence.split('___');
    if (parts.length < 2) return <span>{sentence}</span>;
    return (
        <>
            {parts[0]}
            {revealed
                ? <mark className="bg-green-400/25 text-green-300 font-bold rounded px-2 not-italic mx-0.5">{answer}</mark>
                : <span className="inline-block border-b-2 border-white/50 min-w-[100px] mx-1 text-center text-white/20">___</span>}
            {parts.slice(1).join('___')}
        </>
    );
}

export default function WordFormationDrill() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('select'); // select | drilling
    const [set, setSet] = useState(null);
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [sessionKey, setSessionKey] = useState(0);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor] = useState('text-white');

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    function startSet(s) {
        setSet(s);
        setIndex(0);
        setRevealed(false);
        setSessionKey(k => k + 1);
        setPhase('drilling');
    }

    function redo() {
        if (set) startSet(set);
    }

    const item = set?.items[index];
    const total = set?.items.length ?? 0;
    const isLast = index + 1 >= total;

    function next() {
        if (!isLast) { setIndex(i => i + 1); setRevealed(false); }
        else setPhase('select');
    }

    function prev() {
        if (index > 0) { setIndex(i => i - 1); setRevealed(false); }
    }

    return (
        <PracticeSessionShell
            title="Word Formation — B2 First"
            subtitle={phase === 'drilling' ? set.title : 'Choose a set to practice — Reading & Use of English, Part 3'}
            progressLabel={phase === 'drilling' ? `Item ${index + 1} of ${total}` : undefined}
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
                        <p className="text-white/60 text-sm text-center mb-2">Use the correct form of the root word to complete each sentence.</p>
                        {wordFormationSets.map(s => (
                            <button key={s.id} onClick={() => startSet(s)}
                                className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left">
                                <p className="text-lg">{s.title}</p>
                                <p className="text-white/40 text-xs font-normal mt-1">{s.items.length} items</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'drilling' && item && (
                <div key={`${sessionKey}-${index}`} className="flex-1 flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto py-8">
                    <div className="max-w-2xl w-full flex flex-col gap-5">
                        <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 overflow-hidden">
                            <div className="px-8 py-6 flex items-center justify-center border-b border-white/10">
                                <span className={`${ROOT_SIZES[fontSizeIdx]} font-black tracking-widest ${textColor}`}>{item.root}</span>
                            </div>
                            <div className="px-8 py-6">
                                <p className="text-white/45 text-xs uppercase tracking-widest mb-3">Complete the sentence</p>
                                <p className={`${textColor} ${SENTENCE_SIZES[fontSizeIdx]} leading-relaxed`}>
                                    {renderSentence(item.sentence, item.answer, revealed)}
                                </p>
                            </div>
                            {revealed && (
                                <div className="px-8 py-4 border-t border-white/10 bg-white/5 flex items-center gap-3">
                                    <span className="text-white/40 text-xs uppercase tracking-widest">Word class</span>
                                    <span className={`${FORM_SIZES[fontSizeIdx]} ${textColor} font-semibold`}>{item.form}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            <button onClick={prev} disabled={index === 0} className={secondaryBtnCls}>← Prev</button>
                            {!revealed ? (
                                <button onClick={() => setRevealed(true)} className={secondaryBtnCls}>Reveal</button>
                            ) : (
                                <button onClick={next} className={primaryBtnCls}>{isLast ? 'Finish' : 'Next →'}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PracticeSessionShell>
    );
}
