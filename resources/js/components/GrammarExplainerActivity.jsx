import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const FONT_SIZES = ['text-base', 'text-lg', 'text-xl'];
const TEXT_COLORS = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Orange', cls: 'text-orange-400', bg: '#fb923c' },
    { label: 'Red',    cls: 'text-red-400',    bg: '#f87171' },
    { label: 'Cyan',   cls: 'text-cyan-300',   bg: '#67e8f9' },
];

const ACCENT = {
    blue:   { text: 'text-blue-300',   bg: 'bg-blue-500/15',   border: 'border-blue-400/25',   dot: 'bg-blue-400',   bar: 'bg-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700'   },
    purple: { text: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-400/25', dot: 'bg-purple-400', bar: 'bg-purple-400', btn: 'bg-purple-600 hover:bg-purple-700' },
    green:  { text: 'text-green-300',  bg: 'bg-green-500/15',  border: 'border-green-400/25',  dot: 'bg-green-400',  bar: 'bg-green-400',  btn: 'bg-green-600 hover:bg-green-700'  },
    orange: { text: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-400/25', dot: 'bg-orange-400', bar: 'bg-orange-400', btn: 'bg-orange-600 hover:bg-orange-700' },
    teal:   { text: 'text-teal-300',   bg: 'bg-teal-500/15',   border: 'border-teal-400/25',   dot: 'bg-teal-400',   bar: 'bg-teal-400',   btn: 'bg-teal-600 hover:bg-teal-700'   },
    rose:   { text: 'text-rose-300',   bg: 'bg-rose-500/15',   border: 'border-rose-400/25',   dot: 'bg-rose-400',   bar: 'bg-rose-400',   btn: 'bg-rose-600 hover:bg-rose-700'   },
};

function parseText(text, accentClass) {
    return text.split('**').map((part, i) =>
        i % 2 === 1
            ? <strong key={i} className={`font-bold ${accentClass}`}>{part}</strong>
            : part
    );
}

// Returns inline style for staggered fade-up animation
function stagger(n) {
    return {
        animation: 'pres-fade-up 0.4s ease-out both',
        animationDelay: `${80 + n * 110}ms`,
    };
}

export default function GrammarExplainerActivity({ activity, onClose }) {
    const [slideIdx, setSlideIdx]         = useState(0);
    const [direction, setDirection]       = useState('next');
    const [bgUrl, setBgUrl]               = useState(null);
    const [showSave, setShowSave]         = useState(false);
    const [fontSizeIdx, setFontSizeIdx]   = useState(0);
    const [textColor, setTextColor]       = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const slides = activity.slides;
    const slide  = slides[slideIdx];
    const total  = slides.length;
    const accent = ACCENT[slide?.color] ?? ACCENT.blue;

    const TITLE_SIZES   = ['text-3xl',  'text-4xl',  'text-5xl'];
    const RULE_SIZES    = ['text-xl',   'text-2xl',  'text-3xl'];
    const FORM_SIZES    = ['text-lg',   'text-xl',   'text-2xl'];
    const EXAMPLE_SIZES = ['text-lg',   'text-xl',   'text-2xl'];

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space' || e.code === 'ArrowRight') {
                e.preventDefault();
                if (slideIdx < total - 1) { setDirection('next'); setSlideIdx(i => i + 1); }
            }
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                if (slideIdx > 0) { setDirection('prev'); setSlideIdx(i => i - 1); }
            }
            if (e.code === 'KeyF') toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [slideIdx, total]);

    function handleNext() {
        if (slideIdx < total - 1) { setDirection('next'); setSlideIdx(i => i + 1); }
    }
    function handlePrev() {
        if (slideIdx > 0) { setDirection('prev'); setSlideIdx(i => i - 1); }
    }
    function goTo(i) {
        setDirection(i > slideIdx ? 'next' : 'prev');
        setSlideIdx(i);
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' };

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm font-medium">{slideIdx + 1} / {total}</span>
                    <div className="flex items-center gap-1.5">
                        {slides.map((s, i) => {
                            const a = ACCENT[s.color] ?? ACCENT.blue;
                            return (
                                <button key={i} onClick={() => goTo(i)}
                                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${a.dot} ${i === slideIdx ? 'w-6 opacity-100' : 'w-2 opacity-30 hover:opacity-70'}`}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(FONT_SIZES.length - 1, i + 1))} disabled={fontSizeIdx === FONT_SIZES.length - 1}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer">A+</button>
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
                    <div className={`h-1 ${accent.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${((slideIdx + 1) / total) * 100}%` }} />
                </div>
            </div>

            {/* Slide — fullscreen centered, direction-aware push + staggered build */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-4 overflow-hidden">
                <div
                    key={`${slideIdx}-${direction}`}
                    className={`slide-content w-full max-w-2xl flex flex-col gap-4 ${direction === 'next' ? 'pres-enter-right' : 'pres-enter-left'}`}
                >
                    {/* Topic + title */}
                    <div style={stagger(0)}>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{activity.topic}</p>
                        <h2 className={`${TITLE_SIZES[fontSizeIdx]} font-bold ${accent.text} leading-tight`}>
                            {slide.title}
                        </h2>
                    </div>

                    {/* Rule */}
                    <div style={stagger(1)} className={`rounded-xl ${accent.bg} ${accent.border} border px-5 py-4`}>
                        <p className={`${RULE_SIZES[fontSizeIdx]} ${textColor} leading-relaxed`}>
                            {parseText(slide.rule, accent.text)}
                        </p>
                    </div>

                    {/* Form */}
                    {slide.form && (
                        <div style={stagger(2)} className="rounded-xl bg-black/35 border border-white/12 px-5 py-3">
                            <p className="text-white/35 text-xs uppercase tracking-widest mb-1.5">Form</p>
                            <p className={`${FORM_SIZES[fontSizeIdx]} font-mono ${textColor} leading-relaxed`}>
                                {parseText(slide.form, accent.text)}
                            </p>
                        </div>
                    )}

                    {/* Examples */}
                    <div className="flex flex-col gap-2">
                        {slide.examples.map((ex, i) => (
                            <div key={i} style={stagger(slide.form ? 3 + i : 2 + i)}
                                className="rounded-xl bg-black/25 border border-white/10 px-5 py-3 flex items-baseline gap-3">
                                <span className={`${accent.text} font-bold text-sm shrink-0`}>{i + 1}.</span>
                                <p className={`${EXAMPLE_SIZES[fontSizeIdx]} ${textColor} leading-relaxed`}>
                                    {parseText(ex, accent.text)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div style={stagger(slide.form ? 3 + slide.examples.length : 2 + slide.examples.length)}
                        className="flex justify-center gap-3 pt-1">
                        <button onClick={handlePrev} disabled={slideIdx === 0}
                            className="bg-white/15 hover:bg-white/25 disabled:opacity-25 disabled:cursor-default text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
                            ← Prev
                        </button>
                        <button onClick={handleNext} disabled={slideIdx === total - 1}
                            className={`${accent.btn} disabled:opacity-25 disabled:cursor-default text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer`}>
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
