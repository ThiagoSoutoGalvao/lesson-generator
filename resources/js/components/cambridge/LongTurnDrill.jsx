import { useNavigate } from 'react-router-dom';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import longTurnItems from '@/data/cambridge/b2/speakingLongTurn.json';

export default function LongTurnDrill() {
    const navigate = useNavigate();

    return (
        <SpeakingPromptDrill
            title="Individual Long Turn — B2 First"
            subtitle="Compare the two photos out loud for about a minute."
            items={longTurnItems}
            prepLabel="Photos"
            revealLabel="Ready to Speak →"
            promptLabel="Now speak"
            backToPrepLabel="← Look again"
            onBack={() => navigate('/upload', { state: { tab: 'cambridge' } })}
            doneSecondaryLabel="Back to Cambridge Practice"
            watermark={<CambridgeWatermark />}
        />
    );
}
