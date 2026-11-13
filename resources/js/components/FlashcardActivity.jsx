import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightPhoto, LIGHT } from '@/components/light/LightFrame';

const WORD_SIZES    = ['text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
const PRON_SIZES     = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const DEF_SIZES     = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const EXAMPLE_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl',  'text-2xl'];
const L_WORD_SIZES  = ['text-3xl', 'text-4xl', 'text-[40px] sm:text-5xl', 'text-5xl sm:text-6xl', 'text-6xl sm:text-7xl'];
const L_DEF_SIZES   = ['text-lg', 'text-xl', 'text-xl sm:text-2xl', 'text-2xl sm:text-3xl', 'text-3xl sm:text-4xl'];
const L_EX_SIZES    = ['text-[15px]', 'text-base', 'text-[17px] sm:text-lg', 'text-lg sm:text-xl', 'text-xl sm:text-2xl'];

export default function FlashcardActivity({ activity, onClose, onComplete, hideSave }) {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [knownIds, setKnownIds] = useState(new Set());
    const [deck, setDeck] = useState(() => activity.cards.map((_, i) => i));
    const [finished, setFinished] = useState(false);
    const [backgrounds, setBackgrounds] = useState([]);
    const [showSave, setShowSave]       = useState(false);
    const [questionMode, setQuestionMode] = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below

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

    // Student app (Phase S4): completion only — every card was marked "Got It"
    // to get here, but the deck-cycling mechanic means no single-pass score.
    useEffect(() => {
        if (finished) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function handleRestart() {
        setDeck(activity.cards.map((_, i) => i));
        setIndex(0);
        setKnownIds(new Set());
        setFinished(false);
        setFlipped(false);
    }

    // Aurora Business light layout (2026-11-12): white card on the light ground, the card's photo in its own panel
    // above it (never behind the text), one coral accent. Same deck logic, buttons and Space-to-flip as the dark one.
    if (light) {
        const frame = children => (
            <LightFrame
                eyebrow={finished ? 'Flashcards' : `Flashcards · card ${index + 1} of ${deck.length}${deck.length < total ? ' (again)' : ''} · learned ${knownIds.size} of ${total}`}
                title={activity.topic}
                extra={finished ? null : (
                    <button type="button" onClick={toggleMode} aria-pressed={questionMode} title="Show the definition first"
                        className={`${LIGHT.iconBtn} ${questionMode ? 'bg-[#FDEEE7] border-[#E0521F] text-[#9A3412] hover:bg-[#FDEEE7]' : ''}`}>
                        {questionMode ? 'Definition → Word' : 'Word → Definition'}
                    </button>
                )}
                onSave={hideSave ? null : () => setShowSave(true)} isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={!hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null}
            >
                {children}
            </LightFrame>
        );
        if (finished) {
            return frame(
                <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-5">
                    <div className={`${LIGHT.card} px-6 py-8 text-center`}>
                        <h2 className="font-display text-3xl sm:text-4xl font-semibold">All done!</h2>
                        <p className={`${LIGHT.muted} text-lg mt-2`}>All {total} cards learned</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={handleRestart} className={LIGHT.secondary}>Start over</button>
                        <button type="button" onClick={onClose} className={LIGHT.primary}>Close</button>
                    </div>
                </div>
            );
        }
        const ex = (text) => text ? <p className={`${L_EX_SIZES[fontSizeIdx]} ${LIGHT.muted} italic text-center leading-relaxed`}>“{text}”</p> : null;
        const word = <h2 className={`${L_WORD_SIZES[fontSizeIdx]} font-display font-semibold text-center leading-tight break-words`}>{card.word}</h2>;
        const pron = card.pronunciation ? <p className={`${L_EX_SIZES[fontSizeIdx]} ${LIGHT.muted} text-center`}>{card.pronunciation}</p> : null;
        const def  = <p className={`${L_DEF_SIZES[fontSizeIdx]} font-medium text-center leading-snug`}>{card.definition}</p>;
        const face = 'absolute inset-0 rounded-3xl bg-white border border-[#DDE1E8] shadow-[0_6px_24px_rgba(39,29,98,0.08)] flex flex-col items-center justify-center gap-3 px-6 sm:px-10 overflow-y-auto';
        const hint = (t) => <p className={LIGHT.eyebrow}>{t}</p>;
        return frame(
            <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4">
                <div className="h-2 rounded bg-[#E6E9EE] overflow-hidden" aria-hidden="true">
                    <div className="h-2 bg-[#1E7A4C] transition-[width] duration-300" style={{ width: `${(knownIds.size / total) * 100}%` }} />
                </div>
                {/* Split screen (2026-11-12, Thiago): photo left, card right, the same size — the wide strip above cropped the photo. */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <LightPhoto url={bgUrl} className="h-[180px] sm:h-[240px] md:h-auto" />
                <div role="button" tabIndex={0} aria-label={flipped ? 'Card back — tap to flip' : 'Card front — tap to flip'}
                    onClick={() => setFlipped(f => !f)} className="cursor-pointer select-none" style={{ perspective: '1200px' }}>
                    <div className="relative h-[280px] sm:h-[320px] md:h-[clamp(300px,calc(100dvh-280px),460px)]" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s ease', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                        <div className={face} style={{ backfaceVisibility: 'hidden' }}>
                            {questionMode ? <>{hint("What's the word?")}{def}{ex(card.example)}</> : <>{hint('Tap to flip')}{word}{pron}{ex(card.example)}</>}
                        </div>
                        <div className={face} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            {questionMode ? <>{word}{pron}{ex(card.example2 || card.example)}</> : <>{def}{ex(card.example2 || card.example)}</>}
                        </div>
                    </div>
                </div>
                </div>
                <div className={`flex flex-wrap justify-center md:justify-end gap-3 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button type="button" onClick={handleStillLearning} className={LIGHT.secondary}>↺ Still learning</button>
                    <button type="button" onClick={handleGotIt} className="h-12 sm:h-14 px-7 sm:px-8 rounded-xl bg-[#1E7A4C] hover:bg-[#17633D] text-white font-semibold text-[17px] sm:text-[19px] cursor-pointer">✓ Got it</button>
                </div>
            </div>
        );
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

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

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
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
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
            {/* Top-aligned + scrollable, not centered — the 420px card plus
                the Got It/Still Learning buttons can't get pushed off-screen
                on a short phone viewport. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-8 gap-8 overflow-y-auto py-8">
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
                                </>
                            ) : (
                                <>
                                    <p className="text-white/40 text-xs uppercase tracking-widest">Tap to flip</p>
                                    <h2 className={`${WORD_SIZES[fontSizeIdx]} font-bold ${textColor} text-center leading-tight`}>{card.word}</h2>
                                    {card.pronunciation && (
                                        <p className={`${PRON_SIZES[fontSizeIdx]} ${textColor} opacity-60 text-center`}>{card.pronunciation}</p>
                                    )}
                                    <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example}"</p>
                                </>
                            )}
                        </div>

                        {/* Back */}
                        <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}
                            className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-3xl flex flex-col items-center justify-center px-10 gap-4">
                            {questionMode ? (
                                <>
                                    <h2 className={`${WORD_SIZES[fontSizeIdx]} font-bold ${textColor} text-center leading-tight`}>{card.word}</h2>
                                    {card.pronunciation && (
                                        <p className={`${PRON_SIZES[fontSizeIdx]} ${textColor} opacity-60 text-center`}>{card.pronunciation}</p>
                                    )}
                                    {(card.example2 || card.example) && (
                                        <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example2 || card.example}"</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className={`${DEF_SIZES[fontSizeIdx]} ${textColor} font-medium text-center leading-snug`}>{card.definition}</p>
                                    {(card.example2 || card.example) && (
                                        <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} opacity-70 italic text-center`}>"{card.example2 || card.example}"</p>
                                    )}
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
