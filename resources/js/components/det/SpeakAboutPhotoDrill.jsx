import SpeakingPromptDrill from './SpeakingPromptDrill';
import speakAboutPhoto from '@/data/det/speakAboutPhoto.json';

export default function SpeakAboutPhotoDrill() {
    return (
        <SpeakingPromptDrill
            title="Speak About the Photo"
            subtitle="Look at the photo, then describe it out loud."
            items={speakAboutPhoto}
            prepLabel="Look"
            revealLabel="Ready to Speak →"
            promptLabel="Now speak"
            backToPrepLabel="← Look again"
        />
    );
}
