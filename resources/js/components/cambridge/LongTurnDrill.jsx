import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import BatchSelect, { groupByBatch } from '@/components/cambridge/BatchSelect';
import longTurnItems from '@/data/cambridge/b2/speakingLongTurn.json';

export default function LongTurnDrill() {
    const navigate = useNavigate();
    const [items, setItems] = useState(null);
    const batches = groupByBatch(longTurnItems);

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    if (items) {
        return (
            <SpeakingPromptDrill
                title="Individual Long Turn — B2 First"
                subtitle="Compare the two photos out loud for about a minute."
                items={items}
                prepLabel="Photos"
                revealLabel="Ready to Speak →"
                promptLabel="Now speak"
                backToPrepLabel="← Look again"
                onBack={() => setItems(null)}
                doneSecondaryLabel="Choose Another Batch"
                watermark={<CambridgeWatermark />}
            />
        );
    }

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title="Individual Long Turn — B2 First"
            subtitle="Choose a set to practice — Speaking, Part 2"
            onBack={backToTab}
        >
            <BatchSelect
                allItems={longTurnItems}
                batches={batches}
                unitLabel="photo pairs"
                onSelect={setItems}
            />
        </PracticeSessionShell>
    );
}
