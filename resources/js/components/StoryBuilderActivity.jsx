import { useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';

const TITLE_SIZES  = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const PROMPT_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

// Story builder (production): a story title and 5–6 numbered prompts the student turns into a story.
// "Hide prompts" then asks for a retelling from memory with one new detail.
export default function StoryBuilderActivity(props) {
    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.stories}
            label="Story builder"
            itemNoun="Story"
            nextLabel="Next story"
            renderItem={story => <StoryCard story={story} />}
        />
    );
}

function StoryCard({ story }) {
    const [hidden, setHidden] = useState(false);
    const { sizeIdx, textColor } = useDisplay();

    return (
        <>
            <div className="flex flex-col gap-1">
                <p className="text-white/55 text-xs font-bold tracking-[0.12em]">TELL THE STORY</p>
                <h2 className={`${TITLE_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{story.title}</h2>
            </div>
            {hidden ? (
                <div className="rounded-2xl border border-dashed border-white/30 bg-black/25 px-6 py-12 text-center flex flex-col gap-2">
                    <p className="text-white text-2xl font-semibold">Now tell it again from memory</p>
                    <p className="text-white/65 text-lg">Add one detail that wasn’t in the prompts.</p>
                </div>
            ) : (
                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Story prompts">
                    {story.prompts.map((p, i) => (
                        <li key={i} className="rounded-2xl bg-black/30 border border-white/15 px-5 py-4 flex gap-3 items-start">
                            <span className="shrink-0 w-8 h-8 rounded-full bg-white/15 text-white font-bold grid place-items-center">{i + 1}</span>
                            <span className={`${PROMPT_SIZES[sizeIdx]} leading-snug ${textColor}`}>{p}</span>
                        </li>
                    ))}
                </ol>
            )}
            <button
                type="button"
                onClick={() => setHidden(v => !v)}
                aria-pressed={hidden}
                className="self-start bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
            >
                {hidden ? 'Show prompts' : 'Hide prompts'}
            </button>
        </>
    );
}
