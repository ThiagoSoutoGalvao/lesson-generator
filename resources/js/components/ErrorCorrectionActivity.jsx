import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';

const FONT_SIZES         = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const PASSAGE_SIZES      = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const EXPLANATION_SIZES  = ['text-lg', 'text-xl',  'text-2xl', 'text-3xl', 'text-4xl'];
// Light (Aurora Business) list and passage text, indexed by the Display panel's size.
const L_LINE_SIZES       = ['text-[17px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[28px]', 'text-[27px] sm:text-[32px]'];
const L_WHY_SIZES        = ['text-[15px]', 'text-[16px] sm:text-[18px]', 'text-[18px] sm:text-[20px]', 'text-[20px] sm:text-[23px]', 'text-[23px] sm:text-[26px]'];

// One mistake, drawn three ways: 'plain' (students look for it), 'where' (underlined), 'fixed' (struck + correction).
function LightMark({ error, correction, state, markRef }) {
    if (state === 'fixed') return (
        <span ref={markRef}>
            <span className="line-through decoration-2 text-[#B42318] mx-0.5" data-error>{error}</span>
            <span className="font-bold text-[#1E7A4C] mx-0.5" data-correction>{correction}</span>
        </span>
    );
    if (state === 'where') return <span ref={markRef} data-where className="underline decoration-[#E0521F] decoration-[3px] underline-offset-4 font-semibold">{error}</span>;
    return <span ref={markRef}>{error}</span>;
}

function lightSentence(sentence, error, correction, state, markRef) {
    const at = error ? sentence.indexOf(error) : -1;
    if (at === -1) return sentence;
    return <>{sentence.slice(0, at)}<LightMark error={error} correction={correction} state={state} markRef={markRef} />{sentence.slice(at + error.length)}</>;
}

// Split a passage into text/error segments. Each item's error is matched to the
// next unclaimed occurrence in reading order, so repeated error strings still
// map to distinct positions. Unmatched errors (shouldn't happen — the backend
// filters them — but be safe) are simply left un-highlighted.
function buildSegments(passage, items) {
    const marks = [];
    let searchFrom = 0;
    items.forEach((item, i) => {
        if (!item.error) return;
        const at = passage.indexOf(item.error, searchFrom);
        if (at === -1) return;
        marks.push({ start: at, end: at + item.error.length, itemIndex: i });
        searchFrom = at + item.error.length;
    });
    marks.sort((a, b) => a.start - b.start);

    const segments = [];
    let cursor = 0;
    for (const m of marks) {
        if (m.start > cursor) segments.push({ text: passage.slice(cursor, m.start), itemIndex: null });
        segments.push({ text: passage.slice(m.start, m.end), itemIndex: m.itemIndex });
        cursor = m.end;
    }
    if (cursor < passage.length) segments.push({ text: passage.slice(cursor), itemIndex: null });
    return segments;
}

export default function ErrorCorrectionActivity({ activity, onClose, onComplete, hideSave }) {
    const [index, setIndex]             = useState(0);
    const [revealed, setRevealed]       = useState(false);
    const [shown, setShown]             = useState(false); // light: "Show where" pressed for this item
    const [bgUrl, setBgUrl]             = useState(null);
    const [showSave, setShowSave]       = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below (no photo — the sentences are the task)

    const items = activity.items;
    const item  = items[index];
    const total = items.length;

    const isPassage = typeof activity.passage === 'string' && activity.passage.trim() !== '';
    const segments  = isPassage ? buildSegments(activity.passage, items) : null;
    const activeRef = useRef(null);

    useEffect(() => {
        if (light) return;
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); revealed ? handleNext() : setRevealed(true); }
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, revealed]);

    // keep the active error visible in the scrollable passage
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [index, revealed]);

    function handleNext() {
        if (index < total - 1) { setIndex(i => i + 1); setRevealed(false); setShown(false); }
    }

    function handlePrev() {
        if (index > 0) { setIndex(i => i - 1); setRevealed(false); setShown(false); }
    }

    function handleRestart() {
        setIndex(0); setRevealed(false); setShown(false);
    }

    // Student app (Phase S4): reveal-only, no end screen — completion fires when
    // the student reveals the correction on the last item.
    useEffect(() => {
        if (index === total - 1 && revealed) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, revealed]);

    function renderSentence(sentence, error, correction, isRevealed) {
        const parts = sentence.split(error);
        if (parts.length < 2) return <span>{sentence}</span>;
        return (
            <>
                {parts[0]}
                {isRevealed ? (
                    <>
                        <span className="line-through text-red-400 mx-1">{error}</span>
                        <span className="text-green-300 font-bold mx-1">{correction}</span>
                    </>
                ) : (
                    <span className="border-b-2 border-red-400/60 text-white">{error}</span>
                )}
                {parts.slice(1).join(error)}
            </>
        );
    }

    // Passage mode — render each segment, styled by how far the student has got.
    function renderPassage() {
        return segments.map((seg, i) => {
            if (seg.itemIndex === null) return <span key={i}>{seg.text}</span>;

            const done   = seg.itemIndex < index;
            const active = seg.itemIndex === index;
            const it     = items[seg.itemIndex];

            if (done || (active && revealed)) {
                return (
                    <span key={i} ref={active ? activeRef : null}>
                        <span className="line-through text-red-400 mx-0.5">{seg.text}</span>
                        <span className="text-green-300 font-bold mx-0.5">{it.correction}</span>
                    </span>
                );
            }
            if (active) {
                return (
                    <span key={i} ref={activeRef}
                        className="rounded-md bg-white/20 ring-2 ring-yellow-300/80 px-1 mx-0.5 text-white">
                        {seg.text}
                    </span>
                );
            }
            // upcoming error — leave it in the text, unmarked
            return <span key={i}>{seg.text}</span>;
        });
    }

    if (light) {
        const stateOf = i => (i < index || (i === index && revealed) ? 'fixed' : i === index && shown ? 'where' : 'plain');
        const last = index === total - 1;
        return (
            <LightFrame
                eyebrow="Error correction"
                title={activity.topic || 'Find and correct the mistakes'}
                extra={<span className="hidden sm:flex"><LightProgress index={index} total={total} label={isPassage ? 'Mistake' : 'Sentence'} /></span>}
                onSave={hideSave ? undefined : () => setShowSave(true)}
                isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={!hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col gap-4 sm:gap-5">
                    <p className={LIGHT.eyebrow}>{activity.instruction || (isPassage ? 'Find and correct the mistakes in the text' : 'Each sentence has one mistake. Find it and correct it.')}</p>

                    {isPassage ? (
                        <section aria-label="Text" className={`${LIGHT.card} p-5 sm:p-8`}>
                            <p className={`${L_LINE_SIZES[fontSizeIdx]} leading-loose whitespace-pre-line`}>
                                {segments.map((seg, i) => seg.itemIndex === null
                                    ? <span key={i}>{seg.text}</span>
                                    : <LightMark key={i} error={seg.text} correction={items[seg.itemIndex].correction} state={stateOf(seg.itemIndex)} markRef={seg.itemIndex === index ? activeRef : null} />)}
                            </p>
                        </section>
                    ) : (
                        <section aria-label="Sentences" className={`${LIGHT.card} p-3 sm:p-5`}>
                            <ol className="flex flex-col gap-1.5">
                                {items.map((it, i) => {
                                    const active = i === index; const done = i < index;
                                    return (
                                        <li key={i} ref={active ? activeRef : null} data-active={active || undefined}
                                            className={`flex gap-3 sm:gap-4 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 ${L_LINE_SIZES[fontSizeIdx]} leading-snug ${active ? 'ring-2 ring-[#E0521F] bg-[#FFF5F0]' : ''} ${!active && !done ? 'text-[#4A5163]' : ''}`}>
                                            <span className={`shrink-0 font-semibold tabular-nums ${active ? 'text-[#E0521F]' : 'text-[#4A5163]'}`}>{i + 1}.</span>
                                            <span className="flex-1 min-w-0 break-words">{lightSentence(it.sentence, it.error, it.correction, stateOf(i))}</span>
                                            {done && <span className="shrink-0 text-[#1E7A4C] font-bold" aria-label="corrected">✓</span>}
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    )}

                    {revealed && item.explanation && (
                        <section aria-label="Why" className="rounded-xl bg-[#E5F4EC] px-4 sm:px-5 py-3.5">
                            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#14532D] mb-1">Why?</p>
                            <p className={`${L_WHY_SIZES[fontSizeIdx]} text-[#14532D] leading-snug`}>{item.explanation}</p>
                        </section>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
                        {index > 0 && <button type="button" onClick={handlePrev} className={`${LIGHT.secondary} mr-auto`}>← Previous</button>}
                        {!revealed && <button type="button" onClick={() => setShown(true)} disabled={shown} className={`${LIGHT.secondary} disabled:opacity-50 disabled:cursor-default`}>Show where</button>}
                        {!revealed
                            ? <button type="button" onClick={() => setRevealed(true)} className={LIGHT.primary}>Show answer</button>
                            : last
                                ? <button type="button" onClick={handleRestart} className={LIGHT.secondary}>Start again</button>
                                : <button type="button" onClick={handleNext} className={LIGHT.primary}>Next →</button>}
                    </div>
                </div>
            </LightFrame>
        );
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/50" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">
                    {isPassage ? 'Mistake' : 'Sentence'} {index + 1} / {total}
                </span>
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
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </div>
            </div>

            {/* Main content — top-aligned + scrollable, not centered, so a long
                passage can't push the reveal/next buttons out of reach and
                can't trap its own top out of scroll range (see Claude.md's
                items-center/justify-center + overflow-y-auto note). Passage
                mode also drops the old inner max-h-[44vh] scroll box and
                widens the card — the passage now flows and stretches like the
                other reading templates instead of sitting boxed in the middle
                of the screen. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-8 py-6 gap-4 overflow-y-auto">
                <div className={`${isPassage ? 'max-w-4xl' : 'max-w-2xl'} w-full flex flex-col gap-4`}>

                    <p className="text-white/45 text-xs uppercase tracking-widest text-center">{activity.instruction}</p>

                    <div className="flex flex-col rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 overflow-hidden">

                        {isPassage ? (
                            <div className="px-8 py-8">
                                <p className={`${PASSAGE_SIZES[fontSizeIdx]} leading-loose whitespace-pre-line ${textColor}`}>
                                    {renderPassage()}
                                </p>
                            </div>
                        ) : (
                            <div className="px-8 py-10 flex items-center justify-center">
                                <p className={`${FONT_SIZES[fontSizeIdx]} leading-relaxed text-center ${textColor}`}>
                                    {renderSentence(item.sentence, item.error, item.correction, revealed)}
                                </p>
                            </div>
                        )}

                        {revealed && (
                            <div className="px-8 pt-8 pb-8 border-t border-white/10 bg-white/5">
                                <p className="text-white/45 text-xs uppercase tracking-widest mb-4">Why?</p>
                                <p className={`${EXPLANATION_SIZES[fontSizeIdx]} ${textColor} opacity-80 leading-relaxed`}>{item.explanation}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-4 shrink-0">
                        <button onClick={handlePrev} disabled={index === 0}
                            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer">← Prev</button>
                        {!revealed ? (
                            <button onClick={() => setRevealed(true)}
                                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Reveal</button>
                        ) : (
                            <button onClick={handleNext} disabled={index === total - 1}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors cursor-pointer">Next →</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
