import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from '@/components/det/PracticeSessionShell';
import SpeakingPromptDrill from '@/components/det/SpeakingPromptDrill';
import CambridgeWatermark from '@/components/cambridge/CambridgeWatermark';
import interviewSets from '@/data/cambridge/b2/speakingInterview.json';

// Same scenario-select-then-chain pattern as DET's InteractiveSpeakingDrill — items are
// prep-less (a plain sequence of short personal questions, like a real examiner would ask),
// so SpeakingPromptDrill lands straight on each prompt with no reveal step between them.
export default function InterviewDrill() {
    const navigate = useNavigate();
    const [set, setSet] = useState(null);

    function backToTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    if (set) {
        return (
            <SpeakingPromptDrill
                title="Interview — B2 First"
                subtitle="A short sequence of personal questions — talk it through."
                items={set.items}
                onBack={() => setSet(null)}
                doneSecondaryLabel="Choose Another Topic"
                watermark={<CambridgeWatermark />}
            />
        );
    }

    return (
        <PracticeSessionShell
            watermark={<CambridgeWatermark />}
            title="Interview — B2 First"
            subtitle="Choose a topic to practice — Speaking, Part 1"
            onBack={backToTab}
        >
            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="flex flex-col gap-3 max-w-md w-full mx-auto">
                    <p className="text-white/60 text-sm text-center mb-2">Ask the questions one at a time, as an examiner would in a real interview.</p>
                    {interviewSets.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSet(s)}
                            className="px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-left"
                        >
                            <p className="text-lg">{s.title}</p>
                            <p className="text-white/40 text-xs font-normal mt-1">{s.items.length} questions</p>
                        </button>
                    ))}
                </div>
            </div>
        </PracticeSessionShell>
    );
}
