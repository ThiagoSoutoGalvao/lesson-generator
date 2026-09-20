import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { phrasesFor } from '@/lib/pictureFrames';

const QUESTION_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const CHIP_SIZES     = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];

// Picture Prompts — a photo, an open question, and natural ways to start a sentence.
// Speaking practice with no answer to check: the teacher listens and gives live feedback,
// so it records completion only. Students default to "I can see…"; the panel under the
// photo offers other openers for the activity's level (see lib/pictureFrames.js).
export default function PicturePromptsActivity({ activity, onClose, onComplete, hideSave }) {
    const prompts = activity.prompts;
    const total   = prompts.length;
    const phrases = phrasesFor(activity.level);

    const [index, setIndex]       = useState(0);
    const [photos, setPhotos]     = useState({});      // index → image url
    const [showPhrases, setShowPhrases] = useState(true);
    const [finished, setFinished] = useState(false);
    const [showSave, setShowSave] = useState(false);
    const { sizeIdx: fontSizeIdx } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const current = prompts[index];

    // Fetch this photo and the next one, so "Next" is never a blank frame.
    useEffect(() => {
        let cancelled = false;
        [index, index + 1].forEach(i => {
            if (i >= total || photos[i] !== undefined) return;
            axios.get('/api/background', { params: { topic: prompts[i].keyword } })
                .then(({ data }) => { if (!cancelled) setPhotos(p => ({ ...p, [i]: data.url })); })
                .catch(() => { if (!cancelled) setPhotos(p => ({ ...p, [i]: null })); });
        });
        return () => { cancelled = true; };
    }, [index]);

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Student app: completion only — speaking practice keeps no score.
    useEffect(() => {
        if (finished) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function next() {
        if (index + 1 >= total) setFinished(true);
        else setIndex(i => i + 1);
    }

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">All done!</h2>
                    <p className="text-xl text-white/70">You described {total} pictures</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => { setIndex(0); setFinished(false); }} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Start Over</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    const photo = photos[index];

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 sm:px-8 py-4">
                <span className="text-white/70 text-sm font-medium capitalize">{activity.topic} · Picture {index + 1} / {total}</span>
                <div className="flex items-center gap-5">
                    <DisplayControls colors={false} />
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

            {/* Top-aligned + scrollable, not centred — photo, question, openers and the phrase
                panel together can be taller than a phone; nothing may end up out of reach. */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-8 gap-5 overflow-y-auto py-6">
                <div className="w-full max-w-3xl flex flex-col gap-5">
                    {photo ? (
                        <img src={photo} alt={current.keyword} className="w-full max-h-[45vh] object-cover rounded-2xl shadow-2xl" />
                    ) : (
                        <div className={`w-full aspect-video max-h-[45vh] rounded-2xl bg-white/10 flex items-center justify-center text-white/40 text-sm ${photo === undefined ? 'animate-pulse' : ''}`}>
                            {photo === null ? 'The photo could not be loaded' : ''}
                        </div>
                    )}

                    <p className={`text-white font-bold text-center leading-snug ${QUESTION_SIZES[fontSizeIdx]}`}>{current.question}</p>

                    {current.starters?.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {current.starters.map((s, i) => (
                                <span key={i} className={`bg-blue-500/25 border border-blue-300/50 text-white rounded-full px-4 py-1.5 ${CHIP_SIZES[fontSizeIdx]}`}>{s}</span>
                            ))}
                        </div>
                    )}

                    <div className="rounded-2xl bg-white/8 border border-white/15">
                        <button
                            type="button"
                            onClick={() => setShowPhrases(v => !v)}
                            aria-expanded={showPhrases}
                            className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left text-white font-semibold cursor-pointer"
                        >
                            <span>Instead of “I can see…” try:</span>
                            <span className="text-white/50 text-sm">{showPhrases ? 'Hide' : 'Show'}</span>
                        </button>
                        {showPhrases && (
                            <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-5 pb-4 text-white/85 ${CHIP_SIZES[fontSizeIdx]}`}>
                                {phrases.map((p, i) => <li key={i} className="flex gap-2"><span className="text-white/40">•</span><span>{p}</span></li>)}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-center gap-3 pt-1">
                        {index > 0 && (
                            <button onClick={() => setIndex(i => i - 1)} className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Back</button>
                        )}
                        <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            {index + 1 >= total ? 'Finish' : 'Next picture'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
