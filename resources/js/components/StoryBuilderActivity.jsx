import { useState } from 'react';
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
    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.stories}
            label="Story builder"
            itemNoun="Story"
            nextLabel="Next story"
            renderItem={story => (story.steps ? <QuestionStory story={story} /> : <StoryCard story={story} />)}
        />
    );
}

function QuestionStory({ story }) {
    const [at, setAt] = useState(0); // 0..steps.length (the last = retell)
    const [showFull, setShowFull] = useState(false);
    const { sizeIdx, textColor: chosen } = useDisplay();
    const textColor = useInkColor(chosen);
    const steps = story.steps;
    const retell = at >= steps.length;
    const step = steps[at];
    const go = n => { setAt(n); setShowFull(false); };

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
                    <p className="text-ui-faint text-xs font-bold tracking-[0.12em] ab-chip">QUESTION {at + 1} OF {steps.length}</p>
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
