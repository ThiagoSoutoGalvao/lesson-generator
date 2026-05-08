import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

export default function DiscussionQuestionsActivity({ activity, onClose }) {
    const [index, setIndex]       = useState(0);
    const [bgUrl, setBgUrl]       = useState(null);
    const [showSave, setShowSave] = useState(false);
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
            if (e.code === 'ArrowLeft')                         { e.preventDefault(); prev(); }
            if (e.code === 'KeyF')                               toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index]);

    function next() { if (index < total - 1) setIndex(i => i + 1); }
    function prev() { if (index > 0) setIndex(i => i - 1); }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/40" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">
                    Question {index + 1} / {total}
                </span>
                <div className="flex items-center gap-5">
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button
                        onClick={toggleFullscreen}
                        className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                        title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                    >
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-1 bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${((index + 1) / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-8">
                <div className="max-w-3xl w-full flex flex-col items-center gap-6 text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest">Discuss</p>
                    <h2 className="text-4xl font-bold text-white leading-snug">{current.question}</h2>

                    {/* Follow-ups */}
                    {current.follow_ups?.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {current.follow_ups.map((fu, i) => (
                                <span
                                    key={i}
                                    className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/65 text-sm backdrop-blur-sm"
                                >
                                    {fu}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-4 mt-4">
                    <button
                        onClick={prev}
                        disabled={index === 0}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer"
                    >
                        ← Prev
                    </button>
                    <button
                        onClick={next}
                        disabled={index === total - 1}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}
