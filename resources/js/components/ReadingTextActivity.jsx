import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import { useFullscreen } from '@/hooks/useFullscreen';

const PARAGRAPH_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const GLOSSARY_SIZES   = ['text-sm',  'text-base', 'text-lg', 'text-xl', 'text-2xl'];
const FONT_SIZE_MAX = PARAGRAPH_SIZES.length - 1;

const TEXT_COLORS = [
    { label: 'White',  cls: 'text-white',      bg: '#ffffff' },
    { label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' },
    { label: 'Orange', cls: 'text-orange-400', bg: '#fb923c' },
    { label: 'Red',    cls: 'text-red-400',    bg: '#f87171' },
    { label: 'Cyan',   cls: 'text-cyan-300',   bg: '#67e8f9' },
];

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightVocab(text, words) {
    if (!words.length) return text;
    const sorted = [...words].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`\\b(${sorted.map(escapeRegex).join('|')})\\b`, 'gi');
    const parts = text.split(pattern);
    return parts.map((part, i) => {
        const isMatch = sorted.some(w => w.toLowerCase() === part.toLowerCase());
        return isMatch
            ? <span key={i} className="font-bold underline decoration-amber-400 decoration-2 underline-offset-4">{part}</span>
            : <span key={i}>{part}</span>;
    });
}

export default function ReadingTextActivity({ activity, onClose }) {
    const [bgUrl, setBgUrl]             = useState(null);
    const [showSave, setShowSave]       = useState(false);
    const [showVocab, setShowVocab]     = useState(true);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor]     = useState('text-white');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const paragraphs = activity.paragraphs ?? [];
    const vocabulary = activity.vocabulary ?? [];
    const vocabWords  = vocabulary.map(v => v.word);

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'KeyF') toggleFullscreen();
            if (e.code === 'KeyV') setShowVocab(v => !v);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
      <>
        <div className="fixed inset-0 flex flex-col z-50 print:hidden" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">
                        {paragraphs.length} paragraph{paragraphs.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))} disabled={fontSizeIdx === 0}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-xs font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Smaller text">A-</button>
                        <button onClick={() => setFontSizeIdx(i => Math.min(FONT_SIZE_MAX, i + 1))} disabled={fontSizeIdx === FONT_SIZE_MAX}
                            className="text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Larger text">A+</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {TEXT_COLORS.map(({ label, cls, bg }) => (
                            <button key={cls} onClick={() => setTextColor(cls)} title={label}
                                className={`w-4 h-4 rounded-full transition-all cursor-pointer ${textColor === cls ? 'ring-2 ring-white ring-offset-1 ring-offset-black/60 scale-110' : 'opacity-50 hover:opacity-90'}`}
                                style={{ backgroundColor: bg }} />
                        ))}
                    </div>
                    {vocabulary.length > 0 && (
                        <button
                            onClick={() => setShowVocab(v => !v)}
                            className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                            title="Toggle vocabulary (V)"
                        >
                            {showVocab ? 'Hide vocabulary' : 'Show vocabulary'}
                        </button>
                    )}
                    <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>
                    <button onClick={() => window.print()} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Download as PDF">⬇ PDF</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Reading passage + vocabulary */}
            <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-3xl mx-auto flex flex-col gap-5">
                    <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/15 px-8 py-8 md:px-12 md:py-10 flex flex-col gap-5">
                        {paragraphs.map((p, i) => (
                            <p key={i} className={`${PARAGRAPH_SIZES[fontSizeIdx]} leading-relaxed ${textColor}`}>
                                {highlightVocab(p, vocabWords)}
                            </p>
                        ))}
                    </div>

                    {showVocab && vocabulary.length > 0 && (
                        <div className="rounded-2xl bg-black/25 backdrop-blur-sm border border-white/15 px-8 py-6">
                            <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Vocabulary</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
                                {vocabulary.map((v, i) => (
                                    <p key={i} className={`${GLOSSARY_SIZES[fontSizeIdx]} leading-snug`}>
                                        <span className={`font-bold ${textColor}`}>{v.word}</span>
                                        <span className="text-white/60"> — {v.definition}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Print-only view — light/printer-friendly, natural page flow */}
        <div className="read-print-root" style={{ display: 'none' }}>
            <p className="read-print-meta">Reading text — {activity.topic}</p>
            {paragraphs.map((p, i) => (
                <p key={i} className="read-print-paragraph">{highlightVocab(p, vocabWords)}</p>
            ))}
            {vocabulary.length > 0 && (
                <div className="read-print-vocab">
                    <p className="read-print-vocab-label">Vocabulary</p>
                    {vocabulary.map((v, i) => (
                        <p key={i} className="read-print-vocab-item">
                            <span className="read-print-vocab-word">{v.word}</span> — {v.definition}
                        </p>
                    ))}
                </div>
            )}
        </div>
      </>
    );
}
