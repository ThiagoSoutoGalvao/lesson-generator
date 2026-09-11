import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
const FOLLOW_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

export default function DiscussionQuestionsActivity({ activity, onClose, onComplete }) {
    const [index, setIndex]           = useState(0);
    const [bgUrl, setBgUrl]           = useState(null);
    const [showSave, setShowSave]     = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const [displayQuestion, setDisplayQuestion] = useState(activity.questions[0]?.question ?? '');
    const [followUps, setFollowUps]         = useState(activity.questions[0]?.follow_ups ?? []);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const questions = activity.questions;
    const current   = questions[index];
    const total     = questions.length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); next(); }
            if (e.code === 'ArrowLeft')  { e.preventDefault(); prev(); }
            if (e.code === 'KeyF')        toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index]);

    useEffect(() => {
        setDisplayQuestion(current.question);
        setFollowUps(current.follow_ups ?? []);
    }, [index]);

    function next() { if (index < total - 1) setIndex(i => i + 1); }
    function prev() { if (index > 0) setIndex(i => i - 1); }

    // Student app (Phase S4): no reveal/finish concept here — the only real
    // "reached the end" signal is arriving at the last question. No score.
    useEffect(() => {
        if (index === total - 1) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    function promoteFollowUp(fu) {
        setDisplayQuestion(fu);
        setFollowUps(prev => prev.filter(f => f !== fu));
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/40" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">Question {index + 1} / {total}</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
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

            {/* Question */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-8">
                <div className="max-w-3xl w-full flex flex-col items-center gap-6 text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest">Discuss</p>
                    <h2 className={`${FONT_SIZES[fontSizeIdx]} font-bold leading-snug ${textColor}`}>{displayQuestion}</h2>

                    {followUps.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {followUps.map((fu, i) => (
                                <button key={i} onClick={() => promoteFollowUp(fu)}
                                    className={`px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 ${FOLLOW_SIZES[fontSizeIdx]} backdrop-blur-sm ${textColor} opacity-80 hover:opacity-100 transition-all duration-150 cursor-pointer text-left`}>
                                    {fu}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <button onClick={prev} disabled={index === 0}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer">← Prev</button>
                    <button onClick={next} disabled={index === total - 1}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer">Next →</button>
                </div>
            </div>
        </div>
    );
}
