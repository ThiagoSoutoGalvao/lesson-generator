import { useState } from 'react';
import axios from 'axios';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';
import { useInkColor } from '@/lib/uiTheme';

const TITLE_SIZES  = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const ASK_SIZES    = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const PROMPT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

// Story builder (production). Since 2026-11-25 the group builds the story by asking questions: one step on screen
// at a time — a question to ask and a word the answer must use — with the questions already answered kept as
// "the story so far", then a retell. Stories saved before that have `prompts` (5–6 fragments) and keep the old card.
export default function StoryBuilderActivity(props) {
    // Local copy so a step edited on screen shows straight away (2026-11-28).
    const [stories, setStories] = useState(props.activity.stories);
    const canEdit = !props.hideSave && Boolean(props.savedId);

    // Saves one step's ask / full question / answer word; the server keeps everything else (ActivityTextController).
    async function saveStep(storyIndex, stepIndex, patch) {
        const list = stories.map((st, i) => (i !== storyIndex || !st.steps ? st
            : { ...st, steps: st.steps.map((x, j) => (j === stepIndex ? { ...x, ...patch } : x)) }));
        const body = { stories: list.map(st => (st.steps ? { steps: st.steps.map(x => ({ ask: x.ask ?? '', full: x.full ?? '', word: x.word ?? '' })) } : {})) };
        try {
            const { data } = await axios.patch(`/api/activities/${props.savedId}/text`, { content: body });
            setStories(data.activity.content.stories);
            props.onContentChange?.(data.activity.content);
        } catch (e) {
            const errs = e.response?.data?.errors;
            throw new Error(errs ? Object.values(errs).flat()[0] : (e.response?.data?.message ?? 'Could not save it. Please try again.'));
        }
    }

    return (
        <SpeakingActivityShell
            {...props}
            activity={{ ...props.activity, stories }}
            items={stories}
            label="Story builder"
            itemNoun="Story"
            nextLabel="Next story"
            renderItem={(story, i) => (story.steps
                ? <QuestionStory story={story} onSaveStep={canEdit ? (j, patch) => saveStep(i, j, patch) : null} />
                : <StoryCard story={story} />)}
        />
    );
}

/** The teacher's in-screen editor for one step: what to ask, the full question (optional) and the answer word. */
function StepEditor({ step, onSave, onCancel }) {
    const [ask, setAsk] = useState(step.ask ?? '');
    const [full, setFull] = useState(step.full ?? '');
    const [word, setWord] = useState(step.word ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const field = 'w-full rounded-xl border border-ui-line bg-ui-field text-ui-ink text-[17px] px-3 py-2.5 mt-1 font-normal focus:outline-none focus:border-[#E0521F]';
    async function save() {
        if (!ask.trim()) { setError('The question needs some text.'); return; }
        setBusy(true); setError('');
        try { await onSave({ ask: ask.trim(), full: full.trim(), word: word.trim() }); }
        catch (e) { setError(e.message); setBusy(false); }
    }
    return (
        <div className="flex flex-col gap-3" data-testid="step-editor">
            <label className="text-sm font-semibold text-ui-muted">Ask (what the group sees)
                <textarea rows={2} maxLength={300} value={ask} onChange={e => setAsk(e.target.value)} className={field} autoFocus />
            </label>
            <label className="text-sm font-semibold text-ui-muted">Full question (optional — shown with “Show the question”)
                <input maxLength={300} value={full} onChange={e => setFull(e.target.value)} className={field} />
            </label>
            <label className="text-sm font-semibold text-ui-muted">Answer with (the word the answer must use; empty = none)
                <input maxLength={60} value={word} onChange={e => setWord(e.target.value)} className={field} />
            </label>
            {error && <p className="text-ui-danger text-[15px]" role="alert">{error}</p>}
            <div className="flex flex-wrap justify-end gap-3">
                <button type="button" disabled={busy} onClick={onCancel} className="bg-ui-field hover:bg-ui-well border border-ui-line text-ui-ink font-semibold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="button" disabled={busy} onClick={save} className="bg-[#e0521f] hover:bg-[#c9461a] text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
            </div>
        </div>
    );
}

function QuestionStory({ story, onSaveStep }) {
    const [editing, setEditing] = useState(false);
    const [at, setAt] = useState(0); // 0..steps.length (the last = retell)
    const [showFull, setShowFull] = useState(false);
    const { sizeIdx, textColor: chosen } = useDisplay();
    const textColor = useInkColor(chosen);
    const steps = story.steps;
    const retell = at >= steps.length;
    const step = steps[at];
    const go = n => { setAt(n); setShowFull(false); setEditing(false); };

    return (
        <>
            <div className="flex flex-col gap-1">
                <p className="text-ui-faint text-xs font-bold tracking-[0.12em] ab-chip">BUILD THE STORY TOGETHER</p>
                <h2 className={`${TITLE_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{story.title}</h2>
                {story.opening && <p className={`${PROMPT_SIZES[sizeIdx]} italic text-ui-muted leading-snug mt-1`}>{story.opening}</p>}
            </div>

            {retell ? (
                <div className="rounded-2xl border border-dashed border-ui-line bg-ui-box px-6 py-8 flex flex-col gap-3" data-testid="story-retell">
                    <p className="text-ui-ink text-2xl font-semibold">Now one student retells the whole story</p>
                    <p className="text-ui-muted text-lg">The others listen and add anything that’s missing. Try to use every word:</p>
                    <ul className="flex flex-wrap gap-2" aria-label="Words to use">
                        {steps.filter(s => s.word).map((s, i) => <li key={i} className="rounded-full bg-ui-sel text-ui-accent font-semibold px-3 py-1">{s.word}</li>)}
                    </ul>
                </div>
            ) : (
                <div className="rounded-2xl bg-ui-box border border-ui-line px-6 py-5 flex flex-col gap-4" data-testid="story-step">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-ui-faint text-xs font-bold tracking-[0.12em] ab-chip">QUESTION {at + 1} OF {steps.length}</p>
                        {onSaveStep && !editing && (
                            <button type="button" onClick={() => setEditing(true)} title="Edit this question"
                                className="shrink-0 text-[14px] font-semibold text-ui-ink border border-ui-line hover:border-[#E0521F] rounded-lg px-3 min-h-9 cursor-pointer">✎ Edit</button>
                        )}
                    </div>
                    {editing ? (
                        <StepEditor key={at} step={step} onCancel={() => setEditing(false)} onSave={async patch => { await onSaveStep(at, patch); setEditing(false); }} />
                    ) : <>
                    <div className="flex flex-col gap-1">
                        <p className="text-ui-muted text-sm font-semibold">{step.full ? 'MAKE THE QUESTION AND ASK IT' : 'ASK'}</p>
                        <p className={`${ASK_SIZES[sizeIdx]} font-semibold leading-snug ${textColor}`}>{step.ask}</p>
                        {step.full && (
                            showFull
                                ? <p className="text-ui-muted text-lg">{step.full}</p>
                                : <button type="button" onClick={() => setShowFull(true)} className="self-start text-sm text-ui-muted underline cursor-pointer">Show the question</button>
                        )}
                    </div>
                    {step.word && (
                        <p className="flex flex-wrap items-center gap-2">
                            <span className="text-ui-muted text-sm font-semibold">ANSWER WITH</span>
                            <span className={`rounded-full bg-ui-sel text-ui-accent font-bold px-3 py-1 ${PROMPT_SIZES[sizeIdx]}`}>{step.word}</span>
                        </p>
                    )}
                    <p className="text-ui-faint text-sm">One student asks, the next answers and invents the detail. Then the next student asks.</p>
                    </>}
                </div>
            )}

            {at > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-ui-faint text-xs font-bold tracking-[0.12em]">THE STORY SO FAR</p>
                    <ol className="flex flex-col gap-1" aria-label="The story so far">
                        {steps.slice(0, at).map((s, i) => (
                            <li key={i} className="text-ui-muted text-sm flex gap-2"><span className="text-[#1E7A4C] font-bold">✓</span>{s.full || s.ask}</li>
                        ))}
                    </ol>
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                {at > 0 && (
                    <button type="button" onClick={() => go(at - 1)} className="bg-ui-field hover:bg-ui-well border border-ui-line text-ui-ink font-semibold px-5 py-2.5 rounded-xl cursor-pointer">Back</button>
                )}
                {!retell && (
                    <button type="button" onClick={() => go(at + 1)} className="bg-ui-field hover:bg-ui-well border border-ui-line text-ui-ink font-semibold px-5 py-2.5 rounded-xl cursor-pointer">
                        {at === steps.length - 1 ? 'Retell the story' : 'Next question'}
                    </button>
                )}
            </div>
        </>
    );
}

function StoryCard({ story }) {
    const [hidden, setHidden] = useState(false);
    const { sizeIdx, textColor: chosen } = useDisplay();
    const textColor = useInkColor(chosen);

    return (
        <>
            <div className="flex flex-col gap-1">
                <p className="text-ui-faint text-xs font-bold tracking-[0.12em] ab-chip">TELL THE STORY</p>
                <h2 className={`${TITLE_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{story.title}</h2>
            </div>
            {hidden ? (
                <div className="rounded-2xl border border-dashed border-ui-line bg-ui-box px-6 py-12 text-center flex flex-col gap-2">
                    <p className="text-ui-ink text-2xl font-semibold">Now tell it again from memory</p>
                    <p className="text-ui-muted text-lg">Add one detail that wasn’t in the prompts.</p>
                </div>
            ) : (
                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Story prompts">
                    {(story.prompts ?? []).map((p, i) => (
                        <li key={i} className="rounded-2xl bg-ui-box border border-ui-line px-5 py-4 flex gap-3 items-start">
                            <span className="shrink-0 w-8 h-8 rounded-full bg-ui-sel text-ui-accent font-bold grid place-items-center">{i + 1}</span>
                            <span className={`${PROMPT_SIZES[sizeIdx]} leading-snug ${textColor}`}>{p}</span>
                        </li>
                    ))}
                </ol>
            )}
            <button
                type="button"
                onClick={() => setHidden(v => !v)}
                aria-pressed={hidden}
                className="self-start bg-ui-field hover:bg-ui-well border border-ui-line text-ui-ink font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
            >
                {hidden ? 'Show prompts' : 'Hide prompts'}
            </button>
        </>
    );
}
