import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import Spinner from '@/components/Spinner';
import { useFullscreen } from '@/hooks/useFullscreen';

// "Make an exercise from this text" — each turns the reading passage into a
// different activity via /api/generate with the passage as `source_text`.
const DERIVE_OPTIONS = [
    {
        label: 'Comprehension Quiz', type: 'quiz',
        prompt: 'Create 6 multiple choice comprehension questions about the text above — a mix of main idea, specific detail, and inference. Each with 4 options.',
    },
    {
        label: 'True / False', type: 'true_false',
        prompt: 'Create a True / False / Not Given activity based on the text above. Use the text (lightly adapted if needed) as the passage, and write 6 statements — 2 True, 2 False, 2 Not Given.',
    },
    {
        label: 'Cloze', type: 'cloze',
        prompt: 'Create a gap-fill activity from the text above: take a passage of 60–120 words, remove 6–8 key vocabulary or grammar words, and provide them as a word bank.',
    },
    {
        label: 'Error Correction', type: 'error_correction',
        prompt: 'Rewrite the text above as a connected passage with 6 mistakes embedded in it for students to find and correct. Keep it a passage, not separate sentences.',
    },
];

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

export default function ReadingTextActivity({ activity, onClose, onDerive }) {
    const navigate = useNavigate();
    const [bgUrl, setBgUrl]             = useState(null);
    const [showSave, setShowSave]       = useState(false);
    const [showVocab, setShowVocab]     = useState(true);
    const [fontSizeIdx, setFontSizeIdx] = useState(2);
    const [textColor, setTextColor]     = useState('text-white');
    const [deriving, setDeriving]       = useState(null);   // label being generated
    const [deriveError, setDeriveError] = useState('');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    const paragraphs = activity.paragraphs ?? [];
    const vocabulary = activity.vocabulary ?? [];
    const vocabWords  = vocabulary.map(v => v.word);
    const canDerive   = typeof onDerive === 'function' && paragraphs.length > 0;

    async function handleDerive(opt) {
        setDeriving(opt.label);
        setDeriveError('');
        try {
            const { data } = await axios.post('/api/generate', {
                type: opt.type,
                prompt: opt.prompt,
                source_text: paragraphs.join('\n\n'),
            });
            onDerive(data);
        } catch (err) {
            setDeriveError(err.response?.data?.message ?? 'Could not generate that exercise. Please try again.');
            setDeriving(null);
        }
    }

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
                    <button onClick={() => navigate('/generate')} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Generate another activity">+ Add activity</button>
                    <button onClick={() => window.print()} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title="Download as PDF">⬇ PDF</button>
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Make an exercise from this text */}
            {canDerive && (
                <div className="relative z-10 px-8 pb-3 shrink-0 flex items-center gap-2 flex-wrap">
                    <span className="text-white/40 text-xs uppercase tracking-wider mr-1">Make an exercise from this text:</span>
                    {DERIVE_OPTIONS.map(opt => (
                        <button
                            key={opt.type + opt.label}
                            onClick={() => handleDerive(opt)}
                            disabled={deriving !== null}
                            className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-default border border-white/20 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                        >
                            {opt.label}
                        </button>
                    ))}
                    {deriveError && <span className="text-red-300 text-xs">{deriveError}</span>}
                </div>
            )}

            {deriving && (
                <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <Spinner message={`Building your ${deriving}… this can take up to 20 seconds`} color="text-blue-400" textColor="text-white/70" />
                </div>
            )}

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
