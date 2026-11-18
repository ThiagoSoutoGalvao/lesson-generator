import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
// Light (Aurora Business) passage and word-bank sizes.
const L_TEXT_SIZES = ['text-[17px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[28px]', 'text-[27px] sm:text-[32px]'];
const L_CHIP_SIZES = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function ClozeActivity({ activity, onClose, onComplete, hideSave }) {
    const [revealed, setRevealed]     = useState(new Set());
    const [bgUrl, setBgUrl]           = useState(null);
    const [showSave, setShowSave]     = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    // Aurora Business light layout: gaps in order (the current one ringed), a student taps the word for it and it is
    // checked at once. `filled` = gap index → true if right first time; `wrongChip` flashes the chip just tried.
    const light = useIsLightUi();
    const [filled, setFilled]       = useState({});
    const [missed, setMissed]       = useState([]);
    const [wrongChip, setWrongChip] = useState(null);
    const [notice, setNotice]       = useState(null);

    const processedParts = useMemo(() => {
        let counter = 0;
        return activity.parts.map(part =>
            part.blank !== undefined ? { ...part, blankIndex: counter++ } : part
        );
    }, [activity]);

    const totalBlanks = processedParts.filter(p => p.blank !== undefined).length;
    const wordBank = useMemo(() => shuffle(activity.word_bank ?? []), [activity]);

    useEffect(() => {
        if (light) return;
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Student app (Phase S4): reveal-only — no student input, so completion
    // only (no score) once every blank has been revealed.
    // Light: the group fills every gap itself, so it gets a score (right first time).
    const lightDone = light && totalBlanks > 0 && Object.keys(filled).length === totalBlanks;
    const lightScore = Object.values(filled).filter(Boolean).length;
    const complete = light ? lightDone : totalBlanks > 0 && revealed.size === totalBlanks;
    useEffect(() => {
        if (complete) onComplete?.(light ? { score: lightScore, maxScore: totalBlanks } : {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complete]);

    function revealBlank(idx) { setRevealed(r => new Set([...r, idx])); }
    function revealAll() { setRevealed(new Set(Array.from({ length: totalBlanks }, (_, i) => i))); }

    if (light) {
        const gaps = processedParts.filter(p => p.blank !== undefined);
        const current = gaps.find(g => filled[g.blankIndex] === undefined) ?? null;
        // A bank chip is used up once as many gaps with its word are filled as there are chips with that word before it.
        const filledWords = gaps.filter(g => filled[g.blankIndex] !== undefined).map(g => g.blank);
        const chipUsed = i => {
            const w = wordBank[i];
            const rank = wordBank.slice(0, i).filter(x => same(x, w)).length;
            return filledWords.filter(x => same(x, w)).length > rank;
        };
        function pick(i) {
            if (!current || chipUsed(i)) return;
            if (same(wordBank[i], current.blank)) {
                setFilled(f => ({ ...f, [current.blankIndex]: !missed.includes(current.blankIndex) }));
                setNotice({ ok: true, text: `Right! Gap ${current.blankIndex + 1} is “${current.blank}”.` });
            } else {
                setMissed(m => (m.includes(current.blankIndex) ? m : [...m, current.blankIndex]));
                setWrongChip(i); setTimeout(() => setWrongChip(c => (c === i ? null : c)), 700);
                setNotice({ ok: false, text: `Not “${wordBank[i]}”. Try again.` });
            }
        }
        function showAnswer() {
            if (!current) return;
            setFilled(f => ({ ...f, [current.blankIndex]: false }));
            setNotice({ ok: false, text: `Gap ${current.blankIndex + 1} is “${current.blank}”.` });
        }
        function restart() { setFilled({}); setMissed([]); setNotice(null); setWrongChip(null); }
        const done = Object.keys(filled).length;
        return (
            <LightFrame eyebrow="Complete the text" title={activity.topic || 'Fill the gaps'}
                extra={<span className="hidden sm:flex"><LightProgress index={Math.min(done, totalBlanks - 1)} total={totalBlanks} label="Gap" /></span>}
                onSave={hideSave ? undefined : () => setShowSave(true)}
                isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={!hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null}>
                <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-8 flex flex-col gap-4 sm:gap-5">
                    {/* The bank stays in view while a long text scrolls under it. */}
                    <div className="sticky top-0 z-10 bg-[#F6F7F9] pt-4 sm:pt-8 pb-1">
                        {lightDone ? (
                            <section aria-label="Results" className={`${LIGHT.card} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4`}>
                                <div className="flex-1">
                                    <p className={LIGHT.eyebrow}>All gaps done</p>
                                    <h1 className="font-display text-[24px] sm:text-[30px] font-semibold leading-tight">{lightScore} of {totalBlanks} right first time</h1>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button type="button" onClick={restart} className={LIGHT.primary}>Play again</button>
                                    {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                                </div>
                            </section>
                        ) : (
                            <section aria-label="Word bank" className={`${LIGHT.card} p-4 sm:p-5 flex flex-col gap-3`}>
                                <p className={LIGHT.eyebrow}>{current ? `Gap ${current.blankIndex + 1}: choose the word` : 'Word bank'}</p>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {wordBank.map((w, i) => {
                                        const used = chipUsed(i);
                                        return (
                                            <button key={i} type="button" onClick={() => pick(i)} disabled={used}
                                                className={`${L_CHIP_SIZES[fontSizeIdx]} min-h-12 rounded-xl px-4 py-2 font-semibold text-[#271D62]
                                                    ${used ? 'border border-[#DDE1E8] bg-[#F1F2F5] opacity-50 line-through cursor-default' : wrongChip === i ? LIGHT.wrong : 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] cursor-pointer'}`}>
                                                {w}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {notice && <p role="status" className={`flex-1 min-w-[200px] rounded-xl px-4 py-2.5 text-[16px] sm:text-[18px] ${notice.ok ? 'bg-[#E5F4EC] text-[#14532D]' : 'bg-[#FDECEA] text-[#7F1D1D]'}`}>{notice.text}</p>}
                                    <button type="button" onClick={showAnswer} className={`${LIGHT.secondary} ml-auto`}>Show answer</button>
                                </div>
                            </section>
                        )}
                    </div>

                    <section aria-label="Text" className={`${LIGHT.card} p-5 sm:p-8`}>
                        {activity.instruction && <p className={`${LIGHT.eyebrow} mb-3`}>{activity.instruction}</p>}
                        <p className={`${L_TEXT_SIZES[fontSizeIdx]} leading-loose`}>
                            {processedParts.map((part, i) => {
                                if (part.text !== undefined) return <span key={i}>{part.text}</span>;
                                const f = filled[part.blankIndex];
                                if (f !== undefined) {
                                    return <span key={i} data-gap-filled className={`font-bold mx-0.5 px-1 rounded ${f ? 'text-[#1E7A4C] bg-[#E5F4EC]' : 'text-[#1E7A4C] underline decoration-dotted'}`}>{part.blank}</span>;
                                }
                                const isCur = current && current.blankIndex === part.blankIndex;
                                return (
                                    <span key={i} data-gap={part.blankIndex + 1} data-current={isCur || undefined}
                                        className={`inline-block min-w-[72px] text-center mx-0.5 px-2 rounded-md text-[0.85em] font-semibold align-baseline
                                            ${isCur ? 'ring-2 ring-[#E0521F] bg-[#FFF5F0] text-[#E0521F]' : 'border-b-2 border-[#C9CED8] text-[#8A90A0]'}`}>
                                        {part.blankIndex + 1}
                                    </span>
                                );
                            })}
                        </p>
                    </section>
                </div>
            </LightFrame>
        );
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">{revealed.size} / {totalBlanks} revealed</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Main content */}
            {/* Top-aligned + scrollable, not centered — a long passage can't
                push "Reveal All"/"Close" off-screen on a phone. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-8 gap-6 overflow-y-auto py-8">

                {activity.instruction && (
                    <p className="text-white/50 text-sm uppercase tracking-widest">{activity.instruction}</p>
                )}

                {/* Word bank */}
                <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
                    {wordBank.map((word, i) => {
                        const isUsed = !processedParts.some(p => p.blank === word && !revealed.has(p.blankIndex));
                        return (
                            <span key={i} className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${
                                isUsed ? 'border-white/10 text-white/20 line-through' : 'border-white/30 text-white/80 bg-white/10'
                            }`}>{word}</span>
                        );
                    })}
                </div>

                {/* Passage */}
                <div className="max-w-4xl w-full rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 px-8 py-6">
                    <p className={`${textColor} ${FONT_SIZES[fontSizeIdx]} leading-relaxed`}>
                        {processedParts.map((part, i) => {
                            if (part.text !== undefined) return <span key={i}>{part.text}</span>;
                            const isRev = revealed.has(part.blankIndex);
                            return isRev ? (
                                <mark key={i} className="bg-yellow-400/25 text-yellow-300 font-bold rounded px-1 not-italic">{part.blank}</mark>
                            ) : (
                                <button key={i} onClick={() => revealBlank(part.blankIndex)}
                                    className="inline-block border-b-2 border-white/50 hover:border-white text-white/30 hover:text-white/60 min-w-[70px] text-center transition-colors cursor-pointer mx-0.5 text-lg"
                                    title="Click to reveal">({part.blankIndex + 1})</button>
                            );
                        })}
                    </p>
                </div>

                {revealed.size < totalBlanks && (
                    <button onClick={revealAll} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Reveal All</button>
                )}
                {revealed.size === totalBlanks && (
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Close</button>
                )}
            </div>
        </div>
    );
}
