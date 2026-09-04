import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl'];
const LETTERS = ['A', 'B', 'C', 'D'];

// Cambridge-style Multiple Choice Cloze: a connected passage with gaps, four
// options per gap. Click an option to answer it (quiz-style green/red feedback);
// the passage fills in with the correct word.
export default function McClozeActivity({ activity, onClose }) {
    const [answers, setAnswers]        = useState({});   // blankIndex -> chosen option string
    const [bgUrl, setBgUrl]            = useState(null);
    const [showSave, setShowSave]      = useState(false);
    const [fontSizeIdx, setFontSizeIdx] = useState(1);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const processedParts = useMemo(() => {
        let counter = 0;
        return (activity.parts ?? []).map(part =>
            part.blank !== undefined ? { ...part, blankIndex: counter++ } : part
        );
    }, [activity]);

    const blanks = processedParts.filter(p => p.blank !== undefined);
    const totalBlanks = blanks.length;
    const score = blanks.reduce((n, b) => n + (answers[b.blankIndex] === b.blank ? 1 : 0), 0);
    const answeredCount = Object.keys(answers).length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function answer(blankIndex, option) {
        setAnswers(a => (a[blankIndex] !== undefined ? a : { ...a, [blankIndex]: option }));
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <span className="text-white/70 text-sm font-medium">{score} / {totalBlanks} correct · {answeredCount} answered</span>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(FONT_SIZES.length - 1, i + 1))} disabled={fontSizeIdx === FONT_SIZES.length - 1}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Larger text">A+</button>
                    </div>
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-4xl mx-auto flex flex-col gap-5">

                    {activity.instruction && (
                        <p className="text-white/50 text-sm uppercase tracking-widest text-center">{activity.instruction}</p>
                    )}

                    {/* Passage */}
                    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 px-8 py-6">
                        <p className={`text-white ${FONT_SIZES[fontSizeIdx]} leading-loose`}>
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

                    {/* Options, one row per gap */}
                    <div className="rounded-2xl bg-black/25 backdrop-blur-sm border border-white/15 px-6 py-5 flex flex-col gap-3">
                        {blanks.map(b => {
                            const chosen = answers[b.blankIndex];
                            const done = chosen !== undefined;
                            return (
                                <div key={b.blankIndex} className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white/50 text-sm font-bold w-6 shrink-0">{b.blankIndex + 1}</span>
                                    {(b.options ?? []).map((opt, oi) => {
                                        const isCorrect = opt === b.blank;
                                        const isChosen = opt === chosen;
                                        let cls = 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20';
                                        if (done && isCorrect) cls = 'bg-green-500/30 border-green-400/60 text-green-100';
                                        else if (done && isChosen) cls = 'bg-red-500/30 border-red-400/60 text-red-100';
                                        else if (done) cls = 'bg-white/5 border-white/10 text-white/35';
                                        return (
                                            <button
                                                key={oi}
                                                onClick={() => answer(b.blankIndex, opt)}
                                                disabled={done}
                                                className={`text-sm font-medium border rounded-lg px-3 py-1.5 transition-colors ${done ? 'cursor-default' : 'cursor-pointer'} ${cls}`}
                                            >
                                                <span className="text-white/40 mr-1.5">{LETTERS[oi]}</span>{opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {totalBlanks > 0 && answeredCount === totalBlanks && (
                        <button onClick={onClose} className="self-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">
                            Done — {score} / {totalBlanks}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
