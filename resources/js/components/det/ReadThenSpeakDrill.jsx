import SpeakingPromptDrill from './SpeakingPromptDrill';
import readThenSpeak from '@/data/det/readThenSpeak.json';

export default function ReadThenSpeakDrill() {
    return (
        <SpeakingPromptDrill
            title="Read, Then Speak"
            subtitle="Read the passage, then respond out loud."
            items={readThenSpeak}
            prepLabel="Read"
            revealLabel="Ready to Speak →"
            promptLabel="Now speak"
        />
    );
}
