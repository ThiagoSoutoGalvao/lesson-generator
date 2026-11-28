import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LIGHT } from '@/components/light/LightFrame';

// Text sizes for the shared Display panel's 5 steps (step 3, the default, is the original size).
const TILE_SIZES = ['text-[11px]', 'text-xs', 'text-sm', 'text-base', 'text-lg'];
const HEAD_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
// Light (Aurora Business) sizes.
const L_TILE_SIZES = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[22px]', 'text-[21px] sm:text-[25px]', 'text-[24px] sm:text-[28px]'];
const L_HEAD_SIZES = ['text-[17px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[23px] sm:text-[27px]', 'text-[26px] sm:text-[30px]'];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function WordCategorisationActivity({ activity, onClose, onComplete, hideSave }) {
    // flat list of all words with their correct category
    const allWords = activity.categories.flatMap(cat =>
        cat.words.map(w => ({ text: w, correct: cat.name }))
    );
    const wordToCorrect = Object.fromEntries(allWords.map(w => [w.text, w.correct]));

    const [pool, setPool]         = useState(() => shuffle(allWords.map(w => w.text)));
    const [placements, setPlacements] = useState({}); // word → category name
    const [selected, setSelected] = useState(null);   // word currently selected by click
    const [checked, setChecked]   = useState(false);
    const [bgUrl, setBgUrl]       = useState(null);
    const [showSave, setShowSave] = useState(false);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const { sizeIdx } = useDisplay();
    const dragRef = useRef(null);
    // Aurora Business light layout: each word is checked as it's placed (students take turns, one word each); a wrong
    // one goes back to the pool and no longer counts as right first time.
    const light = useIsLightUi();
    const [missed, setMissed]   = useState([]);   // light: words placed wrong at least once
    const [notice, setNotice]   = useState(null); // light: { word, cat, ok } — what the last placement did
    const noticeTimer = useRef(null);
    useEffect(() => () => clearTimeout(noticeTimer.current), []);

    const allPlaced  = pool.length === 0;
    const score      = !checked ? 0
        : light ? allWords.filter(w => !missed.includes(w.text)).length
        : Object.entries(placements).filter(([w, cat]) => wordToCorrect[w] === cat).length;

    useEffect(() => {
        if (light) return;
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Escape') setSelected(null);
            if (e.code === 'KeyF')   toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Student app (Phase S3): record the attempt when the student checks answers.
    useEffect(() => {
        if (checked) onComplete?.({ score, maxScore: allWords.length });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checked]);

    // ── helpers ──────────────────────────────────────────────────────────────

    function placeWord(word, categoryName) {
        if (light) { placeAndCheck(word, categoryName); return; }
        setPool(prev => prev.filter(w => w !== word));
        setPlacements(prev => {
            const next = { ...prev };
            // if word was already in another category, just move it
            next[word] = categoryName;
            return next;
        });
        setSelected(null);
    }

    // Light: right → the word stays in that category for good; wrong → back to the pool, marked as missed.
    function placeAndCheck(word, categoryName) {
        if (checked || placements[word]) return;
        const ok = wordToCorrect[word] === categoryName;
        if (ok) {
            const left = pool.filter(w => w !== word);
            setPool(left);
            setPlacements(prev => ({ ...prev, [word]: categoryName }));
            if (left.length === 0) setChecked(true);
        } else {
            setMissed(m => (m.includes(word) ? m : [...m, word]));
        }
        setSelected(null);
        setNotice({ word, cat: categoryName, ok });
        clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(null), 2500);
    }

    function lightRestart() {
        setPool(shuffle(allWords.map(w => w.text))); setPlacements({}); setChecked(false); setSelected(null);
        setMissed([]); setNotice(null);
    }

    function returnToPool(word) {
        setPlacements(prev => {
            const next = { ...prev };
            delete next[word];
            return next;
        });
        setPool(prev => [...prev, word]);
        setSelected(null);
    }

    // ── drag handlers ─────────────────────────────────────────────────────────

    function onDragStartWord(e, word, source) {
        dragRef.current = { word, source };
        e.dataTransfer.effectAllowed = 'move';
    }

    function onDropCategory(e, categoryName) {
        e.preventDefault();
        const { word, source } = dragRef.current || {};
        if (!word) return;
        if (source === categoryName) return;
        placeWord(word, categoryName);
    }

    function onDropPool(e) {
        e.preventDefault();
        const { word } = dragRef.current || {};
        if (!word) return;
        returnToPool(word);
    }

    // ── click handlers ────────────────────────────────────────────────────────

    function onClickWord(word, currentLocation) {
        if (checked) return;
        if (selected === word) { setSelected(null); return; }
        setSelected(word);
    }

    function onClickCategory(categoryName) {
        if (checked || !selected) return;
        placeWord(selected, categoryName);
    }

    function onClickPool() {
        if (checked || !selected) return;
        const inCategory = placements[selected] !== undefined;
        if (inCategory) returnToPool(selected);
    }

    // ── rendering ─────────────────────────────────────────────────────────────

    if (light) {
        const frame = {
            eyebrow: 'Sort the words', title: activity.topic || 'Put each word in its group',
            onSave: hideSave ? undefined : () => setShowSave(true),
            isFullscreen, onFullscreen: toggleFullscreen, onClose,
            overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
            extra: <span className="hidden sm:inline text-[15px] font-semibold text-[#4A5163]">{allWords.length - pool.length} of {allWords.length} placed</span>,
        };
        const cols = activity.categories.length >= 3 ? 'lg:grid-cols-3' : '';
        return (
            <LightFrame {...frame}>
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col gap-4 sm:gap-5">
                    {checked ? (
                        <section aria-label="Results" className={`${LIGHT.glowCard} p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4`}>
                            <div className="flex-1">
                                <p className={LIGHT.chip}>All sorted</p>
                                <h1 className="font-display text-[26px] sm:text-[32px] font-semibold leading-tight">{score} of {allWords.length} right first time</h1>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="button" onClick={lightRestart} className={LIGHT.primary}>Play again</button>
                                {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                            </div>
                        </section>
                    ) : (
                        <section aria-label="Words" className={`${LIGHT.card} p-4 sm:p-6 flex flex-col gap-3`}>
                            <p className={LIGHT.chip}>{selected ? `“${selected}” — now choose its group` : 'Choose a word, then its group (or drag it)'}</p>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {pool.map(w => {
                                    const isSel = selected === w;
                                    const flashWrong = notice && !notice.ok && notice.word === w;
                                    return (
                                        <button key={w} type="button" draggable
                                            onDragStart={e => onDragStartWord(e, w, 'pool')}
                                            onClick={() => onClickWord(w, 'pool')}
                                            aria-pressed={isSel}
                                            className={`${L_TILE_SIZES[sizeIdx]} min-h-12 rounded-xl px-4 py-2 font-semibold text-[#271D62] cursor-pointer select-none
                                                ${isSel ? 'ring-2 ring-[#E0521F] border border-[#E0521F] bg-[#FFF5F0]' : flashWrong ? LIGHT.wrong : 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9]'}`}>
                                            {w}
                                        </button>
                                    );
                                })}
                            </div>
                            {notice && (
                                <p role="status" className={`rounded-xl px-4 py-2.5 text-[16px] sm:text-[18px] ${notice.ok ? 'bg-[#E5F4EC] text-[#14532D]' : 'bg-[#FDECEA] text-[#7F1D1D]'}`}>
                                    {notice.ok ? `Right! “${notice.word}” goes in ${notice.cat}.` : `Not ${notice.cat}. Try “${notice.word}” again.`}
                                </p>
                            )}
                        </section>
                    )}

                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-4`}>
                        {activity.categories.map(cat => {
                            const here = Object.entries(placements).filter(([, c]) => c === cat.name).map(([w]) => w);
                            const target = selected && !checked;
                            return (
                                <section key={cat.name} aria-label={cat.name}
                                    onDragOver={e => e.preventDefault()} onDrop={e => onDropCategory(e, cat.name)}
                                    onClick={() => onClickCategory(cat.name)}
                                    className={`${LIGHT.card} p-4 sm:p-5 flex flex-col gap-3 min-h-40 ${target ? 'cursor-pointer ring-2 ring-[#E0521F]/50 hover:bg-[#FFF5F0]' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <h2 className={`font-display ${L_HEAD_SIZES[sizeIdx]} font-semibold flex-1`}>{cat.name}</h2>
                                        {target && <button type="button" onClick={e => { e.stopPropagation(); onClickCategory(cat.name); }} className={`${LIGHT.iconBtn} text-[#E0521F]`}>Put it here</button>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {here.map(w => (
                                            <span key={w} data-placed className={`${L_TILE_SIZES[sizeIdx]} rounded-xl px-4 py-2 ${missed.includes(w) ? 'border border-[#1E7A4C] bg-[#E5F4EC] font-semibold' : LIGHT.right}`}>
                                                {w}{missed.includes(w) && <span className="sr-only"> (second try)</span>}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>
            </LightFrame>
        );
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' };

    function wordTile(word, location) {
        const isSelected = selected === word;
        let colorCls = 'bg-white/15 border-white/25 text-white hover:bg-white/25 cursor-pointer';

        if (checked) {
            const correct = wordToCorrect[word] === placements[word];
            colorCls = correct
                ? 'bg-green-500/80 border-green-400 text-white cursor-default'
                : 'bg-red-500/80 border-red-400 text-white cursor-default';
        } else if (isSelected) {
            colorCls = 'bg-yellow-400/90 border-yellow-300 text-gray-900 cursor-pointer';
        }

        return (
            <div
                key={word}
                draggable={!checked}
                onDragStart={e => onDragStartWord(e, word, location)}
                onClick={() => onClickWord(word, location)}
                className={`${colorCls} border rounded-xl px-4 py-2 ${TILE_SIZES[sizeIdx]} font-semibold select-none transition-all duration-150 shadow`}
                style={{ cursor: checked ? 'default' : 'grab' }}
            >
                {word}
                {checked && wordToCorrect[word] !== placements[word] && (
                    <span className="block text-xs text-green-200 font-normal mt-0.5">
                        → {wordToCorrect[word]}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/60" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    {checked && (
                        <span className="text-white/50 text-sm ml-3">
                            {score} / {allWords.length} correct
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-5">
                    {/* tile colours here mean selected / right / wrong, so the shared text-colour picker is hidden */}
                    <DisplayControls colors={false} />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Fullscreen (F)">
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Category zones */}
            <div className="relative z-10 flex-1 flex gap-4 px-6 md:px-12 py-2 overflow-hidden">
                {activity.categories.map(cat => {
                    const wordsHere = Object.entries(placements)
                        .filter(([, c]) => c === cat.name)
                        .map(([w]) => w);

                    return (
                        <div
                            key={cat.name}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => onDropCategory(e, cat.name)}
                            onClick={() => onClickCategory(cat.name)}
                            className={`flex-1 flex flex-col gap-2 rounded-2xl border-2 border-dashed p-4 overflow-y-auto transition-colors
                                ${selected && !checked ? 'border-yellow-400/60 bg-white/5 cursor-pointer' : 'border-white/20 bg-white/5'}
                            `}
                        >
                            <h3 className={`text-white font-bold ${HEAD_SIZES[sizeIdx]} text-center mb-1 shrink-0`}>
                                {cat.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 content-start">
                                {wordsHere.map(w => wordTile(w, cat.name))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Word pool */}
            <div
                className="relative z-10 shrink-0 px-6 md:px-12 py-4"
                onDragOver={e => e.preventDefault()}
                onDrop={onDropPool}
                onClick={onClickPool}
            >
                {pool.length > 0 && (
                    <>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-2">
                            {selected ? `"${selected}" selected — click a category above` : 'Drag or click a word, then click a category'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {pool.map(w => wordTile(w, 'pool'))}
                        </div>
                    </>
                )}

                {allPlaced && !checked && (
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={() => setChecked(true)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-3 rounded-xl text-lg transition-colors shadow-lg"
                        >
                            Check Answers
                        </button>
                    </div>
                )}

                {checked && (
                    <div className="flex justify-center gap-4 pt-2">
                        <button
                            onClick={() => {
                                setPool(shuffle(allWords.map(w => w.text)));
                                setPlacements({});
                                setChecked(false);
                                setSelected(null);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
