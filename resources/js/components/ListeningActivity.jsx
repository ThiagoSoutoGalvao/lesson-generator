import { useEffect, useMemo, useRef, useState } from 'react';
import SavePanel from '@/components/SavePanel';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { LightFrame, LIGHT } from '@/components/light/LightFrame';

// Listening (2026-11-26, Aurora Business). The recording is one clip per line (App\Services\ListeningMaker), so a
// student can play it all or replay a single line. Four formats, one screen each:
//   answer   True / False on what was said      who      match each sentence to the speaker
//   complete fill the gaps while listening      message  take notes from a voicemail on a phone-message form
// Scored: right answers / total, sent through onComplete each time the student checks.

const TEXT = ['text-[17px]', 'text-[18px] sm:text-[19px]', 'text-[19px] sm:text-[21px]', 'text-[21px] sm:text-[24px]', 'text-[24px] sm:text-[27px]'];
const FORMAT_LABEL = { answer: 'Listen and answer', who: 'Who said it?', complete: 'Listen and complete', message: 'Take the message' };
const HELP = {
    answer: 'Listen, then choose True or False. The text stays hidden until you check.',
    who: 'Listen, then choose who said each sentence.',
    complete: 'Listen and type the missing words. Press ▶ beside a line to hear just that line.',
    message: 'Listen to the voicemail and complete the notes. Numbers matter!',
};
const norm = s => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const clipUrl = id => `/api/audio/${id}`;

// Plays lines [from..to] one after another, with a short pause between speakers.
function usePlayer(lines) {
    const audio = useRef(null);
    const queue = useRef([]);
    const [now, setNow] = useState(null); // index of the line playing
    const [rate, setRate] = useState(1);
    const rateRef = useRef(1);

    useEffect(() => {
        const a = new Audio();
        audio.current = a;
        const onEnd = () => setTimeout(next, 300);
        a.addEventListener('ended', onEnd);
        return () => { a.pause(); a.removeEventListener('ended', onEnd); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function next() {
        const i = queue.current.shift();
        if (i === undefined) { setNow(null); return; }
        const a = audio.current;
        a.src = clipUrl(lines[i].clip);
        a.playbackRate = rateRef.current;
        setNow(i);
        a.play().catch(() => { queue.current = []; setNow(null); });
    }
    function play(from = 0, to = lines.length - 1) {
        audio.current.pause();
        queue.current = Array.from({ length: to - from + 1 }, (_, k) => from + k);
        next();
    }
    function stop() { queue.current = []; audio.current?.pause(); setNow(null); }
    function speed(r) { rateRef.current = r; setRate(r); if (audio.current) audio.current.playbackRate = r; }
    return { now, playing: now !== null, play, stop, rate, speed };
}

export default function ListeningActivity({ activity, onClose, onComplete, hideSave }) {
    const { format = 'answer', lines = [] } = activity;
    const { sizeIdx } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const [showSave, setShowSave] = useState(false);
    const [checked, setChecked] = useState(false);
    const [answers, setAnswers] = useState({});
    const [showText, setShowText] = useState(false);
    const player = usePlayer(lines);
    const txt = TEXT[sizeIdx] ?? TEXT[2];

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Gaps placed in their lines, left to right (the server checked each answer appears in its line).
    const gapLines = useMemo(() => {
        if (format !== 'complete') return [];
        return lines.map((l, i) => {
            const parts = []; let rest = l.text; let k = 0;
            (activity.gaps ?? []).forEach((g, n) => {
                if (g.line !== i) return;
                const at = rest.toLowerCase().indexOf(g.answer.toLowerCase());
                if (at < 0) return;
                parts.push(rest.slice(0, at), { gap: n });
                rest = rest.slice(at + g.answer.length); k++;
            });
            parts.push(rest);
            return { ...l, parts, hasGap: k > 0 };
        });
    }, [activity, format, lines]);

    const items = format === 'complete' ? (activity.gaps ?? []) : format === 'message' ? (activity.fields ?? []) : (activity.items ?? []);
    const isRight = (it, n) => {
        const a = answers[n];
        if (format === 'answer') return a === it.answer;
        if (format === 'who') return a === it.who;
        if (format === 'complete') return norm(a) !== '' && norm(a) === norm(it.answer);
        return norm(a) !== '' && (it.accept ?? []).some(x => norm(a).includes(norm(x)));
    };
    const score = items.filter(isRight).length;

    function check() {
        setChecked(true);
        onComplete?.({ score, maxScore: items.length });
    }
    function again() { setChecked(false); setAnswers({}); setShowText(false); player.stop(); }
    const set = (n, v) => { if (!checked) setAnswers(prev => ({ ...prev, [n]: v })); };
    const box = n => (checked ? (isRight(items[n], n) ? LIGHT.right : LIGHT.wrong) : 'border border-[#DDE1E8] bg-white');
    const choice = (on, n, v, label) => (
        <button key={label} type="button" aria-pressed={on} onClick={() => set(n, v)} disabled={checked}
            className={`min-h-11 px-4 rounded-xl border font-semibold text-[16px] cursor-pointer disabled:cursor-default ${on ? 'bg-[#271D62] text-white border-[#271D62]' : 'bg-white border-[#DDE1E8] hover:bg-[#F1F2F5]'}`}>{label}</button>
    );

    const frame = {
        eyebrow: FORMAT_LABEL[format] ?? 'Listening', title: activity.topic || 'Listening',
        onSave: hideSave ? undefined : () => setShowSave(true),
        isFullscreen, onFullscreen: toggleFullscreen, onClose,
        overlay: !hideSave && showSave ? <SavePanel activity={activity} onDone={() => setShowSave(false)} /> : null,
    };

    const transcript = (
        <ol className="flex flex-col gap-1" aria-label="What they said">
            {lines.map((l, i) => (
                <li key={i} className={`flex gap-3 rounded-xl px-3 py-2 ${player.now === i ? 'bg-[#FDE9E0]' : ''}`}>
                    <span className="font-semibold text-[#C9461A] shrink-0 min-w-[4.5rem]">{l.who === 'Narrator' ? '' : l.who}</span>
                    <span className={`${txt} leading-relaxed min-w-0`}>{l.text}</span>
                </li>
            ))}
        </ol>
    );

    return (
        <LightFrame {...frame}>
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col gap-4 sm:gap-6">
                <section aria-label="Recording" className={`${LIGHT.card} p-4 sm:p-6 flex flex-col gap-3`}>
                    <p className={`${LIGHT.muted} text-[15px] sm:text-[17px]`}>{HELP[format]}</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => (player.playing ? player.stop() : player.play())} className={`${LIGHT.primary} min-w-40`} data-testid="listen-play">
                            {player.playing ? '❚❚ Stop' : '▶ Play'}
                        </button>
                        <div role="group" aria-label="Speed" className="flex gap-1.5">
                            {[0.75, 1].map(r => (
                                <button key={r} type="button" aria-pressed={player.rate === r} onClick={() => player.speed(r)}
                                    className={`h-11 px-3.5 rounded-[10px] border text-[15px] font-semibold cursor-pointer ${player.rate === r ? 'bg-[#271D62] text-white border-[#271D62]' : 'bg-white border-[#DDE1E8] hover:bg-[#F1F2F5]'}`}>{r}×</button>
                            ))}
                        </div>
                        <span role="status" className={`${LIGHT.muted} text-[15px]`}>
                            {player.playing && lines[player.now]?.who !== 'Narrator' ? `${lines[player.now].who} is speaking…` : player.playing ? 'Playing…' : ''}
                        </span>
                    </div>
                </section>

                {format === 'complete' ? (
                    <section aria-label="Complete the text" className={`${LIGHT.card} p-3 sm:p-5`}>
                        <ol className="flex flex-col gap-1">
                            {gapLines.map((l, i) => (
                                <li key={i} className={`flex gap-2 sm:gap-3 items-start rounded-xl px-2 py-2 ${player.now === i ? 'bg-[#FDE9E0]' : ''}`}>
                                    <button type="button" onClick={() => player.play(i, i)} aria-label={`Play line ${i + 1}`} className="shrink-0 w-9 h-9 rounded-[10px] border border-[#DDE1E8] bg-white hover:bg-[#F1F2F5] cursor-pointer text-[13px]">▶</button>
                                    <div className="flex flex-col sm:flex-row sm:gap-3 min-w-0 flex-1">
                                    {l.who !== 'Narrator' && <span className="font-semibold text-[#C9461A] shrink-0 sm:min-w-[4rem] sm:pt-1.5 text-[14px] sm:text-[16px]">{l.who}</span>}
                                    <span className={`${txt} leading-[2.1] min-w-0`}>
                                        {l.parts.map((p, k) => typeof p === 'string' ? <span key={k}>{p}</span> : (
                                            <span key={k} className="inline-flex flex-col align-baseline mx-1 max-w-full">
                                                <input aria-label={`Gap ${p.gap + 1}`} value={answers[p.gap] ?? ''} onChange={e => set(p.gap, e.target.value)} readOnly={checked}
                                                    autoComplete="off" spellCheck={false} style={{ width: `${Math.max(5, items[p.gap].answer.length + 1.5)}ch` }}
                                                    className={`rounded-lg px-2 py-0 text-[#271D62] ${box(p.gap)} max-w-full`} />
                                                {checked && !isRight(items[p.gap], p.gap) && <span className="text-[13px] text-[#1E7A4C] font-semibold leading-tight">{items[p.gap].answer}</span>}
                                            </span>
                                        ))}
                                    </span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                ) : format === 'message' ? (
                    <section aria-label="Phone message" className="rounded-2xl border-2 border-dashed border-[#DDE1E8] bg-[#FFFBEA] p-4 sm:p-6 flex flex-col gap-4">
                        <p className="font-display font-bold tracking-[0.08em] text-[18px]">PHONE MESSAGE</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {items.map((f, n) => (
                                <label key={n} className="flex flex-col gap-1.5 text-[15px] sm:text-[16px] font-semibold min-w-0">
                                    {f.label}
                                    <input value={answers[n] ?? ''} onChange={e => set(n, e.target.value)} readOnly={checked} autoComplete="off"
                                        className={`rounded-xl px-3 py-2.5 font-normal ${txt} ${box(n)}`} />
                                    {checked && !isRight(f, n) && <span className="text-[14px] text-[#1E7A4C]">{f.answer}</span>}
                                </label>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section aria-label="Questions" className="flex flex-col gap-2.5">
                        {items.map((it, n) => (
                            <div key={n} className={`rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 ${box(n)}`} data-testid="listen-item">
                                <p className={`${txt} flex-1 basis-60 min-w-0`}>{format === 'who' ? `“${it.quote}”` : it.statement}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {format === 'answer'
                                        ? [choice(answers[n] === true, n, true, 'True'), choice(answers[n] === false, n, false, 'False')]
                                        : (activity.speakers ?? []).map(s => choice(answers[n] === s, n, s, s))}
                                </div>
                                {checked && (
                                    <p className={`basis-full text-[14px] sm:text-[15px] ${isRight(it, n) ? 'text-[#14532D]' : 'text-[#7F1D1D]'}`}>
                                        {format === 'answer' ? `${isRight(it, n) ? '✓' : '✗'} ${it.answer ? 'True' : 'False'}: ${it.why}` : `${isRight(it, n) ? '✓' : '✗'} ${it.who} said it.`}
                                    </p>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    {!checked
                        ? <button type="button" onClick={check} className={LIGHT.primary}>Check answers</button>
                        : <>
                            <p role="status" className="font-display text-[22px] sm:text-[26px] font-semibold">{score} of {items.length} right</p>
                            <button type="button" onClick={again} className={LIGHT.secondary}>Try again</button>
                        </>}
                    {format !== 'complete' && checked && (
                        <button type="button" onClick={() => setShowText(v => !v)} className={LIGHT.secondary}>{showText ? 'Hide the text' : 'Show the text'}</button>
                    )}
                </div>
                {showText && format !== 'complete' && <section aria-label="Transcript" className={`${LIGHT.card} p-3 sm:p-5`}>{transcript}</section>}
            </div>
        </LightFrame>
    );
}
