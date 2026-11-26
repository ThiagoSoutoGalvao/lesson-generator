import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Spinner from '@/components/Spinner';

// A lesson's reading / presentation, replaced from the lesson pack (2026-11-26, Aurora Business courses).
// Everything happens on this one card, so a teacher who is new to the app never has to leave the page:
//  · "Write a new version": say what should change → Claude writes one → read it here → "Use this one" (the
//    activities made from it are remade on the server) or "Try again".
//  · "Edit text": small fixes by hand; remaking the activities is optional.
// Server side: App\Http\Controllers\MaterialRedoController + App\Jobs\RemakeFromMaterialJob.

const btn = 'text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const primary = `${btn} bg-[#e0521f] hover:bg-[#c9461a] text-white`;
const quiet = `${btn} border border-ui-line text-ui-ink hover:bg-ui-sel`;
const field = 'w-full rounded-lg border border-ui-line bg-ui-field text-ui-ink text-sm px-3 py-2';
const plain = s => String(s ?? '').replace(/\*\*/g, '');

export default function MaterialRedo({ a, onReplaced }) {
    const isReading = a.type === 'reading_text';
    const what = isReading ? 'reading' : 'presentation';
    const [mode, setMode] = useState(null); // null | 'new' | 'edit'
    const [note, setNote] = useState('');
    const [draft, setDraft] = useState(null); // the new version (content), not saved yet
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [remake, setRemake] = useState(null); // { state, done, failed, message? } from the server
    const timer = useRef(null);

    // A remake still running from earlier (the teacher left the page and came back).
    useEffect(() => {
        axios.get(`/api/materials/${a.id}/remake-status`).then(({ data }) => {
            if (['queued', 'running'].includes(data.state)) { setRemake(data); poll(); }
        }).catch(() => {});
        return () => clearTimeout(timer.current);
    }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps

    function poll() {
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            try {
                const { data } = await axios.get(`/api/materials/${a.id}/remake-status`);
                setRemake(data);
                if (['queued', 'running'].includes(data.state)) poll();
                else onReplaced?.(null, true);
            } catch { poll(); }
        }, 4000);
    }

    async function writeNew() {
        setBusy(true); setError(''); setDraft(null);
        try {
            const { data } = await axios.post(`/api/materials/${a.id}/new-version`, { note: note.trim() || undefined });
            setDraft(data.content);
        } catch (e) {
            setError(e.response?.data?.message ?? 'Could not write a new version. Please try again.');
        } finally { setBusy(false); }
    }

    async function save(content, withRemake) {
        setBusy(true); setError('');
        try {
            const { data } = await axios.post(`/api/materials/${a.id}/replace`, { content, remake: withRemake });
            onReplaced?.(data.activity, false);
            setMode(null); setDraft(null); setNote('');
            if (data.remaking) { setRemake({ state: 'queued', done: 0, failed: 0 }); poll(); }
        } catch (e) {
            setError(e.response?.data?.message ?? 'Could not save it. Please try again.');
        } finally { setBusy(false); }
    }

    const running = remake && ['queued', 'running'].includes(remake.state);

    return (
        <div className="flex flex-col gap-2" data-testid="material-redo">
            {running && (
                <div className="rounded-lg bg-ui-sel border border-ui-line px-3 py-2 text-sm text-ui-ink flex items-center gap-2" role="status">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-ui-line border-t-ui-accent animate-spin shrink-0" aria-hidden="true" />
                    <span>Remaking the activities from this {what}… {remake.done > 0 && `${remake.done} done. `}You can leave this page.</span>
                </div>
            )}
            {remake?.state === 'done' && (
                <p className="text-sm text-ui-ink" role="status">
                    ✓ {remake.done} {remake.done === 1 ? 'activity' : 'activities'} remade from the new {what}.
                    {remake.failed > 0 && ` ${remake.failed} could not be remade and kept the old version.`}
                </p>
            )}
            {remake?.state === 'error' && <p className="text-sm text-ui-danger">Remaking the activities stopped: {remake.message}</p>}

            {!mode && !running && (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <button type="button" onClick={() => setMode('new')} className="text-sm font-semibold text-ui-accent hover:text-ui-ink underline underline-offset-2 cursor-pointer">Write a new version</button>
                    <button type="button" onClick={() => setMode('edit')} className="text-sm font-semibold text-ui-accent hover:text-ui-ink underline underline-offset-2 cursor-pointer">Edit text</button>
                </div>
            )}

            {mode === 'new' && (
                <div className="rounded-xl border border-ui-line bg-ui-panel p-3 flex flex-col gap-3">
                    <label className="text-sm text-ui-ink font-semibold" htmlFor={`note-${a.id}`}>What should change? <span className="font-normal text-ui-muted">(optional)</span></label>
                    <textarea id={`note-${a.id}`} rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className={field}
                        placeholder={isReading ? 'e.g. The story doesn’t make sense — make it a clear email from Ana to the team.' : 'e.g. Fewer slides and simpler examples.'} />
                    {!draft && !busy && (
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={writeNew} className={primary}>Write it</button>
                            <button type="button" onClick={() => { setMode(null); setError(''); }} className={quiet}>Cancel</button>
                        </div>
                    )}
                    {busy && <Spinner message={draft ? 'Saving…' : `Writing a new ${what}… about 30 seconds`} color="text-ui-muted" textColor="text-ui-faint" />}
                    {draft && !busy && (
                        <>
                            <p className="text-ui-faint text-[11px] font-bold tracking-[0.12em] uppercase">The new version — nothing has changed yet</p>
                            <Preview content={draft} isReading={isReading} />
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => save(draft, true)} className={primary}>Use this one</button>
                                <button type="button" onClick={writeNew} className={quiet}>Try again</button>
                                <button type="button" onClick={() => { setMode(null); setDraft(null); setError(''); }} className={quiet}>Keep the old one</button>
                            </div>
                            <p className="text-xs text-ui-muted">“Use this one” replaces the {what} and remakes the activities made from it (a few minutes, on the server).</p>
                        </>
                    )}
                </div>
            )}

            {mode === 'edit' && <Editor a={a} isReading={isReading} busy={busy} onSave={save} onCancel={() => { setMode(null); setError(''); }} />}

            {error && <p className="text-sm text-ui-danger">{error}</p>}
        </div>
    );
}

function Preview({ content, isReading }) {
    return (
        <div className="rounded-lg bg-ui-well border border-ui-line p-3 max-h-96 overflow-y-auto flex flex-col gap-2 text-sm text-ui-ink" data-testid="redo-preview">
            {content.topic && <p className="font-display font-semibold text-base">{plain(content.topic)}</p>}
            {isReading
                ? (content.paragraphs ?? []).map((p, i) => <p key={i} className="leading-relaxed">{plain(p)}</p>)
                : (content.slides ?? []).map((s, i) => (
                    <div key={i}>
                        <p className="font-semibold">{i + 1}. {plain(s.title)}</p>
                        {s.rule && <p className="text-ui-muted">{plain(s.rule)}</p>}
                        {(s.examples ?? []).map((ex, j) => <p key={j} className="text-ui-muted pl-3">• {plain(ex)}</p>)}
                    </div>
                ))}
        </div>
    );
}

function Editor({ a, isReading, busy, onSave, onCancel }) {
    const [c, setC] = useState(() => JSON.parse(JSON.stringify(a.content ?? {})));
    const [remake, setRemake] = useState(false);
    const setSlide = (i, patch) => setC(prev => ({ ...prev, slides: prev.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

    return (
        <div className="rounded-xl border border-ui-line bg-ui-panel p-3 flex flex-col gap-3" data-testid="material-editor">
            <label className="text-sm text-ui-ink font-semibold">Title
                <input value={c.topic ?? ''} onChange={e => setC({ ...c, topic: e.target.value })} maxLength={200} className={`${field} mt-1 font-normal`} />
            </label>
            {isReading
                ? (c.paragraphs ?? []).map((p, i) => (
                    <label key={i} className="text-sm text-ui-ink font-semibold">Paragraph {i + 1}
                        <textarea rows={5} value={p} className={`${field} mt-1 font-normal`}
                            onChange={e => setC({ ...c, paragraphs: c.paragraphs.map((x, j) => (j === i ? e.target.value : x)) })} />
                    </label>
                ))
                : (c.slides ?? []).map((s, i) => (
                    <fieldset key={i} className="border border-ui-line rounded-lg p-2.5 flex flex-col gap-2">
                        <legend className="text-sm text-ui-ink font-semibold px-1">Slide {i + 1}</legend>
                        <input aria-label={`Slide ${i + 1} title`} value={s.title ?? ''} onChange={e => setSlide(i, { title: e.target.value })} className={field} />
                        <textarea aria-label={`Slide ${i + 1} text`} rows={3} value={s.rule ?? ''} onChange={e => setSlide(i, { rule: e.target.value })} className={field} />
                        <textarea aria-label={`Slide ${i + 1} examples, one per line`} rows={3} value={(s.examples ?? []).join('\n')} className={field}
                            onChange={e => setSlide(i, { examples: e.target.value.split('\n') })} />
                    </fieldset>
                ))}
            <label className="flex items-center gap-2 text-sm text-ui-ink">
                <input type="checkbox" checked={remake} onChange={e => setRemake(e.target.checked)} />
                Also remake the activities made from it (for bigger changes)
            </label>
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => onSave(clean(c, isReading), remake)} className={primary}>{busy ? 'Saving…' : 'Save'}</button>
                <button type="button" disabled={busy} onClick={onCancel} className={quiet}>Cancel</button>
            </div>
        </div>
    );
}

// Blank example lines and empty paragraphs are dropped before saving.
function clean(c, isReading) {
    if (isReading) return { ...c, paragraphs: (c.paragraphs ?? []).filter(p => p.trim()) };
    return { ...c, slides: (c.slides ?? []).map(s => ({ ...s, examples: (s.examples ?? []).map(x => x.trim()).filter(Boolean) })) };
}
