import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES   = ['text-4xl', 'text-5xl', 'text-6xl'];
const FOLLOW_SIZES = ['text-lg',  'text-xl',  'text-2xl'];
const TEXT_COLORS  = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Cream',  cls: 'text-amber-50',   bg: '#fffbeb' },
    { label: 'Yellow', cls: 'text-yellow-300',  bg: '#fde047' },
    { label: 'Sky',    cls: 'text-sky-300',     bg: '#7dd3fc' },
    { label: 'Green',  cls: 'text-green-300',   bg: '#86efac' },
];

export default function DiscussionQuestionsActivity({ activity, onClose }) {
    const [index, setIndex]           = useState(0);
    const [bgUrl, setBgUrl]           = useState(null);
    const [showSave, setShowSave]     = useState(false);
    const [fontSizeIdx, setFontSizeIdx]     = useState(1);
    const [textColor, setTextColor]         = useState('text-white');
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
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(2, i + 1))} disabled={fontSizeIdx === 2}
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
