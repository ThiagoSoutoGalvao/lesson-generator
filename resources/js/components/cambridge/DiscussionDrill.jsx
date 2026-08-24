import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import BatchSelect, { groupByBatch } from '@/components/cambridge/BatchSelect';
import discussionItems from '@/data/cambridge/b2/speakingDiscussion.json';

// Items are prep-less and self-contained, same as DET's Interactive Speaking — Part 4 in
// the real exam is one continuous follow-up discussion, not separate reveal-then-answer turns.
export default function DiscussionDrill() {
    const navigate = useNavigate();
    const [items, setItems] = useState(null);
    const batches = groupByBatch(discussionItems);

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    if (items) {
        return (
            <SpeakingPromptDrill
                title="Discussion — B2 First"
                subtitle="A broader follow-up discussion — work through the questions together."
                items={items}
                onBack={() => setItems(null)}
                doneSecondaryLabel="Choose Another Batch"
                watermark={<CambridgeWatermark />}
            />
        );
    }

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title="Discussion — B2 First"
            subtitle="Choose a set to practice — Speaking, Part 4"
            onBack={backToTab}
        >
            <BatchSelect
                allItems={discussionItems}
                batches={batches}
                unitLabel="questions"
                onSelect={setItems}
            />
        </PracticeSessionShell>
    );
}
