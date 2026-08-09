import { useNavigate } from 'react-router-dom';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import collaborativeItems from '@/data/cambridge/b2/speakingCollaborative.json';

// Real Cambridge Part 3 is done with a second candidate. In this 1-on-1 teacher context,
// the teacher plays that role live — same solve DET's Interactive Speaking already uses.
export default function CollaborativeDrill() {
    const navigate = useNavigate();

    return (
        <SpeakingPromptDrill
            title="Collaborative Task — B2 First"
            subtitle="Talk it through together, then decide — the teacher plays the discussion partner."
            items={collaborativeItems}
            prepLabel="Task"
            revealLabel="Ready to Discuss →"
            promptLabel="Now discuss together"
            backToPrepLabel="← Back to the task"
            onBack={() => navigate('/upload', { state: { tab: 'cambridge' } })}
            doneSecondaryLabel="Back to Cambridge Practice"
            watermark={<CambridgeWatermark />}
        />
    );
}
