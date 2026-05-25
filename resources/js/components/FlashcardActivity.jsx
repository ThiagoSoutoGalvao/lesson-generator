import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const WORD_SIZES    = ['text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
const DEF_SIZES     = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const EXAMPLE_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl',  'text-2xl'];
const TEXT_COLORS   = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Orange', cls: 'text-orange-400', bg: '#fb923c' },
    { label: 'Red',    cls: 'text-red-400',    bg: '#f87171' },
    { label: 'Cyan',   cls: 'text-cyan-300',   bg: '#67e8f9' },
];

export default function FlashcardActivity({ activity, onClose }) {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [knownIds, setKnownIds] = useState(new Set());
    const [deck, setDeck] = useState(() => activity.cards.map((_, i) => i));
    const [finished, setFinished] = useState(false);
    const [backgrounds, setBackgrounds] = useState([]);
    const [showSave, setShowSave]       = useState(false);
    const [questionMode, setQuestionMode] = useState(false);
    const [fontSizeIdx, setFontSizeIdx]   = useState(1);
    const [textColor, setTextColor]       = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    function toggleMode() {
        setQuestionMode(m => !m);
        setFlipped(false);
    }

    const cardIndex = deck[index];
    const card = activity.cards[cardIndex];
    const total = activity.cards.length;

    useEffect(() => {
        Promise.all(
            activity.cards.map(c =>
                axios.get('/api/background', { params: { topic: c.keyword || activity.topic } })
                    .then(({ data }) => data.url)
                    .catch(() => null)
            )
        ).then(urls => setBackgrounds(urls));
    }, []);

    const bgUrl = backgrounds[cardIndex] || null;
    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    function advance(newKnownIds) {
        const next = index + 1;
        if (next >= deck.length) {
            const stillLearning = deck.filter(i => !newKnownIds.has(i));
            if (stillLearning.length === 0) {
                setFinished(true);
            } else {
                setDeck(stillLearning);
                setIndex(0);
                setFlipped(false);
            }
        } else {
            setIndex(next);
            setFlipped(false);
        }
    }

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f); }
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function handleGotIt() {
        const updated = new Set(knownIds);
        updated.add(cardIndex);
        setKnownIds(updated);
        advance(updated);
    }

    function handleStillLearning() { advance(knownIds); }

    function handleRestart() {
        setDeck(activity.cards.map((_, i) => i));
        setIndex(0);
        setKnownIds(new Set());
        setFinished(false);
        setFlipped(false);
    }

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">All done!</h2>
                    <p className="text-2xl">You learned <span className="text-yellow-400 font-bold">{total}</span> out of <span className="font-bold">{total}</span> cards</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Start Over</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/60" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">
                    Card {index + 1} / {deck.length}
                </span>
                <div className="flex items-center gap-5">
                    <span className="text-white/70 text-sm">
                        Learned: <span className="text-green-400 font-semibold">{knownIds.size}</span> / {total}
                    </span>
                    <button
                        onClick={toggleMode}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                            questionMode
                                ? 'bg-purple-500/30 border-purple-400/50 text-purple-200 hover:bg-purple-500/40'
                                : 'bg-white/10 border-white/20 text-white/60 hover:text-white hover:bg-white/20'
                        }`}
                        title="Toggle question mode"
                    >
                        {questionMode ? 'Definition → Word' : 'Word → Definition'}
                    </button>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(DEF_SIZES.length - 1, i + 1))} disabled={fontSizeIdx === DEF_SIZES.length - 1}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Larger text">A+</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {TEXT_COLORS.map(({ label, cls, bg }) => (
                            <button key={cls} onClick={() => setTextColor(cls)} title={label}
                                className={`w-4 h-4 rounded-full transition-all cursor-pointer ${textColor === cls ? 'ring-2 ring-white ring-offset-1 ring-offset-black/60 scale-110' : 'opacity-50 hover:opacity-90'}`}
                                style={{ backgroundColor: bg }} />
                        ))}
                    </div>
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-green-400 rounded-full transition-all duration-500" style={{ width: `${(knownIds.size / total) * 100}%` }} />
                </div>
            </div>

            {/* Card */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-8">
                <div onClick={() => setFlipped(f => !f)} className="cursor-pointer w-full max-w-2xl select-none" style={{ perspective: '1200px' }}>
                    <div style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.5s ease',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        position: 'relative',
                        height: '420px',
                    }}>
                        {/* Front */}
                        <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
                            className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-3xl flex flex-col items-center justify-center px-8 gap-3">
                            {questionMode ? (
                                <>
                                    <p className="text-white/40 text-xs uppercase tracking-widest">What's the word?</p>
                                    <p className={`${DEF_SIZES[fontSizeIdx]} ${textColor} font-medium text-center leading-snug`}>{card.definition}</p>
                                    <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example}"</p>
                                    {card.example2 && <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example2}"</p>}
                                </>
                            ) : (
                                <>
                                    <p className="text-white/40 text-xs uppercase tracking-widest">Tap to flip</p>
                                    <h2 className={`${WORD_SIZES[fontSizeIdx]} font-bold ${textColor} text-center leading-tight`}>{card.word}</h2>
                                </>
                            )}
                        </div>

                        {/* Back */}
                        <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}
                            className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-3xl flex flex-col items-center justify-center px-10 gap-4">
                            {questionMode ? (
                                <h2 className={`${WORD_SIZES[fontSizeIdx]} font-bold ${textColor} text-center leading-tight`}>{card.word}</h2>
                            ) : (
                                <>
                                    <p className={`${DEF_SIZES[fontSizeIdx]} ${textColor} font-medium text-center leading-snug`}>{card.definition}</p>
                                    <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example}"</p>
                                    {card.example2 && <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example2}"</p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buttons — only visible after flipping */}
                <div className={`flex gap-4 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={handleStillLearning} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors">↺ Still Learning</button>
                    <button onClick={handleGotIt} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors">✓ Got It</button>
                </div>
            </div>
        </div>
    );
}
