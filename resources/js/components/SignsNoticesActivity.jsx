import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';
import { useItemEdit } from '@/lib/itemEdit';

const TEXT_SIZES   = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const OPTION_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const LETTERS = ['A', 'B', 'C'];
// Light (Aurora Business) sizes.
const L_TEXT_SIZES = ['text-[18px]', 'text-[20px] sm:text-[22px]', 'text-[22px] sm:text-[26px]', 'text-[25px] sm:text-[30px]', 'text-[28px] sm:text-[34px]'];
const L_Q_SIZES    = ['text-[19px]', 'text-[21px] sm:text-[23px]', 'text-[23px] sm:text-[26px]', 'text-[26px] sm:text-[30px]', 'text-[29px] sm:text-[34px]'];
const L_OPT_SIZES  = ['text-[16px]', 'text-[17px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];

// Light version of the text, dressed as what it is — on a white page, so each kind keeps its own surface.
function LightTextCard({ item, sizeCls }) {
    const tag = <p className={`${LIGHT.eyebrow} mb-2`}>{{ sign: 'Sign', notice: 'Notice', message: 'Message', email: 'Email' }[item.kind] ?? 'Text'}</p>;
    if (item.kind === 'sign') return (
        <div data-kind="sign">{tag}
            <div className="bg-white border-[5px] border-[#271D62] rounded-xl px-5 py-8 text-center">
                <p className={`${sizeCls} font-extrabold uppercase tracking-wide leading-tight`}>{item.text}</p>
            </div>
        </div>
    );
    if (item.kind === 'message') return (
        <div data-kind="message">{tag}
            <div className="bg-[#E7F6EE] border border-[#CFE9DA] rounded-3xl rounded-tl-md px-5 py-4 max-w-full inline-block">
                <p className={`${sizeCls} leading-snug`}>{item.text}</p>
            </div>
        </div>
    );
    if (item.kind === 'email') return (
        <div data-kind="email">{tag}
            <div className="bg-white border border-[#DDE1E8] rounded-xl overflow-hidden">
                <div className="bg-[#F6F7F9] border-b border-[#DDE1E8] px-5 py-3 text-[15px] sm:text-[16px] text-[#4A5163] flex flex-col gap-0.5">
                    {item.from && <span><span className="font-semibold text-[#271D62]">From:</span> {item.from}</span>}
                    {item.subject && <span><span className="font-semibold text-[#271D62]">Subject:</span> {item.subject}</span>}
                </div>
                <p className={`${sizeCls} leading-snug px-5 py-5 whitespace-pre-line`}>{item.text}</p>
            </div>
        </div>
    );
    return (
        <div data-kind="notice">{tag}
            <div className="bg-[#FFF8E6] border border-[#F1E2B8] border-t-8 border-t-[#F2C14E] rounded-md px-5 py-6">
                <p className={`${sizeCls} leading-snug text-center`}>{item.text}</p>
            </div>
        </div>
    );
}

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
export default function SignsNoticesActivity({ activity, onClose, onComplete, hideSave, onEditItems }) {
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
    const light = useIsLightUi(); // Aurora Business: the light layout below (text left, question right; no photo)
    // ✎ Edit inside the activity (teacher, saved activity): the text is answered again after an edit.
    const ed = useItemEdit('signs_notices', activity, onEditItems, index, {
        onSaved: () => { setWrongIdx([]); setSolved(false); },
        onRemoved: n => { setWrongIdx([]); setSolved(false); setIndex(i => Math.min(i, n - 1)); },
    });

    const item = items[index];

    useEffect(() => {
        if (light) return;
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

    if (light) {
        const frame = {
            eyebrow: 'Signs & notices', title: activity.topic || 'Read and answer',
            onSave: hideSave ? undefined : () => setShowSave(true),
            isFullscreen, onFullscreen: toggleFullscreen, onClose,
            overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
        };
        if (finished) {
            return (
                <LightFrame {...frame}>
                    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
                        <section className={`${LIGHT.glowCard} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="Results">
                            <p className={LIGHT.chipCenter}>All done</p>
                            <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-tight">{firstTry} of {total} right first time</h1>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                <button type="button" onClick={restart} className={LIGHT.primary}>Play again</button>
                                {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                            </div>
                        </section>
                    </div>
                </LightFrame>
            );
        }
        return (
            <LightFrame {...frame} extra={<span className="hidden sm:flex"><LightProgress index={index} total={total} label="Text" /></span>}>
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
                    <section aria-label="Text" className={`${LIGHT.card} p-5 sm:p-8`}>
                        <LightTextCard item={item} sizeCls={L_TEXT_SIZES[fontSizeIdx]} />
                    </section>
                    <section aria-label="Question" className={`${LIGHT.card} p-5 sm:p-8 flex flex-col gap-5`}>
                        <div className="flex items-start justify-between gap-3">
                            <p className={LIGHT.chip}>Text {index + 1} of {total}</p>
                            {ed.button}
                        </div>
                        {ed.editor ?? <>
                        <h1 className={`font-display ${L_Q_SIZES[fontSizeIdx]} font-semibold leading-snug`}>{item.question}</h1>
                        <div role="group" aria-label="Options" className="flex flex-col gap-3">
                            {item.options.map((opt, i) => {
                                const isRight = solved && i === item.answer;
                                const isWrong = wrongIdx.includes(i);
                                let box = 'border border-[#DDE1E8] bg-white hover:bg-[#F6F7F9] font-medium cursor-pointer';
                                let chip = 'bg-[#F1F2F5] text-[#4A5163]';
                                if (isRight) { box = `${LIGHT.right} cursor-default`; chip = LIGHT.rightChip; }
                                else if (isWrong) { box = `${LIGHT.wrong} cursor-default`; chip = LIGHT.wrongChip; }
                                else if (solved) box = 'border border-[#DDE1E8] bg-white opacity-60 cursor-default';
                                return (
                                    <button key={i} type="button" onClick={() => choose(i)} disabled={solved || isWrong}
                                        className={`${box} ${L_OPT_SIZES[fontSizeIdx]} min-h-14 w-full text-left flex items-center gap-4 px-4 py-3 rounded-[14px] text-[#271D62]`}>
                                        <span className={`${chip} shrink-0 w-8 h-8 rounded-[10px] grid place-items-center text-[14px] font-semibold`}>{LETTERS[i]}</span>
                                        <span className="min-w-0 break-words">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {wrongIdx.length > 0 && !solved && <p role="status" className="rounded-xl px-4 py-2.5 bg-[#FDECEA] text-[#7F1D1D] text-[16px] sm:text-[18px]">Not that one. Read it again and try once more.</p>}
                        {solved && <p role="status" className="rounded-xl px-4 py-2.5 bg-[#E5F4EC] text-[#14532D] text-[16px] sm:text-[18px] font-semibold">Right!</p>}
                        <div className="flex justify-end">
                            <button type="button" onClick={next} disabled={!solved} className={LIGHT.primary}>
                                {!solved ? 'Choose an answer' : index + 1 >= total ? 'See results' : 'Next text'}
                            </button>
                        </div>
                        </>}
                    </section>
                </div>
            </LightFrame>
        );
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
