import { useState } from 'react';
import axios from 'axios';

// "Edit text" on a lesson-pack card (2026-11-27): fix the words of an activity by hand, on the same page.
// Picture Prompts shows each photo next to its question, so a question that doesn't match the picture can be
// rewritten to fit it. Only text is sent; the server (ActivityTextController) keeps photos and the item count.

export const TEXT_EDIT_TYPES = ['picture_prompts', 'discussion_questions'];

const btn = 'text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const primary = `${btn} bg-[#e0521f] hover:bg-[#c9461a] text-white`;
const quiet = `${btn} border border-ui-line text-ui-ink hover:bg-ui-sel`;
const field = 'w-full rounded-lg border border-ui-line bg-ui-field text-ui-ink text-sm px-3 py-2 font-normal';
const lines = s => s.split('\n');

export default function ActivityTextEditor({ a, onSaved }) {
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    if (!TEXT_EDIT_TYPES.includes(a.type)) return null;
    return (
        <div className="flex flex-col gap-2" data-testid="text-editor-slot">
            {!open && (
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => { setOpen(true); setSaved(false); }}
                        className="self-start text-sm font-semibold text-ui-accent hover:text-ui-ink underline underline-offset-2 cursor-pointer">Edit text</button>
                    {saved && <span className="text-sm text-ui-ink" role="status">✓ Saved</span>}
                </div>
            )}
            {open && <Editor a={a} onCancel={() => setOpen(false)} onSaved={updated => { onSaved?.(updated); setOpen(false); setSaved(true); }} />}
        </div>
    );
}

function Editor({ a, onCancel, onSaved }) {
    const pictures = a.type === 'picture_prompts';
    const listKey = pictures ? 'prompts' : 'questions';
    const lineKey = pictures ? 'starters' : 'follow_ups';
    const [c, setC] = useState(() => JSON.parse(JSON.stringify(a.content ?? {})));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const items = c[listKey] ?? [];
    const setItem = (i, patch) => setC(prev => ({ ...prev, [listKey]: prev[listKey].map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

    async function save() {
        setBusy(true); setError('');
        try {
            const body = {
                topic: c.topic ?? '',
                ...(Array.isArray(c.targets) ? { targets: c.targets } : {}),
                [listKey]: items.map(x => ({ question: x.question ?? '', [lineKey]: x[lineKey] ?? [] })),
            };
            const { data } = await axios.patch(`/api/activities/${a.id}/text`, { content: body });
            onSaved(data.activity);
        } catch (e) {
            const errs = e.response?.data?.errors;
            setError(errs ? Object.values(errs).flat()[0] : (e.response?.data?.message ?? 'Could not save it. Please try again.'));
        } finally { setBusy(false); }
    }

    return (
        <div className="rounded-xl border border-ui-line bg-ui-panel p-3 flex flex-col gap-3" data-testid="text-editor">
            <label className="text-sm text-ui-ink font-semibold">Title
                <input value={c.topic ?? ''} onChange={e => setC({ ...c, topic: e.target.value })} maxLength={200} className={`${field} mt-1`} />
            </label>
            {items.map((x, i) => (
                <fieldset key={i} className="border border-ui-line rounded-lg p-2.5 flex flex-col gap-2">
                    <legend className="text-sm text-ui-ink font-semibold px-1">{pictures ? 'Picture' : 'Question'} {i + 1}</legend>
                    {pictures && x.photo && (
                        <img src={x.photo} alt={`Picture ${i + 1}`} loading="lazy" className="w-full max-h-48 object-cover rounded-md border border-ui-line" />
                    )}
                    <textarea aria-label={`${pictures ? 'Picture' : 'Question'} ${i + 1} question`} rows={3} maxLength={600} value={x.question ?? ''}
                        onChange={e => setItem(i, { question: e.target.value })} className={field} />
                    <label className="text-xs text-ui-muted">{pictures ? 'Sentence starters' : 'Follow-up questions'}, one per line
                        <textarea aria-label={`${pictures ? 'Picture' : 'Question'} ${i + 1} ${pictures ? 'starters' : 'follow-ups'}`} rows={pictures ? 3 : 2}
                            value={(x[lineKey] ?? []).join('\n')} onChange={e => setItem(i, { [lineKey]: lines(e.target.value) })} className={`${field} mt-1`} />
                    </label>
                </fieldset>
            ))}
            {Array.isArray(c.targets) && (
                <label className="text-sm text-ui-ink font-semibold">“Use it!” targets, one per line
                    <textarea rows={4} value={c.targets.join('\n')} onChange={e => setC({ ...c, targets: lines(e.target.value) })} className={`${field} mt-1`} />
                </label>
            )}
            {error && <p className="text-sm text-ui-danger" role="alert">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={save} className={primary}>{busy ? 'Saving…' : 'Save'}</button>
                <button type="button" disabled={busy} onClick={onCancel} className={quiet}>Cancel</button>
            </div>
        </div>
    );
}
