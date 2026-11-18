import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';

const FONT_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
// Light (Aurora Business) tile and reason text, indexed by the Display panel's size.
const L_TILE_SIZES = ['text-[19px]', 'text-[21px] sm:text-[24px]', 'text-[23px] sm:text-[28px]', 'text-[26px] sm:text-[32px]', 'text-[29px] sm:text-[36px]'];
const L_WHY_SIZES  = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];

export default function OddOneOutActivity({ activity, onClose, onComplete, hideSave }) {
    const [groupIndex, setGroupIndex] = useState(0);
    const [wrongIdx, setWrongIdx]     = useState(null);
    const [revealed, setRevealed]     = useState(false);
    const [finished, setFinished]     = useState(false);
    const [bgUrl, setBgUrl]           = useState(null);
    const [showSave, setShowSave]     = useState(false);
    const { sizeIdx: fontSizeIdx } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const wrongTimer = useRef(null);
    const light = useIsLightUi(); // Aurora Business: the light layout below (no photo)
    const [tried, setTried]     = useState([]);    // light: wrong words tapped in this group (they stay marked)
    const [whyShown, setWhyShown] = useState(false); // light: the reason stays hidden until "Show why"

    const groups = activity.groups;
    const group  = groups[groupIndex];
    const total  = groups.length;

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

    useEffect(() => () => clearTimeout(wrongTimer.current), []);

    // Student app (Phase S3): completion only — Odd One Out keeps no score.
    useEffect(() => {
        if (finished) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function handleGuess(word, idx) {
        if (revealed) return;
        if (word === group.odd_one) {
            setRevealed(true);
        } else {
            setTried(t => (t.includes(idx) ? t : [...t, idx]));
            setWrongIdx(idx);
            clearTimeout(wrongTimer.current);
            wrongTimer.current = setTimeout(() => setWrongIdx(null), 600);
        }
    }

    function handleReveal() { setRevealed(true); }

    function handleNext() {
        if (groupIndex + 1 >= total) {
            setFinished(true);
        } else {
            setGroupIndex(g => g + 1);
            setRevealed(false);
            setWrongIdx(null);
            setTried([]); setWhyShown(false);
        }
    }

    function handleRestart() {
        setGroupIndex(0); setRevealed(false); setFinished(false); setWrongIdx(null); setTried([]); setWhyShown(false);
    }

    if (light) {
        const frame = {
            eyebrow: 'Odd one out', title: activity.topic || 'Which one doesn’t belong?',
            onSave: hideSave ? undefined : () => setShowSave(true),
            isFullscreen, onFullscreen: toggleFullscreen, onClose,
            overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
        };
        if (finished) {
            return (
                <LightFrame {...frame}>
                    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
                        <section className={`${LIGHT.card} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="Results">
                            <p className={LIGHT.eyebrow}>All done</p>
                            <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-tight">{total} groups finished</h1>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                <button type="button" onClick={handleRestart} className={LIGHT.primary}>Start again</button>
                                {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                            </div>
                        </section>
                    </div>
                </LightFrame>
            );
        }
        return (
            <LightFrame {...frame} extra={<span className="hidden sm:flex"><LightProgress index={groupIndex} total={total} label="Group" /></span>}>
                <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col gap-4 sm:gap-5">
                    <section aria-label="Words" className={`${LIGHT.card} p-5 sm:p-8 flex flex-col gap-5`}>
                        <p className={LIGHT.eyebrow}><span className="sm:hidden">Group {groupIndex + 1} of {total} · </span>Which one doesn’t belong?</p>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {group.words.map((word, idx) => {
                                const isOdd = word === group.odd_one;
                                const wasTried = tried.includes(idx);
                                let box = 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] cursor-pointer';
                                if (revealed && isOdd) box = `${LIGHT.right} cursor-default`;
                                else if (wasTried) box = `${LIGHT.wrong} line-through decoration-2 cursor-default`;
                                else if (revealed) box = 'border border-[#DDE1E8] bg-white opacity-55 cursor-default';
                                return (
                                    <button key={idx} type="button" onClick={() => handleGuess(word, idx)} disabled={revealed || wasTried}
                                        data-odd={revealed && isOdd ? '' : undefined} data-tried={wasTried ? '' : undefined}
                                        className={`${box} ${L_TILE_SIZES[fontSizeIdx]} min-h-20 sm:min-h-28 rounded-2xl px-3 py-4 font-semibold text-[#271D62] text-center break-words`}>
                                        {word}
                                    </button>
                                );
                            })}
                        </div>
                        {revealed && !whyShown && <p role="status" className="text-[17px] sm:text-[19px] text-[#14532D] font-semibold">“{group.odd_one}” is the odd one out. Why? Say it, then check.</p>}
                    </section>

                    {revealed && whyShown && (
                        <section aria-label="Why" className="rounded-xl bg-[#E5F4EC] px-4 sm:px-5 py-3.5">
                            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#14532D] mb-1">Why?</p>
                            <p className={`${L_WHY_SIZES[fontSizeIdx]} text-[#14532D] leading-snug`}>{group.reason}</p>
                        </section>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
                        {!revealed && <button type="button" onClick={handleReveal} className={LIGHT.secondary}>Show answer</button>}
                        {revealed && !whyShown && <button type="button" onClick={() => setWhyShown(true)} className={LIGHT.secondary}>Show why</button>}
                        {revealed && <button type="button" onClick={handleNext} className={LIGHT.primary}>{groupIndex + 1 < total ? 'Next group' : 'Finish'}</button>}
                    </div>
                </div>
            </LightFrame>
        );
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">All done!</h2>
                    <p className="text-xl text-white/70">Completed all {total} groups</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => { setGroupIndex(0); setRevealed(false); setFinished(false); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Start Over</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">Group {groupIndex + 1} / {total}</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(groupIndex / total) * 100}%` }} />
                </div>
            </div>

            {/* Main content */}
            {/* Top-aligned + scrollable, not centered — the 4 word tiles plus
                the "Why?" panel can't push Next off-screen on a phone. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-8 gap-8 overflow-y-auto py-8">
                <p className="text-white/50 text-sm uppercase tracking-widest">Which one doesn't belong?</p>

                {/* Single column on a phone — same reasoning as Quiz's option
                    grid: a 2-column grid sizes each row by its tallest cell. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                    {group.words.map((word, idx) => {
                        const isOdd   = word === group.odd_one;
                        const isWrong = wrongIdx === idx;
                        let tileClass = 'bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 hover:border-white/50 text-white cursor-pointer';

                        if (revealed) {
                            tileClass = isOdd
                                ? 'bg-green-500/40 border-green-400 text-white scale-105'
                                : 'bg-white/5 border-white/10 text-white/30 cursor-default';
                        } else if (isWrong) {
                            tileClass = 'bg-red-500/40 border-red-400 text-white animate-pulse cursor-pointer';
                        }

                        return (
                            <button key={idx} onClick={() => handleGuess(word, idx)} disabled={revealed}
                                className={`rounded-2xl py-8 px-6 ${FONT_SIZES[fontSizeIdx]} font-bold text-center transition-all duration-200 border-2 ${tileClass}`}>
                                {word}
                            </button>
                        );
                    })}
                </div>

                {revealed && (
                    <div className="max-w-lg w-full rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 px-6 py-4 text-center">
                        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Why?</p>
                        <p className="text-white text-base">{group.reason}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    {!revealed && (
                        <button onClick={handleReveal} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Reveal</button>
                    )}
                    {revealed && (
                        <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">
                            {groupIndex + 1 < total ? 'Next →' : 'Finish'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
