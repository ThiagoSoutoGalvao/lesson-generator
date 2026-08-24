import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import BatchSelect, { groupByBatch } from '@/components/cambridge/BatchSelect';
import collaborativeItems from '@/data/cambridge/b2/speakingCollaborative.json';

// Real Cambridge Part 3 is done with a second candidate. In this 1-on-1 teacher context,
// the teacher plays that role live — same solve DET's Interactive Speaking already uses.
export default function CollaborativeDrill() {
    const navigate = useNavigate();
    const [items, setItems] = useState(null);
    const batches = groupByBatch(collaborativeItems);

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    if (items) {
        return (
            <SpeakingPromptDrill
                title="Collaborative Task — B2 First"
                subtitle="Talk it through together, then decide — the teacher plays the discussion partner."
                items={items}
                prepLabel="Task"
                revealLabel="Ready to Discuss →"
                promptLabel="Now discuss together"
                backToPrepLabel="← Back to the task"
                onBack={() => setItems(null)}
                doneSecondaryLabel="Choose Another Batch"
                watermark={<CambridgeWatermark />}
            />
        );
    }

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title="Collaborative Task — B2 First"
            subtitle="Choose a set to practice — Speaking, Part 3"
            onBack={backToTab}
        >
            <BatchSelect
                allItems={collaborativeItems}
                batches={batches}
                unitLabel="tasks"
                onSelect={setItems}
            />
        </PracticeSessionShell>
    );
}
