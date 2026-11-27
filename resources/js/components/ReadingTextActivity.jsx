import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import Spinner from '@/components/Spinner';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightPhoto, LIGHT } from '@/components/light/LightFrame';
import { parseEmail, parseLetter, splitQuotedEmails } from '@/lib/readingEmails';

// Light layout: 20px reading text at the default size (18px on a phone).
const LIGHT_PARA_SIZES = ['text-base', 'text-[17px] sm:text-lg', 'text-lg sm:text-[20px]', 'text-[20px] sm:text-[23px]', 'text-[22px] sm:text-[27px]'];

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

// A dialogue paragraph (2026-11-16, Aurora Business interview readings): Claude writes "**Bruno:** … **Paula:** …" in one
// paragraph, which read as one cluttered block with the ** showing. A paragraph that STARTS with a speaker label
// ("Name:" — 1–3 capitalised words) is split into one line per speaker; every other paragraph is left as prose.
// In both, **bold** becomes real bold instead of showing the asterisks.
const LABEL = "[A-Z][A-Za-z.'’-]*(?: [A-Z][A-Za-z.'’-]*){0,2}";
const STARTS_WITH_SPEAKER = new RegExp(`^${LABEL}:\\s`);
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "**Bruno:**" / "**Bruno**:" / "Bruno**:**" → "Bruno:"
// ("**:**" first — otherwise the next pattern pairs its closing ** with the following speaker's and eats the line)
function cleanLabels(text) {
    return text
        .replace(/\*\*:\*\*/g, ':')
        .replace(/\*\*([^*\n]+?):\*\*|\*\*([^*\n]+?)\*\*:/g, (_, a, b) => `${a ?? b}:`)
        .trim();
}

/**
 * The speakers of a dialogue reading: every name that starts a paragraph ("Bruno:"), plus any "Name:" used at least
 * twice inside those paragraphs (Paula, who only ever answers — once would also catch a one-off "Nordia Foods: …").
 */
function dialogueSpeakers(paragraphs) {
    const names = new Set();
    const seen = new Map();
    const inside = new RegExp(`(?:^|\\s)(${LABEL}):\\s`, 'g');
    for (const p of paragraphs) {
        const c = cleanLabels(p);
        const m = c.match(STARTS_WITH_SPEAKER);
        if (!m) continue;
        names.add(m[0].slice(0, m[0].indexOf(':')));
        for (const [, n] of c.matchAll(inside)) seen.set(n, (seen.get(n) ?? 0) + 1);
    }
    for (const [n, k] of seen) if (k >= 2) names.add(n);
    return [...names];
}

// A new line starts at every known speaker's "Name:" (after any space — Claude doesn't always end the previous line
// with . ? !), and at any other "Name:" that follows the end of a sentence.
function parseDialogue(text, speakers = []) {
    const clean = cleanLabels(text);
    if (!STARTS_WITH_SPEAKER.test(clean)) return null;
    const known = speakers.length ? `|\\s+(?=(?:${speakers.map(escapeRe).join('|')}):\\s)` : '';
    const split = new RegExp(`(?<=[.!?…)"”'’])\\s+(?=${LABEL}:\\s)${known}`);
    return clean.split(split).filter(Boolean).map(part => {
        const i = part.indexOf(':');
        return { speaker: part.slice(0, i), line: part.slice(i + 1).trim().replace(/\s*[,;—–-]$/, '') }; // a stray comma / dash before the next speaker
    });
}

function renderRich(text, words) {
    return text.split(/\*\*([^*]+?)\*\*/).map((seg, i) => (
        i % 2 ? <strong key={i} className="font-bold">{highlightVocab(seg, words)}</strong> : <span key={i}>{highlightVocab(seg, words)}</span>
    ));
}

const EMAIL_FIELDS = [['from', 'From'], ['to', 'To'], ['cc', 'Cc'], ['date', 'Date'], ['subject', 'Subject']];

/** One email, laid out like a mail app: a grey header (From / To / Subject), then greeting, body, sign-off, signature. */
function EmailCard({ email, words }) {
    const fields = EMAIL_FIELDS.filter(([k]) => email[k]);
    return (
        <div className="rounded-2xl border border-[#DDE1E8] bg-white overflow-hidden [overflow-wrap:anywhere] shadow-[0_1px_2px_rgba(39,29,98,0.06)]" data-email>
            {fields.length > 0 && (
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 px-4 sm:px-6 py-3 bg-[#F3F4F8] border-b border-[#DDE1E8] text-[0.8em] leading-snug">
                    {fields.map(([k, label]) => (
                        <div key={k} className="contents">
                            <dt className="font-semibold text-[#4A5163]">{label}</dt>
                            <dd className={k === 'subject' ? 'font-bold text-[#271D62]' : 'text-[#271D62]'}>{k === 'subject' ? renderRich(email[k], words) : email[k]}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-3">
                {email.greeting && <p>{renderRich(email.greeting, words)}</p>}
                {email.body.map((b, i) => <p key={i}>{renderRich(b, words)}</p>)}
                {(email.signOff || email.signature) && (
                    <div>
                        {email.signOff && <p>{renderRich(email.signOff, words)}</p>}
                        {email.signature && <p className={`whitespace-pre-line ${email.signature.includes('\n') ? 'text-[0.85em] text-[#4A5163] mt-2 pt-2 border-t border-[#EEF0F4]' : ''}`}>{email.signature}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

/** A light-layout paragraph: an email card, a story with emails quoted in it, a dialogue, or plain text. */
function LightParagraph({ p, words, speakers, size }) {
    const email = parseEmail(p);
    if (email) return <div className={`${size} leading-[1.65]`}><EmailCard email={email} words={words} /></div>;
    const parts = splitQuotedEmails(p);
    if (parts) return (
        <div className={`${size} leading-[1.7] flex flex-col gap-4`}>
            {parts.map((x, j) => x.email
                ? <div key={j} className="text-[0.95em] leading-[1.65]"><EmailCard email={x.email} words={words} /></div>
                : <p key={j}>{renderRich(x.text, words)}</p>)}
        </div>
    );
    const lines = parseDialogue(p, speakers);
    if (!lines) return <p className={`${size} leading-[1.7] whitespace-pre-line`}>{renderRich(p, words)}</p>;
    return (
        <div className={`${size} leading-[1.6] grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2`} data-dialogue>
            {lines.map((l, j) => (
                <p key={j} className="contents">
                    <span className="font-bold text-[#E0521F] whitespace-nowrap" data-speaker>{l.speaker}:</span>
                    <span>{renderRich(l.line, words)}</span>
                </p>
            ))}
        </div>
    );
}

// hideSave / onComplete: an Aurora Business student opens the lesson's reading from their course (2026-11-28) — no
// Save, and an "I've read it" button at the end records it as done.
export default function ReadingTextActivity({ activity, onClose, onDerive, hideSave, onComplete }) {
    const navigate = useNavigate();
    const [bgUrl, setBgUrl]             = useState(null);
    const [showSave, setShowSave]       = useState(false);
    const [showVocab, setShowVocab]     = useState(true);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const [deriving, setDeriving]       = useState(null);   // label being generated
    const [deriveError, setDeriveError] = useState('');
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below

    const paragraphs = activity.paragraphs ?? [];
    const vocabulary = activity.vocabulary ?? [];
    const vocabWords  = vocabulary.map(v => v.word);
    // Email paragraphs are left out, or "From:" / "To:" / "Subject:" would count as people talking.
    const speakers    = light ? dialogueSpeakers(paragraphs.filter(p => !parseEmail(p))) : [];
    const letter      = light ? parseLetter(paragraphs) : null; // the whole reading is one email
    const canDerive   = typeof onDerive === 'function' && paragraphs.length > 0;
    const [readDone, setReadDone] = useState(false);
    function markRead() { if (!readDone) { setReadDone(true); onComplete?.({}); } }

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

    // Print-only view — light/printer-friendly, natural page flow (both themes).
    const printView = (
        <div className="read-print-root" style={{ display: 'none' }}>
            <p className="read-print-meta">Reading text — {activity.topic}</p>
            {letter && <div className="read-print-paragraph"><EmailCard email={letter} words={vocabWords} /></div>}
            {!letter && paragraphs.map((p, i) => {
                if (light && (parseEmail(p) || splitQuotedEmails(p))) return <div key={i} className="read-print-paragraph"><LightParagraph p={p} words={vocabWords} speakers={speakers} size="" /></div>;
                const lines = light ? parseDialogue(p, speakers) : null;
                if (!lines) return <p key={i} className="read-print-paragraph">{light ? renderRich(p, vocabWords) : highlightVocab(p, vocabWords)}</p>;
                return <div key={i} className="read-print-paragraph">{lines.map((l, j) => <p key={j} style={{ margin: '0 0 0.3em' }}><strong>{l.speaker}:</strong> {renderRich(l.line, vocabWords)}</p>)}</div>;
            })}
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
    );

    // Aurora Business light layout: the photo as a band above the text, the passage on a white card in a
    // comfortable reading column, the vocabulary on its own card below.
    if (light) {
        const tool = `${LIGHT.iconBtn} hidden md:grid`;
        return (
            <>
                <div className="print:hidden">
                    <LightFrame
                        eyebrow={`Reading text · ${paragraphs.length} paragraph${paragraphs.length === 1 ? '' : 's'}`} title={activity.topic}
                        extra={<>
                            {vocabulary.length > 0 && <button type="button" onClick={() => setShowVocab(v => !v)} className={LIGHT.iconBtn} title="Toggle vocabulary (V)">{showVocab ? 'Hide words' : 'Words'}</button>}
                            <button type="button" onClick={() => window.print()} className={tool} title="Download as PDF">PDF</button>
                        </>}
                        onSave={hideSave ? null : () => setShowSave(true)} isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                        overlay={<>
                            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}
                            {deriving && (
                                <div className="absolute inset-0 z-30 bg-white/85 flex items-center justify-center">
                                    <Spinner message={`Building your ${deriving}… this can take up to 20 seconds`} color="text-[#E0521F]" textColor="text-[#4A5163]" />
                                </div>
                            )}
                        </>}
                    >
                        <div className="max-w-[860px] mx-auto px-4 sm:px-8 py-4 sm:py-7 flex flex-col gap-4 sm:gap-5">
                            {canDerive && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[14px] font-semibold text-[#4A5163] mr-1">Make an exercise from this text:</span>
                                    {DERIVE_OPTIONS.map(opt => (
                                        <button key={opt.type + opt.label} type="button" onClick={() => handleDerive(opt)} disabled={deriving !== null}
                                            className="min-h-11 text-[15px] font-semibold bg-white hover:bg-[#FDEEE7] border border-[#DDE1E8] hover:border-[#E0521F] disabled:opacity-50 rounded-xl px-4 cursor-pointer">
                                            {opt.label}
                                        </button>
                                    ))}
                                    {deriveError && <span className="text-[#B42318] text-sm basis-full" role="alert">{deriveError}</span>}
                                </div>
                            )}
                            <LightPhoto url={bgUrl} className="h-[150px] sm:h-[220px]" />
                            <article className={`${LIGHT.card} px-5 py-6 sm:px-12 sm:py-10 flex flex-col gap-5`} aria-label="Reading text">
                                {letter
                                    ? <div className={`${LIGHT_PARA_SIZES[fontSizeIdx]} leading-[1.7]`}><EmailCard email={letter} words={vocabWords} /></div>
                                    : paragraphs.map((p, i) => <LightParagraph key={i} p={p} words={vocabWords} speakers={speakers} size={LIGHT_PARA_SIZES[fontSizeIdx]} />)}
                            </article>
                            {showVocab && vocabulary.length > 0 && (
                                <section className={`${LIGHT.card} px-5 py-5 sm:px-10 sm:py-7`} aria-label="Vocabulary">
                                    <p className={`${LIGHT.eyebrow} mb-4`}>Vocabulary</p>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
                                        {vocabulary.map((v, i) => (
                                            <div key={i} className={`${GLOSSARY_SIZES[fontSizeIdx]} leading-snug`}>
                                                <dt className="inline font-bold">{v.word}</dt>
                                                <dd className="inline text-[#4A5163]"> — {v.definition}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </section>
                            )}
                            {onComplete && (
                                <div className="flex justify-end pb-4">
                                    {readDone
                                        ? <p className="text-[16px] font-semibold text-[#1E7A4C]" role="status">✓ Done — well read!</p>
                                        : <button type="button" onClick={markRead} className={LIGHT.primary}>I’ve read it</button>}
                                </div>
                            )}
                        </div>
                    </LightFrame>
                </div>
                {printView}
            </>
        );
    }

    return (
      <>
        <div className="fixed inset-0 flex flex-col z-50 print:hidden" style={bgStyle}>
            <div className="absolute inset-0 bg-black/55" />

            {!hideSave && showSave && <SavePanel activity={activity} onDone={() => setShowSave(false)} />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4 shrink-0">
                <div>
                    <span className="text-white font-semibold text-sm capitalize">{activity.topic}</span>
                    <span className="text-white/40 text-sm ml-3">
                        {paragraphs.length} paragraph{paragraphs.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {vocabulary.length > 0 && (
                        <button
                            onClick={() => setShowVocab(v => !v)}
                            className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                            title="Toggle vocabulary (V)"
                        >
                            {showVocab ? 'Hide vocabulary' : 'Show vocabulary'}
                        </button>
                    )}
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
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

        {printView}
      </>
    );
}
