import SpeakingPromptDrill from './SpeakingPromptDrill';
import interactiveSpeaking from '@/data/det/interactiveSpeaking.json';

// Items are deliberately prep-less and self-contained (each prompt carries enough
// context on its own) — this is one continuous chained scenario, not separate
// independent turns, so there's no reveal step between questions at all: just
// Next Prompt, straight through. Smoothest possible flow for a real conversation.
export default function InteractiveSpeakingDrill() {
    return (
        <SpeakingPromptDrill
            title="Interactive Speaking"
            subtitle="A connected chain of follow-up questions — talk it through."
            items={interactiveSpeaking}
        />
    );
}
