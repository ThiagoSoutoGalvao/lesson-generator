import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Match Pairs — click an item on one side, then its partner on the other. Either side
// can be picked first. Scored on the pairs matched without a wrong try.
export default function MatchPairsActivity({ activity, onClose, onComplete, hideSave }) {
    const pairs = activity.pairs;
    const total = pairs.length;

    const [rightOrder, setRightOrder] = useState(() => shuffle(pairs.map((_, i) => i)));
    const [sel, setSel]         = useState(null);   // { side: 'left' | 'right', idx }
    const [matched, setMatched] = useState({});     // pair index → true
    const [missed, setMissed]   = useState({});     // pair index → had a wrong try
    const [wrong, setWrong]     = useState(null);   // { left, right } flashing red
    const [bgUrl, setBgUrl]     = useState(null);
    const [showSave, setShowSave] = useState(false);
    const { sizeIdx: fontSizeIdx } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const wrongTimer = useRef(null);

    const matchedCount = Object.keys(matched).length;
    const finished     = matchedCount === total;
    const score        = total - Object.keys(missed).length;

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

    useEffect(() => () => clearTimeout(wrongTimer.current), []);

    // Student app: scored — pairs matched first time out of the total.
    useEffect(() => {
        if (finished) onComplete?.({ score, maxScore: total });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function pick(side, idx) {
        if (matched[idx] || wrong) return;
        if (!sel || sel.side === side) {
            setSel(sel && sel.side === side && sel.idx === idx ? null : { side, idx });
            return;
        }
        const left  = side === 'left' ? idx : sel.idx;
        const right = side === 'right' ? idx : sel.idx;
        if (left === right) {
            setMatched(m => ({ ...m, [left]: true }));
            setSel(null);
        } else {
            setMissed(m => ({ ...m, [left]: true })); // the pair the student got wrong at least once
            setWrong({ left, right });
            setSel(null);
            clearTimeout(wrongTimer.current);
            wrongTimer.current = setTimeout(() => setWrong(null), 700);
        }
    }

    function restart() {
        setRightOrder(shuffle(pairs.map((_, i) => i)));
        setMatched({}); setMissed({}); setSel(null); setWrong(null);
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Complete!</h2>
                    <p className="text-xl text-white/70">{score} / {total} matched first time</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={restart} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Try Again</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    function tile(side, idx, text) {
        const isMatched = !!matched[idx];
        const isSel     = sel && sel.side === side && sel.idx === idx;
        const isWrong   = wrong && wrong[side] === idx;
        let cls = 'bg-white/15 border-white/25 text-white hover:bg-white/25 hover:border-white/50 cursor-pointer';
        if (isMatched)      cls = 'bg-green-500/35 border-green-400 text-white cursor-default';
        else if (isSel)     cls = 'bg-blue-500 border-blue-300 text-white scale-[1.03] shadow-lg cursor-pointer';
        else if (isWrong)   cls = 'bg-red-500/45 border-red-400 text-white animate-pulse cursor-pointer';
        return (
            <button
                key={`${side}-${idx}`}
                type="button"
                onClick={() => pick(side, idx)}
                disabled={isMatched}
                aria-pressed={!!isSel}
                className={`w-full rounded-2xl px-4 py-4 sm:py-5 ${FONT_SIZES[fontSizeIdx]} font-semibold text-center border-2 transition-all duration-150 ${cls}`}
            >
                {text}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/60" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header — wraps on a phone so the ✕ stays reachable */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 sm:px-8 py-4">
                <span className="text-white/70 text-sm font-medium"><span className="capitalize">{activity.topic}</span> · {matchedCount} / {total} matched</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            <div className="relative z-10 px-6 sm:px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-green-400 rounded-full transition-all duration-500" style={{ width: `${(matchedCount / total) * 100}%` }} />
                </div>
            </div>

            {/* Top-aligned + scrollable, not centred — a long list can't push its top out of reach */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-8 gap-5 overflow-y-auto py-6">
                <p className="text-white/55 text-sm uppercase tracking-widest text-center">
                    {sel ? 'Now pick its partner' : 'Pick one, then pick its partner'}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-3xl">
                    <div className="flex flex-col gap-3">
                        {pairs.map((p, i) => tile('left', i, p.left))}
                    </div>
                    <div className="flex flex-col gap-3">
                        {rightOrder.map(i => tile('right', i, pairs[i].right))}
                    </div>
                </div>
            </div>
        </div>
    );
}
