import { useNavigate } from 'react-router-dom';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import discussionItems from '@/data/cambridge/b2/speakingDiscussion.json';

// Items are prep-less and self-contained, same as DET's Interactive Speaking — Part 4 in
// the real exam is one continuous follow-up discussion, not separate reveal-then-answer turns.
export default function DiscussionDrill() {
    const navigate = useNavigate();

    return (
        <SpeakingPromptDrill
            title="Discussion — B2 First"
            subtitle="A broader follow-up discussion — work through the questions together."
            items={discussionItems}
            onBack={() => navigate('/upload', { state: { tab: 'cambridge' } })}
            doneSecondaryLabel="Back to Cambridge Practice"
            watermark={<CambridgeWatermark />}
        />
    );
}
