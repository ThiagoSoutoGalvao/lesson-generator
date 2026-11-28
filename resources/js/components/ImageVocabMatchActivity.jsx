import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LIGHT } from '@/components/light/LightFrame';

// Word-tile text size for the shared Display panel's 5 steps (step 3, the default, is the original size).
const TILE_SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
const L_TILE_SIZES = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function ImageVocabMatchActivity({ activity, onClose, onComplete, hideSave }) {
    const pairs = activity.pairs;
    const total = pairs.length;

    const [imageUrls, setImageUrls]   = useState(Array(total).fill(null));
    const [wordOrder, setWordOrder]   = useState(() => shuffle(pairs.map((_, i) => i)));
    const [selected, setSelected]     = useState(null);   // index into wordOrder
    const [matched, setMatched]       = useState({});     // { imageIdx: word }
    const [wrongImage, setWrongImage] = useState(null);
    const [finished, setFinished]     = useState(false);
    const [showSave, setShowSave]     = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const { sizeIdx } = useDisplay();
    // Aurora Business light layout: words on top, photos below with the word UNDER the photo once matched (never on it).
    // Scored there: a word that was tried on a wrong photo no longer counts as right first time.
    const light = useIsLightUi();
    const [missed, setMissed] = useState([]); // light: pair indexes whose word was tried on a wrong photo

    useEffect(() => {
        let cancelled = false;
        const batchSize = 4;

        async function loadImages() {
            for (let i = 0; i < pairs.length; i += batchSize) {
                if (cancelled) break;
                const batch = pairs.slice(i, i + batchSize);
                await Promise.all(
                    batch.map((pair, j) =>
                        // Photo first (2026-11-24): the photo Claude checked against the word is saved with it.
                        (pair.photo ? Promise.resolve({ data: { url: pair.photo } }) : axios.get('/api/background', { params: { topic: pair.keyword } }))
                            .then(({ data }) => {
                                if (!cancelled) setImageUrls(prev => {
                                    const next = [...prev];
                                    next[i + j] = data.url;
                                    return next;
                                });
                            })
                            .catch(() => null)
                    )
                );
            }
        }

        loadImages();
        return () => { cancelled = true; };
    }, []);

    // Student app (Phase S3): completion only — you can't finish without every
    // pair matched, so there's no meaningful score to record.
    useEffect(() => {
        if (finished) onComplete?.(light ? { score: total - missed.length, maxScore: total } : {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Escape') setSelected(null);
            if (e.code === 'KeyF')   toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function handleWordClick(orderIdx) {
        setSelected(prev => prev === orderIdx ? null : orderIdx);
    }

    function handleImageClick(imageIdx) {
        if (matched[imageIdx] !== undefined || selected === null) return;

        const selectedOriginalIdx = wordOrder[selected];
        const isCorrect = selectedOriginalIdx === imageIdx;

        if (isCorrect) {
            const newMatched = { ...matched, [imageIdx]: pairs[imageIdx].word };
            setMatched(newMatched);
            setWordOrder(prev => prev.filter((_, i) => i !== selected));
            setSelected(null);
            if (Object.keys(newMatched).length === total) setFinished(true);
        } else {
            setMissed(m => (m.includes(selectedOriginalIdx) ? m : [...m, selectedOriginalIdx]));
            setWrongImage(imageIdx);
            setTimeout(() => setWrongImage(null), 600);
        }
    }

    function handleReset() {
        setWordOrder(shuffle(pairs.map((_, i) => i)));
        setMatched({});
        setSelected(null);
        setFinished(false);
        setMissed([]);
    }

    if (light) {
        const frame = {
            eyebrow: 'Match the pictures', title: activity.topic || 'Match each word to its picture',
            onSave: hideSave ? undefined : () => setShowSave(true),
            isFullscreen, onFullscreen: toggleFullscreen, onClose,
            overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
            extra: <span className="hidden sm:inline text-[15px] font-semibold text-[#4A5163]">{Object.keys(matched).length} of {total} matched</span>,
        };
        const selWord = selected !== null ? pairs[wordOrder[selected]]?.word : null;
        return (
            <LightFrame {...frame}>
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 pb-8 flex flex-col gap-4 sm:gap-5">
                    <div className="sticky top-0 z-10 bg-[#F6F7F9] pt-4 sm:pt-8 pb-1">
                        {finished ? (
                            <section aria-label="Results" className={`${LIGHT.glowCard} p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4`}>
                                <div className="flex-1">
                                    <p className={LIGHT.chip}>All matched</p>
                                    <h1 className="font-display text-[24px] sm:text-[30px] font-semibold leading-tight">{total - missed.length} of {total} right first time</h1>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button type="button" onClick={handleReset} className={LIGHT.primary}>Play again</button>
                                    {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                                </div>
                            </section>
                        ) : (
                            <section aria-label="Words" className={`${LIGHT.card} p-4 sm:p-5 flex flex-col gap-3`}>
                                <p className={LIGHT.chip}>{selWord ? `“${selWord}” — now tap its picture` : 'Choose a word, then its picture'}</p>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {wordOrder.map((originalIdx, orderIdx) => (
                                        <button key={originalIdx} type="button" onClick={() => handleWordClick(orderIdx)} aria-pressed={selected === orderIdx}
                                            className={`${L_TILE_SIZES[sizeIdx]} min-h-12 rounded-xl px-4 py-2 font-semibold text-[#271D62] cursor-pointer
                                                ${selected === orderIdx ? 'ring-2 ring-[#E0521F] border border-[#E0521F] bg-[#FFF5F0]' : 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9]'}`}>
                                            {pairs[originalIdx].word}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <section aria-label="Pictures" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {pairs.map((pair, idx) => {
                            const isMatched = matched[idx] !== undefined;
                            const isWrong = wrongImage === idx;
                            const canClick = selected !== null && !isMatched;
                            return (
                                <button key={idx} type="button" onClick={() => handleImageClick(idx)} disabled={isMatched}
                                    aria-label={isMatched ? `Picture ${idx + 1}: ${matched[idx]}` : `Picture ${idx + 1}`}
                                    data-matched={isMatched || undefined}
                                    className={`${LIGHT.card} overflow-hidden flex flex-col text-left transition-all
                                        ${isMatched ? '!border-2 !border-[#1E7A4C] cursor-default' : isWrong ? '!border-2 !border-[#B42318] scale-[0.98]' : canClick ? 'hover:ring-2 hover:ring-[#E0521F] cursor-pointer' : 'cursor-default'}`}>
                                    <div className="relative aspect-[4/3] bg-[#E9ECF1]">
                                        {imageUrls[idx] && <img src={imageUrls[idx]} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                                    </div>
                                    <div className={`px-3 py-2.5 flex items-center gap-2 min-h-12 ${isMatched ? 'bg-[#E5F4EC]' : ''}`}>
                                        <span className="shrink-0 w-7 h-7 rounded-lg bg-[#F1F2F5] text-[#4A5163] text-[13px] font-semibold grid place-items-center">{idx + 1}</span>
                                        {isMatched && <span className={`${L_TILE_SIZES[Math.max(0, sizeIdx - 1)]} font-semibold text-[#14532D] min-w-0 break-words`}>{matched[idx]}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </section>
                </div>
            </LightFrame>
        );
    }

    const gridCols = total <= 4 ? 'grid-cols-2' : total <= 6 ? 'grid-cols-3' : 'grid-cols-4';
    const bgStyle  = { background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' };

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={bgStyle}>
                <div className="absolute inset-0 bg-black/65" />
                <div className="relative z-10 text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Complete!</h2>
                    <p className="text-xl text-gray-300">All {total} words matched correctly.</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            Try Again
                        </button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/65" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">
                        {Object.keys(matched).length} / {total} matched
                    </span>
                </div>
                <div className="flex items-center gap-5">
                    {/* colours here mean matched / wrong, so the shared text-colour picker is hidden */}
                    <DisplayControls colors={false} />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Word tiles — at top, clickable */}
            <div className="relative z-10 px-6 pt-2 pb-3 flex flex-col items-center gap-2 shrink-0">
                <div className="flex flex-wrap gap-2 justify-center">
                    {wordOrder.map((originalIdx, orderIdx) => (
                        <button
                            key={originalIdx}
                            onClick={() => handleWordClick(orderIdx)}
                            className={`px-5 py-2.5 rounded-xl font-semibold ${TILE_SIZES[sizeIdx]} border-2 transition-all duration-150 cursor-pointer
                                ${selected === orderIdx
                                    ? 'bg-blue-500 border-blue-400 text-white scale-105 shadow-lg shadow-blue-500/30'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40'}
                            `}
                        >
                            {pairs[originalIdx].word}
                        </button>
                    ))}
                </div>
                {selected !== null && (
                    <p className="text-white/50 text-xs">
                        Click an image to match <span className="text-white font-semibold">"{pairs[wordOrder[selected]].word}"</span> — or click the word again to deselect
                    </p>
                )}
            </div>

            {/* Image grid */}
            <div className={`relative z-10 flex-1 grid ${gridCols} auto-rows-fr gap-3 px-6 pb-4 overflow-hidden`}>
                {pairs.map((pair, idx) => {
                    const isMatched = matched[idx] !== undefined;
                    const isWrong   = wrongImage === idx;
                    const canClick  = selected !== null && !isMatched;

                    return (
                        <button
                            key={idx}
                            onClick={() => handleImageClick(idx)}
                            disabled={isMatched}
                            className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-150
                                ${isMatched  ? 'border-green-400 cursor-default' :
                                  isWrong    ? 'border-red-400 scale-95 cursor-pointer' :
                                  canClick   ? 'border-white/50 hover:border-white cursor-pointer' :
                                               'border-white/15 cursor-default'}
                            `}
                        >
                            {imageUrls[idx]
                                ? <img src={imageUrls[idx]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-white/10 animate-pulse" />
                            }
                            <div className={`absolute inset-0 transition-colors duration-150
                                ${isMatched ? 'bg-green-500/25' : isWrong ? 'bg-red-500/40' : 'bg-black/20'}
                            `} />

                            {/* Number badge */}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white font-bold text-sm w-7 h-7 rounded-lg flex items-center justify-center">
                                {idx + 1}
                            </div>

                            {isMatched && (
                                <div className="absolute inset-0 flex items-end justify-center pb-3">
                                    <span className="bg-green-500 text-white font-bold px-4 py-1.5 rounded-xl text-sm shadow-lg">
                                        {matched[idx]}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
