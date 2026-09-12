import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES         = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const PASSAGE_SIZES      = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const EXPLANATION_SIZES  = ['text-lg', 'text-xl',  'text-2xl', 'text-3xl', 'text-4xl'];

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
    const [bgUrl, setBgUrl]             = useState(null);
    const [showSave, setShowSave]       = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const items = activity.items;
    const item  = items[index];
    const total = items.length;

    const isPassage = typeof activity.passage === 'string' && activity.passage.trim() !== '';
    const segments  = isPassage ? buildSegments(activity.passage, items) : null;
    const activeRef = useRef(null);

    useEffect(() => {
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
        if (index < total - 1) { setIndex(i => i + 1); setRevealed(false); }
    }

    function handlePrev() {
        if (index > 0) { setIndex(i => i - 1); setRevealed(false); }
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
