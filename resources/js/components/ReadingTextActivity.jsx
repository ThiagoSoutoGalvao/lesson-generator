import { Fragment, useEffect, useRef, useState } from 'react';
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
// Magazine layout's "Words in this text" box: word (Poppins) and definition, following the Aa size.
const WORD_SIZES = ['text-[14px]', 'text-[15px]', 'text-[16px]', 'text-[18px]', 'text-[20px]'];
const DEF_SIZES  = ['text-[13px]', 'text-[13px]', 'text-[14px]', 'text-[16px]', 'text-[18px]'];

// The magazine layout's left column sticks under the header; when it is taller than the screen (a long word list) it
// sticks by its bottom instead (a negative top), so the last words stay reachable while the text scrolls.
function useStickyTop(ref, on) {
    const [top, setTop] = useState(24);
    useEffect(() => {
        const el = ref.current;
        const main = el?.closest('main');
        if (!on || !el || !main || typeof ResizeObserver === 'undefined') return undefined;
        const fit = () => setTop(Math.min(24, main.clientHeight - el.offsetHeight - 24));
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(el);
        ro.observe(main);
        return () => ro.disconnect();
    }, [on, ref]);
    return top;
}

/** "FIRST STEPS L03A · Reading Text · …" → "FIRST STEPS · Unit 3 · Reading" (shown upper-case). */
export function kickerFromName(name) {
    const m = /^([A-Z][A-Z ]*?) L(\d{1,2})[A-C]?\s*·/.exec(name ?? '');
    return m ? `${m[1]} · Unit ${Number(m[2])} · Reading` : 'Reading';
}

/** The optional magazine extras (newer readings): dek, byline ({ name, role, company } or a string), pull ({ after, text }). */
export function magazineExtras(activity) {
    const dek = typeof activity.dek === 'string' && activity.dek.trim() ? activity.dek.trim() : null;
    const b = activity.byline;
    const byline = typeof b === 'string' ? (b.trim() ? [b.trim()] : null)
        : b && typeof b === 'object' ? ([b.name, b.role, b.company].filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()))
        : null;
    const pl = activity.pull;
    const count = (activity.paragraphs ?? []).length;
    const pull = pl && typeof pl.text === 'string' && pl.text.trim() && Number.isInteger(pl.after) && pl.after >= 0 && pl.after < count - 1
        ? { after: pl.after, text: pl.text.trim().replace(/^[“"]|[”"]$/g, '') } : null;
    const caption = b && typeof b === 'object' && b.name ? [b.name, b.company].filter(Boolean).join(', ') : null;
    return { dek, byline: byline?.length ? byline : null, pull, caption };
}
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
// dropCap: the magazine layout's coral initial on paragraph 1 — plain prose only, never on an email or a dialogue.
const DROP_CAP = 'first-letter:float-left first-letter:font-display first-letter:font-bold first-letter:text-[#E0521F] first-letter:text-[52px] min-[900px]:first-letter:text-[64px] first-letter:leading-[0.9] first-letter:mt-1.5 first-letter:mr-2.5';
function LightParagraph({ p, words, speakers, size, dropCap = false }) {
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
    if (!lines) return <p className={`${size} leading-[1.65] whitespace-pre-line ${dropCap ? DROP_CAP : ''}`} data-drop-cap={dropCap || undefined}>{renderRich(p, words)}</p>;
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
// name: the saved activity's name, for the kicker ("FIRST STEPS · UNIT 3 · READING"); optional.
export default function ReadingTextActivity({ activity, onClose, onDerive, hideSave, onComplete, name }) {
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
    const { dek, byline, pull, caption } = magazineExtras(activity);
    const kicker = kickerFromName(name);
    const leftRef = useRef(null);
    const stickyTop = useStickyTop(leftRef, light);
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

    // Aurora Business light layout: a magazine page on warm paper (2026-11-28). Every saved reading works from topic /
    // paragraphs / vocabulary alone; `dek`, `byline` and `pull` are optional extras newer readings carry.
    if (light) {
        const tool = `${LIGHT.iconBtn} hidden md:grid`;
        return (
            <>
                <div className="print:hidden">
                    <LightFrame ground="#FAF6F0"
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
                        <div className="max-w-[1240px] mx-auto px-4 min-[900px]:px-10 py-4 min-[900px]:py-7 flex flex-col gap-4 min-[900px]:gap-6">
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
                            {/* Magazine layout "A · Foto ao lado" (2026-11-28, mockup artifact WbHv5SHyEP9Ezv8a6oq8yH): photo +
                                vocabulary on the left, sticky; the article on the right. Below 900px it stacks — photo,
                                caption, article, then the vocabulary last (the left column becomes `contents`). */}
                            <div className="grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 min-[900px]:gap-11" data-reading-layout>
                                <div className="contents min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-4 min-[900px]:sticky min-[900px]:self-start" style={{ top: stickyTop }} ref={leftRef} data-reading-left>
                                    <div className="order-1 min-[900px]:order-none relative aspect-[16/10] min-[900px]:aspect-[4/5] min-[900px]:max-h-[56vh] rounded-[14px] overflow-hidden bg-[#EDE6DB]" data-reading-photo>
                                        {bgUrl && <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                                    </div>
                                    {caption && <p className="order-2 min-[900px]:order-none -mt-1 text-[13px] text-[#4A5163]">{caption}</p>}
                                    {showVocab && vocabulary.length > 0 && (
                                        <section className="order-4 min-[900px]:order-none bg-white border border-[#E9E1D6] rounded-[14px] px-5 py-[18px]" aria-label="Words in this text" data-reading-words>
                                            <h2 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[#9A3412] mb-3">Words in this text</h2>
                                            <dl className="grid gap-3">
                                                {vocabulary.map((v, i) => (
                                                    <div key={i}>
                                                        <dt className={`font-display font-semibold ${WORD_SIZES[fontSizeIdx]}`}>{v.word}</dt>
                                                        <dd className={`mt-0.5 leading-[1.45] text-[#4A5163] ${DEF_SIZES[fontSizeIdx]}`}>{v.definition}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </section>
                                    )}
                                </div>
                                <article className="order-3 min-[900px]:order-none min-w-0 min-[900px]:pl-10" aria-label="Reading text" data-reading-article>
                                    <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.14em] uppercase text-[#9A3412]" data-reading-kicker>{kicker}</p>
                                    <h1 className="font-display font-bold text-[34px] min-[900px]:text-[clamp(40px,3.6vw,54px)] leading-[1.05] tracking-[-0.02em] mt-2 mb-3 [text-wrap:balance] [overflow-wrap:anywhere]">{activity.topic}</h1>
                                    {dek && <p className="font-serif-text italic text-[18px] min-[900px]:text-[20px] leading-[1.45] text-[#4A5163] max-w-[46ch] mb-[18px]" data-reading-dek>{dek}</p>}
                                    {byline && (
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[#4A5163] py-3 border-y border-[#E9E1D6] mb-6" data-reading-byline>
                                            {byline.map((b, i) => (
                                                <span key={i} className="contents">
                                                    {i > 0 && <span className="w-1 h-1 rounded-full bg-[#E0521F]" aria-hidden="true" />}
                                                    {i === 0 ? <b className="text-[#271D62]">{b}</b> : <span>{b}</span>}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {!dek && !byline && <div className="mb-5" />}
                                    {letter
                                        ? <div className={`${LIGHT_PARA_SIZES[fontSizeIdx]} leading-[1.7] max-w-[64ch]`}><EmailCard email={letter} words={vocabWords} /></div>
                                        : (
                                            <div className="flex flex-col gap-5 max-w-[64ch]">
                                                {paragraphs.map((p, i) => (
                                                    <Fragment key={i}>
                                                        <div className="relative" data-para>
                                                            <span className="block mb-0.5 min-[900px]:mb-0 min-[900px]:absolute min-[900px]:-left-10 min-[900px]:top-1 min-[900px]:w-7 min-[900px]:text-right font-display font-semibold text-[13px] text-[#E0521F]" aria-hidden="true" data-para-number>{i + 1}</span>
                                                            <LightParagraph p={p} words={vocabWords} speakers={speakers} size={LIGHT_PARA_SIZES[fontSizeIdx]} dropCap={i === 0} />
                                                        </div>
                                                        {pull && pull.after === i && (
                                                            <blockquote className="my-2 pl-[22px] py-1 border-l-4 border-[#E0521F] font-serif-text italic text-[22px] min-[900px]:text-[26px] leading-[1.35] max-w-[30ch]" data-reading-pull>“{pull.text}”</blockquote>
                                                        )}
                                                    </Fragment>
                                                ))}
                                            </div>
                                        )}
                                    {onComplete && (
                                        <div className="flex justify-end pt-6 pb-4">
                                            {readDone
                                                ? <p className="text-[16px] font-semibold text-[#1E7A4C]" role="status">✓ Done — well read!</p>
                                                : <button type="button" onClick={markRead} className={LIGHT.primary}>I’ve read it</button>}
                                        </div>
                                    )}
                                </article>
                            </div>
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
