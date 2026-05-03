import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function WordCategorisationActivity({ activity, onClose }) {
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
    const dragRef = useRef(null);

    const allPlaced  = pool.length === 0;
    const score      = checked
        ? Object.entries(placements).filter(([w, cat]) => wordToCorrect[w] === cat).length
        : 0;

    useEffect(() => {
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

    // ── helpers ──────────────────────────────────────────────────────────────

    function placeWord(word, categoryName) {
        setPool(prev => prev.filter(w => w !== word));
        setPlacements(prev => {
            const next = { ...prev };
            // if word was already in another category, just move it
            next[word] = categoryName;
            return next;
        });
        setSelected(null);
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
                className={`${colorCls} border rounded-xl px-4 py-2 text-sm font-semibold select-none transition-all duration-150 shadow`}
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

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

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
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
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
                            className={`flex-1 flex flex-col gap-2 rounded-2xl border-2 border-dashed p-4 transition-colors
                                ${selected && !checked ? 'border-yellow-400/60 bg-white/5 cursor-pointer' : 'border-white/20 bg-white/5'}
                            `}
                        >
                            <h3 className="text-white font-bold text-lg text-center mb-1 shrink-0">
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
