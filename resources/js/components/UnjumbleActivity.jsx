import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function toTiles(words) {
    return words.map((word, i) => ({ word, id: i }));
}

export default function UnjumbleActivity({ activity, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [available, setAvailable] = useState(() => shuffle(toTiles(activity.sentences[0].words)));
    const [placed, setPlaced] = useState([]);
    const [checkStatus, setCheckStatus] = useState('idle'); // idle | correct | wrong | revealed
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [backgrounds, setBackgrounds] = useState([]);

    // Stores drag source without triggering re-renders
    const dragRef = useRef(null);

    const sentence = activity.sentences[currentIndex];
    const total = activity.sentences.length;
    const allPlaced = available.length === 0;

    useEffect(() => {
        Promise.all(
            activity.sentences.map(s =>
                axios.get('/api/background', { params: { topic: s.keyword || activity.topic } })
                    .then(({ data }) => data.url)
                    .catch(() => null)
            )
        ).then(urls => setBackgrounds(urls));
    }, []);

    const bgUrl = backgrounds[currentIndex] || null;
    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    // --- Move logic ---
    function handlePlace(tile) {
        if (checkStatus !== 'idle') return;
        setAvailable(prev => prev.filter(t => t.id !== tile.id));
        setPlaced(prev => [...prev, tile]);
    }

    function handleUnplace(tile) {
        if (checkStatus !== 'idle') return;
        setPlaced(prev => prev.filter(t => t.id !== tile.id));
        setAvailable(prev => [...prev, tile]);
    }

    // --- Drag handlers ---
    function onDragStart(tile, from) {
        if (checkStatus !== 'idle') return;
        dragRef.current = { tile, from };
    }

    function onDropIntoPlaced(e) {
        e.preventDefault();
        if (!dragRef.current || dragRef.current.from !== 'available') return;
        handlePlace(dragRef.current.tile);
        dragRef.current = null;
    }

    function onDropIntoAvailable(e) {
        e.preventDefault();
        if (!dragRef.current || dragRef.current.from !== 'placed') return;
        handleUnplace(dragRef.current.tile);
        dragRef.current = null;
    }

    function onDragEnd() {
        dragRef.current = null;
    }

    // --- Game logic ---
    function handleCheck() {
        const userSentence = placed.map(t => t.word).join(' ');
        if (userSentence === sentence.sentence) {
            setCheckStatus('correct');
            setScore(s => s + 1);
        } else {
            setCheckStatus('wrong');
        }
    }

    function handleReveal() {
        setPlaced(toTiles(sentence.words));
        setAvailable([]);
        setCheckStatus('revealed');
    }

    function handleTryAgain() {
        setAvailable(shuffle(toTiles(sentence.words)));
        setPlaced([]);
        setCheckStatus('idle');
    }

    function handleNext() {
        const next = currentIndex + 1;
        if (next >= total) {
            setFinished(true);
        } else {
            setCurrentIndex(next);
            setAvailable(shuffle(toTiles(activity.sentences[next].words)));
            setPlaced([]);
            setCheckStatus('idle');
        }
    }

    function handleRestart() {
        setCurrentIndex(0);
        setAvailable(shuffle(toTiles(activity.sentences[0].words)));
        setPlaced([]);
        setCheckStatus('idle');
        setScore(0);
        setFinished(false);
    }

    function placedTileClass() {
        if (checkStatus === 'correct')  return 'bg-green-500 border-green-400 cursor-default';
        if (checkStatus === 'wrong')    return 'bg-red-500 border-red-400 cursor-grab';
        if (checkStatus === 'revealed') return 'bg-yellow-500 border-yellow-400 cursor-default';
        return 'bg-white/25 border-white/35 hover:bg-white/35 cursor-grab';
    }

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Well done!</h2>
                    <p className="text-2xl">
                        You got{' '}
                        <span className="text-yellow-400 font-bold">{score}</span>
                        {' '}out of{' '}
                        <span className="font-bold">{total}</span> correct
                    </p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={handleRestart}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            Play Again
                        </button>
                        <button onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusLabel = {
        idle:     'Drag or click the words into the correct order',
        correct:  '✓ Correct!',
        wrong:    '✗ Not quite — try again or reveal the answer',
        revealed: 'Here is the correct sentence',
    }[checkStatus];

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/60" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">
                    Sentence {currentIndex + 1} / {total}
                </span>
                <div className="flex items-center gap-5">
                    <span className="text-white/70 text-sm">
                        Score: <span className="text-yellow-400 font-semibold">{score}</span>
                    </span>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-6">

                <p className={`text-sm uppercase tracking-widest font-medium ${
                    checkStatus === 'correct'  ? 'text-green-400' :
                    checkStatus === 'wrong'    ? 'text-red-400'   :
                    checkStatus === 'revealed' ? 'text-yellow-400' :
                    'text-white/50'
                }`}>
                    {statusLabel}
                </p>

                {/* Answer area — drop zone */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropIntoPlaced}
                    className="w-full max-w-3xl min-h-[88px] bg-white/10 border-2 border-dashed border-white/30 rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-center"
                >
                    {placed.length === 0 && (
                        <span className="text-white/30 text-base">Drag or click words here…</span>
                    )}
                    {placed.map(tile => (
                        <button
                            key={tile.id}
                            draggable={checkStatus === 'idle' || checkStatus === 'wrong'}
                            onDragStart={() => onDragStart(tile, 'placed')}
                            onDragEnd={onDragEnd}
                            onClick={() => handleUnplace(tile)}
                            className={`${placedTileClass()} text-white font-semibold px-5 py-3 rounded-xl border text-base transition-colors select-none`}
                        >
                            {tile.word}
                        </button>
                    ))}
                </div>

                {/* Word bank — drop zone */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropIntoAvailable}
                    className="w-full max-w-3xl flex flex-wrap gap-3 justify-center min-h-[56px]"
                >
                    {available.map(tile => (
                        <button
                            key={tile.id}
                            draggable
                            onDragStart={() => onDragStart(tile, 'available')}
                            onDragEnd={onDragEnd}
                            onClick={() => handlePlace(tile)}
                            className="bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-5 py-3 rounded-xl text-base transition-colors cursor-grab select-none"
                        >
                            {tile.word}
                        </button>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-2">
                    {checkStatus === 'idle' && (
                        <>
                            <button
                                onClick={handleReveal}
                                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                            >
                                Reveal Answer
                            </button>
                            <button
                                onClick={handleCheck}
                                disabled={!allPlaced}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                            >
                                Check
                            </button>
                        </>
                    )}

                    {checkStatus === 'wrong' && (
                        <>
                            <button
                                onClick={handleTryAgain}
                                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleReveal}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                            >
                                Reveal
                            </button>
                        </>
                    )}

                    {(checkStatus === 'correct' || checkStatus === 'revealed') && (
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                        >
                            {currentIndex + 1 >= total ? 'See Results' : 'Next →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
