import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';

const TEXT_SIZES   = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const OPTION_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const LETTERS = ['A', 'B', 'C'];

// The text itself, dressed as what it is: a public sign, a paper notice or a chat message.
function TextCard({ item, sizeCls }) {
    if (item.kind === 'sign') {
        return (
            <div className="bg-white text-gray-900 border-[6px] border-gray-900 rounded-xl px-6 py-8 text-center shadow-2xl w-full">
                <p className={`${sizeCls} font-extrabold uppercase tracking-wide leading-tight`}>{item.text}</p>
            </div>
        );
    }
    if (item.kind === 'message') {
        return (
            <div className="w-full flex flex-col items-start gap-1">
                <span className="text-white/60 text-xs uppercase tracking-widest pl-2">Message</span>
                <div className="bg-green-100 text-gray-900 rounded-3xl rounded-tl-md px-6 py-5 shadow-2xl max-w-full">
                    <p className={`${sizeCls} leading-snug`}>{item.text}</p>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-amber-50 text-gray-800 rounded-md px-6 py-6 shadow-2xl w-full border-t-8 border-amber-300">
            <p className={`${sizeCls} leading-snug text-center`}>{item.text}</p>
        </div>
    );
}

// Signs & Notices — one short real-life text per screen, one easy question with 3 options.
// Scored on the answers the student got right first time.
export default function SignsNoticesActivity({ activity, onClose, onComplete, hideSave }) {
    const items = activity.items;
    const total = items.length;

    const [index, setIndex]       = useState(0);
    const [wrongIdx, setWrongIdx] = useState([]);   // options tried and wrong on this item
    const [solved, setSolved]     = useState(false);
    const [firstTry, setFirstTry] = useState(0);    // items answered right with no wrong try
    const [finished, setFinished] = useState(false);
    const [bgUrl, setBgUrl]       = useState(null);
    const [showSave, setShowSave] = useState(false);
    const { sizeIdx: fontSizeIdx } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const item = items[index];

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

    // Student app: scored — first-time-right answers out of the total.
    useEffect(() => {
        if (finished) onComplete?.({ score: firstTry, maxScore: total });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function choose(i) {
        if (solved || wrongIdx.includes(i)) return;
        if (i === item.answer) {
            setSolved(true);
            if (wrongIdx.length === 0) setFirstTry(n => n + 1);
        } else {
            setWrongIdx(w => [...w, i]);
        }
    }

    function next() {
        if (index + 1 >= total) { setFinished(true); return; }
        setIndex(n => n + 1); setWrongIdx([]); setSolved(false);
    }

    function restart() {
        setIndex(0); setWrongIdx([]); setSolved(false); setFirstTry(0); setFinished(false);
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">Well done!</h2>
                    <p className="text-xl text-white/70">{firstTry} / {total} right first time</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={restart} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Try Again</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/60" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 sm:px-8 py-4">
                <span className="text-white/70 text-sm font-medium">Text {index + 1} / {total}</span>
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
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(index / total) * 100}%` }} />
                </div>
            </div>

            {/* Top-aligned + scrollable, not centred — a long text plus three options must
                never push the options or Next out of reach on a phone. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-8 gap-6 overflow-y-auto py-6">
                <div className="w-full max-w-2xl flex flex-col gap-6">
                    <TextCard item={item} sizeCls={TEXT_SIZES[fontSizeIdx]} />

                    <p className={`text-white font-semibold text-center ${OPTION_SIZES[fontSizeIdx]}`}>{item.question}</p>

                    {/* One column: a 2-column grid sizes each row by its tallest cell */}
                    <div className="grid grid-cols-1 gap-3">
                        {item.options.map((opt, i) => {
                            const isRight = solved && i === item.answer;
                            const isWrong = wrongIdx.includes(i);
                            let cls = 'bg-white/15 border-white/25 text-white hover:bg-white/25 hover:border-white/50 cursor-pointer';
                            if (isRight)      cls = 'bg-green-500/40 border-green-400 text-white cursor-default';
                            else if (isWrong) cls = 'bg-red-500/35 border-red-400 text-white/80 cursor-default';
                            else if (solved)  cls = 'bg-white/5 border-white/10 text-white/35 cursor-default';
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => choose(i)}
                                    disabled={solved || isWrong}
                                    className={`flex items-center gap-4 text-left rounded-2xl px-5 py-4 border-2 transition-all duration-150 ${OPTION_SIZES[fontSizeIdx]} ${cls}`}
                                >
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">{LETTERS[i]}</span>
                                    <span>{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    {solved && (
                        <div className="flex justify-center">
                            <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                                {index + 1 >= total ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
