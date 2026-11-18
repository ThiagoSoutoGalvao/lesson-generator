import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const LETTERS = ['A', 'B', 'C', 'D'];
// Light (Aurora Business) sizes — the same steps as the light Cloze.
const L_TEXT_SIZES = ['text-[17px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[28px]', 'text-[27px] sm:text-[32px]'];
const L_OPT_SIZES  = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];

// Cambridge-style Multiple Choice Cloze: a connected passage with gaps, four
// options per gap. Click an option to answer it (quiz-style green/red feedback);
// the passage fills in with the correct word.
export default function McClozeActivity({ activity, onClose, onComplete, hideSave }) {
    const [answers, setAnswers]        = useState({});   // blankIndex -> chosen option string
    const [bgUrl, setBgUrl]            = useState(null);
    const [showSave, setShowSave]      = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    // Aurora Business light layout: gaps in order (current one ringed), its options in a panel that stays at the top;
    // a wrong option turns red and the group tries again; score = right first time.
    const light = useIsLightUi();
    const [tried, setTried]   = useState({}); // light: blankIndex → wrong options tried
    const [notice, setNotice] = useState(null);

    const processedParts = useMemo(() => {
        let counter = 0;
        return (activity.parts ?? []).map(part =>
            part.blank !== undefined ? { ...part, blankIndex: counter++ } : part
        );
    }, [activity]);

    const blanks = processedParts.filter(p => p.blank !== undefined);
    const totalBlanks = blanks.length;
    const score = light
        ? blanks.reduce((n, b) => n + (answers[b.blankIndex] === b.blank && !(tried[b.blankIndex]?.length) ? 1 : 0), 0)
        : blanks.reduce((n, b) => n + (answers[b.blankIndex] === b.blank ? 1 : 0), 0);
    const answeredCount = Object.keys(answers).length;
    const complete = totalBlanks > 0 && answeredCount === totalBlanks;

    useEffect(() => {
        if (light) return;
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    // Student app (Phase S3): record the attempt once every gap is answered.
    useEffect(() => {
        if (complete) onComplete?.({ score, maxScore: totalBlanks });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complete]);

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function answer(blankIndex, option) {
        setAnswers(a => (a[blankIndex] !== undefined ? a : { ...a, [blankIndex]: option }));
    }

    if (light) {
        const current = blanks.find(b => answers[b.blankIndex] === undefined) ?? null;
        const triedHere = current ? (tried[current.blankIndex] ?? []) : [];
        function pick(opt) {
            if (!current || triedHere.includes(opt)) return;
            if (opt === current.blank) {
                setAnswers(a => ({ ...a, [current.blankIndex]: opt }));
                setNotice({ ok: true, text: `Right! Gap ${current.blankIndex + 1} is “${opt}”.` });
            } else {
                setTried(t => ({ ...t, [current.blankIndex]: [...(t[current.blankIndex] ?? []), opt] }));
                setNotice({ ok: false, text: `Not “${opt}”. Try again.` });
            }
        }
        function showAnswer() {
            if (!current) return;
            setTried(t => ({ ...t, [current.blankIndex]: [...(t[current.blankIndex] ?? []), '__shown'] }));
            setAnswers(a => ({ ...a, [current.blankIndex]: current.blank }));
            setNotice({ ok: false, text: `Gap ${current.blankIndex + 1} is “${current.blank}”.` });
        }
        function restart() { setAnswers({}); setTried({}); setNotice(null); }
        return (
            <LightFrame eyebrow="Choose the right word" title={activity.topic || 'Complete the text'}
                extra={<span className="hidden sm:flex"><LightProgress index={Math.min(answeredCount, totalBlanks - 1)} total={totalBlanks} label="Gap" /></span>}
                onSave={hideSave ? undefined : () => setShowSave(true)}
                isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={!hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null}>
                <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-8 flex flex-col gap-4 sm:gap-5">
                    {/* The options stay in view while a long text scrolls under them. */}
                    <div className="sticky top-0 z-10 bg-[#F6F7F9] pt-4 sm:pt-8 pb-1">
                        {complete ? (
                            <section aria-label="Results" className={`${LIGHT.card} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4`}>
                                <div className="flex-1">
                                    <p className={LIGHT.eyebrow}>All gaps done</p>
                                    <h1 className="font-display text-[24px] sm:text-[30px] font-semibold leading-tight">{score} of {totalBlanks} right first time</h1>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button type="button" onClick={restart} className={LIGHT.primary}>Play again</button>
                                    {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                                </div>
                            </section>
                        ) : current && (
                            <section aria-label="Options" className={`${LIGHT.card} p-4 sm:p-5 flex flex-col gap-3`}>
                                <p className={LIGHT.eyebrow}>Gap {current.blankIndex + 1}: choose the right word</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    {(current.options ?? []).map((opt, oi) => {
                                        const wrong = triedHere.includes(opt);
                                        return (
                                            <button key={oi} type="button" onClick={() => pick(opt)} disabled={wrong}
                                                className={`${L_OPT_SIZES[fontSizeIdx]} min-h-12 rounded-xl px-3 py-2 font-semibold text-[#271D62] flex items-center gap-2
                                                    ${wrong ? `${LIGHT.wrong} line-through cursor-default` : 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] cursor-pointer'}`}>
                                                <span className="text-[13px] text-[#4A5163] font-semibold">{LETTERS[oi]}</span>
                                                <span className="min-w-0 break-words">{opt}</span>
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
                                if (answers[part.blankIndex] !== undefined) {
                                    const first = !(tried[part.blankIndex]?.length);
                                    return <span key={i} data-gap-filled className={`font-bold mx-0.5 px-1 rounded text-[#1E7A4C] ${first ? 'bg-[#E5F4EC]' : 'underline decoration-dotted'}`}>{part.blank}</span>;
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
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <span className="text-white/70 text-sm font-medium">{score} / {totalBlanks} correct · {answeredCount} answered</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {activity.instruction && (
                <p className="relative z-10 text-white/50 text-sm uppercase tracking-widest text-center px-8 pb-2 shrink-0">{activity.instruction}</p>
            )}

            {/* Main content — split screen on desktop so the options never need scrolling to reach */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-6 md:px-12 pb-6 overflow-hidden">

                {/* Passage panel */}
                <div className="md:w-[44%] shrink-0 bg-white/8 border border-white/15 rounded-2xl p-6 overflow-y-auto">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Passage</p>
                    <p className={`${textColor} ${FONT_SIZES[fontSizeIdx]} leading-loose`}>
                        {processedParts.map((part, i) => {
                            if (part.text !== undefined) return <span key={i}>{part.text}</span>;
                            const chosen = answers[part.blankIndex];
                            if (chosen === undefined) {
                                return <span key={i} className="font-bold text-white/45 mx-0.5">({part.blankIndex + 1})</span>;
                            }
                            const ok = chosen === part.blank;
                            return (
                                <span key={i} className="mx-0.5">
                                    <mark className={`rounded px-1 not-italic font-bold ${ok ? 'bg-green-500/25 text-green-200' : 'bg-red-500/25 text-red-200 line-through'}`}>{chosen}</mark>
                                    {!ok && <mark className="rounded px-1 not-italic font-bold bg-green-500/25 text-green-200 ml-1">{part.blank}</mark>}
                                </span>
                            );
                        })}
                    </p>
                </div>

                {/* Options panel, one row per gap */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                        {blanks.map(b => {
                            const chosen = answers[b.blankIndex];
                            const done = chosen !== undefined;
                            return (
                                <div key={b.blankIndex} className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-white/50 text-base font-bold w-6 shrink-0">{b.blankIndex + 1}</span>
                                    {(b.options ?? []).map((opt, oi) => {
                                        const isCorrect = opt === b.blank;
                                        const isChosen = opt === chosen;
                                        let cls = 'bg-white/10 border-white/20 text-white/85 hover:bg-white/20';
                                        if (done && isCorrect) cls = 'bg-green-500/30 border-green-400/60 text-green-100';
                                        else if (done && isChosen) cls = 'bg-red-500/30 border-red-400/60 text-red-100';
                                        else if (done) cls = 'bg-white/5 border-white/10 text-white/35';
                                        return (
                                            <button
                                                key={oi}
                                                onClick={() => answer(b.blankIndex, opt)}
                                                disabled={done}
                                                className={`text-base font-semibold border rounded-xl px-4 py-2.5 transition-colors ${done ? 'cursor-default' : 'cursor-pointer'} ${cls}`}
                                            >
                                                <span className="text-white/40 mr-2">{LETTERS[oi]}</span>{opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {totalBlanks > 0 && answeredCount === totalBlanks && (
                        <button onClick={onClose} className="self-start bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">
                            Done — {score} / {totalBlanks}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
