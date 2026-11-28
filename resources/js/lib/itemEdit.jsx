import { useState } from 'react';

// Edit inside the activity (2026-11-28): the teacher fixes or removes the item on screen. One spec per template says
// which list holds the items and which TEXT fields the form shows; the server (ActivityItemsController) takes only
// those fields, keeps everything else and checks the rules (one right answer, no repeated words…). Only shown when the
// screen was opened from a saved activity by a teacher (ActivityRenderer passes `onEditItems`; the student app never does).

const lines = v => (v ?? []).join('\n');

export const ITEM_SPECS = {
    quiz: {
        listKey: 'questions', min: 1, noun: 'question',
        toForm: q => ({ question: q.question ?? '', options: (q.answers ?? []).map(a => a.text), correct: Math.max(0, (q.answers ?? []).findIndex(a => a.correct)), explanation: q.explanation ?? '' }),
        fields: () => [
            { key: 'question', label: 'Question', kind: 'area' },
            { key: 'options', label: 'Answers — tick the right one', kind: 'choices', correctKey: 'correct' },
            { key: 'explanation', label: 'Explanation (optional)', kind: 'area' },
        ],
    },
    true_false: {
        listKey: 'statements', min: 1, noun: 'statement',
        toForm: s => ({ text: s.text ?? '', answer: s.answer ?? 'True', explanation: s.explanation ?? '' }),
        fields: () => [
            { key: 'text', label: 'Statement', kind: 'area' },
            { key: 'answer', label: 'Answer', kind: 'select', choices: ['True', 'False', 'Not Given'] },
            { key: 'explanation', label: 'Explanation (optional)', kind: 'area' },
        ],
    },
    mc_reading: {
        listKey: 'questions', min: 1, noun: 'question',
        toForm: q => ({ text: q.text ?? '', options: [...(q.options ?? [])], correct: Math.max(0, (q.options ?? []).indexOf(q.answer)), explanation: q.explanation ?? '' }),
        fields: () => [
            { key: 'text', label: 'Question', kind: 'area' },
            { key: 'options', label: 'Options — tick the right one', kind: 'choices', correctKey: 'correct' },
            { key: 'explanation', label: 'Explanation (optional)', kind: 'area' },
        ],
    },
    odd_one_out: {
        listKey: 'groups', min: 1, noun: 'group',
        toForm: g => ({ words: [...(g.words ?? [])], odd: Math.max(0, (g.words ?? []).indexOf(g.odd_one)), reason: g.reason ?? '' }),
        fields: () => [
            { key: 'words', label: 'Words — tick the one that doesn’t belong', kind: 'choices', correctKey: 'odd' },
            { key: 'reason', label: 'Why it doesn’t belong (optional)', kind: 'area' },
        ],
    },
    match_pairs: {
        listKey: 'pairs', min: 2, noun: 'pair',
        toForm: p => ({ left: p.left ?? '', right: p.right ?? '' }),
        fields: () => [{ key: 'left', label: 'Left side', kind: 'text' }, { key: 'right', label: 'Right side', kind: 'text' }],
    },
    word_categorisation: {
        listKey: 'categories', min: 2, noun: 'group',
        toForm: c => ({ name: c.name ?? '', words: lines(c.words) }),
        toInput: f => ({ name: f.name, words: String(f.words ?? '').split('\n') }),
        fields: () => [{ key: 'name', label: 'Group name', kind: 'text' }, { key: 'words', label: 'Words, one per line', kind: 'area' }],
    },
    signs_notices: {
        listKey: 'items', min: 1, noun: 'text',
        toForm: it => ({ text: it.text ?? '', question: it.question ?? '', options: [...(it.options ?? [])], correct: Number.isInteger(it.answer) ? it.answer : 0, ...(it.kind === 'email' ? { from: it.from ?? '', subject: it.subject ?? '' } : {}) }),
        fields: it => [
            ...(it.kind === 'email' ? [{ key: 'from', label: 'From', kind: 'text' }, { key: 'subject', label: 'Subject', kind: 'text' }] : []),
            { key: 'text', label: it.kind === 'email' ? 'Email' : 'The text', kind: 'area', rows: 5 },
            { key: 'question', label: 'Question', kind: 'text' },
            { key: 'options', label: 'Options — tick the right one', kind: 'choices', correctKey: 'correct' },
        ],
    },
    flashcards: {
        listKey: 'cards', min: 1, noun: 'card',
        toForm: c => ({ word: c.word ?? '', pronunciation: c.pronunciation ?? '', definition: c.definition ?? '', example: c.example ?? '', example2: c.example2 ?? '' }),
        fields: () => [
            { key: 'word', label: 'Word', kind: 'text' }, { key: 'pronunciation', label: 'Pronunciation (optional)', kind: 'text' },
            { key: 'definition', label: 'Definition', kind: 'area' }, { key: 'example', label: 'Example (optional)', kind: 'area' },
            { key: 'example2', label: 'Second example (optional)', kind: 'area' },
        ],
    },
    unjumble: {
        listKey: 'sentences', min: 1, noun: 'sentence',
        toForm: s => ({ sentence: s.sentence ?? (s.words ?? []).join(' ') }),
        fields: () => [{ key: 'sentence', label: 'The correct sentence (the words are mixed up from it)', kind: 'area' }],
    },
    error_correction: {
        listKey: 'items', min: 1, noun: 'mistake',
        toForm: (it, a) => ({ ...(a.passage ? {} : { sentence: it.sentence ?? '' }), error: it.error ?? '', correction: it.correction ?? '', explanation: it.explanation ?? '' }),
        fields: (it, a) => [
            ...(a.passage ? [] : [{ key: 'sentence', label: 'Sentence (with the mistake in it)', kind: 'area' }]),
            { key: 'error', label: a.passage ? 'The wrong words (exactly as in the text)' : 'The wrong words (exactly as in the sentence)', kind: 'text' },
            { key: 'correction', label: 'Correction', kind: 'text' },
            { key: 'explanation', label: 'Explanation (optional)', kind: 'area' },
        ],
    },
    role_play: {
        listKey: 'cards', min: 1, noun: 'card',
        toForm: c => {
            const f = { situation: c.situation ?? '' };
            for (const r of ['a', 'b', 'c']) if (c[`role_${r}`]) { f[`${r}_name`] = c[`role_${r}`].name ?? ''; f[`${r}_brief`] = c[`role_${r}`].brief ?? ''; }
            return f;
        },
        toInput: f => {
            const o = { situation: f.situation };
            for (const r of ['a', 'b', 'c']) if (`${r}_name` in f) o[`role_${r}`] = { name: f[`${r}_name`], brief: f[`${r}_brief`] };
            return o;
        },
        fields: c => [
            { key: 'situation', label: 'The situation', kind: 'area' },
            ...['a', 'b', 'c'].filter(r => c[`role_${r}`]).flatMap(r => [
                { key: `${r}_name`, label: `Role ${r.toUpperCase()} — name`, kind: 'text' },
                { key: `${r}_brief`, label: `Role ${r.toUpperCase()} — brief`, kind: 'area' },
            ]),
        ],
    },
    debate: {
        listKey: 'statements', min: 1, noun: 'statement',
        toForm: s => ({ statement: s.statement ?? '', for: lines(s.for), against: lines(s.against) }),
        toInput: f => ({ statement: f.statement, for: String(f.for ?? '').split('\n'), against: String(f.against ?? '').split('\n') }),
        fields: () => [
            { key: 'statement', label: 'Statement', kind: 'area' },
            { key: 'for', label: 'Arguments for, one per line', kind: 'area' },
            { key: 'against', label: 'Arguments against, one per line', kind: 'area' },
        ],
    },
    mini_presentation: {
        listKey: 'topics', min: 1, noun: 'topic',
        toForm: t => Object.fromEntries([['title', t.title ?? ''], ...(t.steps ?? []).flatMap((s, i) => [[`s${i}_name`, s.name ?? ''], [`s${i}_hint`, s.hint ?? '']])]),
        toInput: f => ({ title: f.title, steps: Object.keys(f).filter(k => /^s\d+_name$/.test(k)).sort((x, y) => parseInt(x.slice(1)) - parseInt(y.slice(1))).map(k => ({ name: f[k], hint: f[k.replace('_name', '_hint')] })) }),
        fields: t => [
            { key: 'title', label: 'Topic', kind: 'text' },
            ...(t.steps ?? []).flatMap((s, i) => [
                { key: `s${i}_name`, label: `Step ${i + 1} — name`, kind: 'text' },
                { key: `s${i}_hint`, label: `Step ${i + 1} — what to say`, kind: 'text' },
            ]),
        ],
    },
};

const toInput = (spec, form) => (spec.toInput ? spec.toInput(form) : form);

/** The whole list as the server wants it: every item's text fields, each with the index it came from. */
export function listInput(type, activity, override = {}) {
    const spec = ITEM_SPECS[type];
    return (activity[spec.listKey] ?? []).map((x, j) => ({ _from: j, ...toInput(spec, override[j] ?? spec.toForm(x, activity)) }));
}

const field = 'w-full rounded-xl border border-ui-line bg-ui-field text-ui-ink text-[16px] px-3 py-2 mt-1 font-normal focus:outline-none focus:border-[#E0521F]';
const quiet = 'bg-ui-field hover:bg-ui-well border border-ui-line text-ui-ink font-semibold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50';

/** The small "✎ Edit" button for a card header. */
export function EditButton({ onClick, label = 'Edit' }) {
    return (
        <button type="button" onClick={onClick} title="Edit this item" data-testid="item-edit"
            className="shrink-0 text-[14px] font-semibold text-ui-ink bg-ui-field border border-ui-line hover:border-[#E0521F] rounded-lg px-3 min-h-9 cursor-pointer">
            ✎ {label}
        </button>
    );
}

/** The form: one control per field. onSave(form) / onRemove() return promises; their errors are shown here. */
export function ItemEditor({ fields, value, onSave, onCancel, onRemove, noun = 'item' }) {
    const [f, setF] = useState(value);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(false);
    const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
    async function run(fn) {
        setBusy(true); setError('');
        try { await fn(); } catch (e) { setError(e.message); setBusy(false); }
    }
    return (
        <div className="flex flex-col gap-3" data-testid="item-editor">
            {fields.map(fd => (
                <div key={fd.key} className="text-sm font-semibold text-ui-muted">
                    {fd.kind === 'choices' ? (
                        <fieldset>
                            <legend>{fd.label}</legend>
                            <div className="flex flex-col gap-2 mt-1">
                                {(f[fd.key] ?? []).map((opt, i) => (
                                    <label key={i} className="flex items-center gap-2">
                                        <input type="radio" name={`${fd.key}-right`} checked={f[fd.correctKey] === i} onChange={() => set(fd.correctKey, i)}
                                            className="w-5 h-5 accent-[#1E7A4C] shrink-0" aria-label={`Option ${i + 1} is the one`} />
                                        <input value={opt} maxLength={300} aria-label={`Option ${i + 1}`}
                                            onChange={e => set(fd.key, f[fd.key].map((o, j) => (j === i ? e.target.value : o)))} className={`${field} mt-0`} />
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    ) : fd.kind === 'select' ? (
                        <fieldset>
                            <legend>{fd.label}</legend>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {fd.choices.map(c => (
                                    <button key={c} type="button" aria-pressed={f[fd.key] === c} onClick={() => set(fd.key, c)}
                                        className={`px-4 py-2 rounded-xl border font-semibold cursor-pointer ${f[fd.key] === c ? 'border-[#1E7A4C] bg-[#E5F4EC] text-[#14532D]' : 'border-ui-line bg-ui-field text-ui-ink'}`}>{c}</button>
                                ))}
                            </div>
                        </fieldset>
                    ) : (
                        <label className="block">{fd.label}
                            {fd.kind === 'area'
                                ? <textarea rows={fd.rows ?? 3} value={f[fd.key] ?? ''} onChange={e => set(fd.key, e.target.value)} className={field} />
                                : <input value={f[fd.key] ?? ''} onChange={e => set(fd.key, e.target.value)} className={field} />}
                        </label>
                    )}
                </div>
            ))}
            {error && <p className="text-ui-danger text-[15px]" role="alert">{error}</p>}
            {confirmRemove ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ui-danger-line bg-ui-danger-bg px-4 py-3" data-testid="confirm-remove">
                    <span className="flex-1 text-ui-ink">Remove this {noun} from the activity?</span>
                    <button type="button" disabled={busy} onClick={() => run(onRemove)} className="bg-[#B42318] text-white font-semibold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50">{busy ? 'Removing…' : 'Yes, remove'}</button>
                    <button type="button" disabled={busy} onClick={() => setConfirmRemove(false)} className={quiet}>Keep it</button>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-3">
                    {onRemove && <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className="text-ui-danger font-semibold underline underline-offset-2 cursor-pointer disabled:opacity-50 mr-auto">Remove this {noun}</button>}
                    <span className="flex-1" />
                    <button type="button" disabled={busy} onClick={onCancel} className={quiet}>Cancel</button>
                    <button type="button" disabled={busy} onClick={() => run(() => onSave(f))} className="bg-[#e0521f] hover:bg-[#c9461a] text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
                </div>
            )}
        </div>
    );
}

/**
 * Everything a template needs for the item on screen:
 *   const ed = useItemEdit('quiz', quiz, onEditItems, index, { onRemoved });
 *   {ed.button} in the card header, and {ed.editor ?? <the normal card body>}.
 * onRemoved(newLength) lets the template move off a removed item; onSaved() lets it clear the item's answer state.
 */
export function useItemEdit(type, activity, onEditItems, index, { onRemoved, onSaved } = {}) {
    const [editing, setEditing] = useState(false);
    const spec = ITEM_SPECS[type];
    const list = activity?.[spec.listKey] ?? [];
    const item = list[index];
    const canEdit = Boolean(onEditItems) && Boolean(item);
    const close = () => setEditing(false);
    return {
        canEdit,
        editing: editing && canEdit,
        button: canEdit && !editing ? <EditButton onClick={() => setEditing(true)} /> : null,
        editor: editing && canEdit ? (
            <ItemEditor key={index} noun={spec.noun} fields={spec.fields(item, activity)} value={spec.toForm(item, activity)} onCancel={close}
                onSave={async form => { await onEditItems(spec.listKey, listInput(type, activity, { [index]: form })); close(); onSaved?.(); }}
                onRemove={list.length > spec.min ? async () => {
                    await onEditItems(spec.listKey, listInput(type, activity).filter((_, j) => j !== index));
                    close();
                    onRemoved?.(list.length - 1);
                } : null} />
        ) : null,
    };
}

/**
 * For screens that show the whole list at once (Match Pairs, Categorise): every item's fields in one form, each with
 * "Remove" (while more than `min` stay), one Save.
 *   const le = useListEdit('match_pairs', activity, onEditItems, { onSaved });
 *   {le.button} somewhere in the header area, {le.editor ?? <the normal screen>}.
 */
export function useListEdit(type, activity, onEditItems, { onSaved, label = 'Edit' } = {}) {
    const [open, setOpen] = useState(false);
    const spec = ITEM_SPECS[type];
    const list = activity?.[spec.listKey] ?? [];
    const canEdit = Boolean(onEditItems) && list.length > 0;
    return {
        canEdit,
        editing: open && canEdit,
        button: canEdit && !open ? <EditButton onClick={() => setOpen(true)} label={label} /> : null,
        editor: open && canEdit ? (
            <ListEditor type={type} activity={activity} canRemove={spec.listKey !== 'categories'}
                onCancel={() => setOpen(false)}
                onSave={async rows => { await onEditItems(spec.listKey, rows); setOpen(false); onSaved?.(); }} />
        ) : null,
    };
}

function ListEditor({ type, activity, canRemove, onSave, onCancel }) {
    const spec = ITEM_SPECS[type];
    const list = activity[spec.listKey] ?? [];
    const [forms, setForms] = useState(() => list.map(x => spec.toForm(x, activity)));
    const [removed, setRemoved] = useState(() => new Set());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const left = list.length - removed.size;
    async function save() {
        setBusy(true); setError('');
        try {
            await onSave(forms.map((f, j) => ({ _from: j, ...(spec.toInput ? spec.toInput(f) : f) })).filter((_, j) => !removed.has(j)));
        } catch (e) { setError(e.message); setBusy(false); }
    }
    return (
        <section className="rounded-2xl bg-ui-box border border-ui-line p-4 sm:p-6 flex flex-col gap-4" data-testid="list-editor" aria-label="Edit the activity">
            <p className="text-ui-ink font-semibold">Fix any {spec.noun}{canRemove ? ', or remove the ones that don’t work' : ''}. Then save.</p>
            {list.map((item, j) => (
                <fieldset key={j} className={`rounded-xl border border-ui-line px-3 py-3 flex flex-col gap-2 ${removed.has(j) ? 'opacity-50' : ''}`} data-testid="list-row">
                    <legend className="px-1 text-sm font-semibold text-ui-muted capitalize">{spec.noun} {j + 1}</legend>
                    {spec.fields(item, activity).map(fd => (
                        <label key={fd.key} className="block text-sm font-semibold text-ui-muted">{fd.label}
                            {fd.kind === 'area'
                                ? <textarea rows={fd.rows ?? 3} disabled={removed.has(j)} value={forms[j][fd.key] ?? ''} onChange={e => setForms(fs => fs.map((f, k) => (k === j ? { ...f, [fd.key]: e.target.value } : f)))} className={field} />
                                : <input disabled={removed.has(j)} value={forms[j][fd.key] ?? ''} onChange={e => setForms(fs => fs.map((f, k) => (k === j ? { ...f, [fd.key]: e.target.value } : f)))} className={field} />}
                        </label>
                    ))}
                    {canRemove && (removed.has(j)
                        ? <button type="button" onClick={() => setRemoved(r => { const n = new Set(r); n.delete(j); return n; })} className="self-start text-sm font-semibold underline cursor-pointer text-ui-ink">Put it back</button>
                        : <button type="button" disabled={left <= spec.min} onClick={() => setRemoved(r => new Set(r).add(j))} className="self-start text-sm font-semibold underline cursor-pointer text-ui-danger disabled:opacity-40 disabled:cursor-not-allowed">Remove this {spec.noun}</button>)}
                </fieldset>
            ))}
            {error && <p className="text-ui-danger text-[15px]" role="alert">{error}</p>}
            <div className="flex flex-wrap justify-end gap-3">
                <button type="button" disabled={busy} onClick={onCancel} className={quiet}>Cancel</button>
                <button type="button" disabled={busy} onClick={save} className="bg-[#e0521f] hover:bg-[#c9461a] text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
            </div>
        </section>
    );
}

/** For ActivityRenderer: saves a list and returns the saved content (throws an Error with the server's message). */
export async function saveItems(axios, id, listKey, list) {
    try {
        const { data } = await axios.patch(`/api/activities/${id}/items`, { content: { [listKey]: list } });
        return data.activity.content;
    } catch (e) {
        const errs = e.response?.data?.errors;
        throw new Error(errs ? Object.values(errs).flat()[0] : (e.response?.data?.message ?? 'Could not save it. Please try again.'));
    }
}

/**
 * For the speaking cards (Role-play, Debate, Mini presentation), which are drawn inside SpeakingActivityShell:
 * an "✎ Edit" above the card, and the form in its place while editing. The shell keeps its card index in range
 * when one is removed.
 */
export function EditableCard({ type, activity, onEditItems, index, children }) {
    const ed = useItemEdit(type, activity, onEditItems, index);
    if (!ed.canEdit) return children;
    if (ed.editor) return <section aria-label="Edit" className="rounded-2xl bg-ui-box border border-ui-line px-6 py-5">{ed.editor}</section>;
    return <><div className="flex justify-end -mb-2">{ed.button}</div>{children}</>;
}
