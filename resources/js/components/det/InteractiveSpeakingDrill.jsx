import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeSessionShell from './PracticeSessionShell';
import SpeakingPromptDrill from './SpeakingPromptDrill';
import scenarios from '@/data/det/interactiveSpeaking.json';

// Items are deliberately prep-less and self-contained (each prompt carries enough
// context on its own) — every scenario is one continuous chained conversation, not
// separate independent turns, so there's no reveal step between questions at all:
// just Next Prompt, straight through. Smoothest possible flow for a real conversation.
export default function InteractiveSpeakingDrill() {
    const navigate = useNavigate();
    const [scenario, setScenario] = useState(null);

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    if (scenario) {
        return (
            <SpeakingPromptDrill
                title="Interactive Speaking"
                subtitle="A connected chain of follow-up questions — talk it through."
                items={scenario.items}
                onBack={() => setScenario(null)}
                doneSecondaryLabel="Choose Another Scenario"
            />
        );
    }

    return (
        <PracticeSessionShell title="Interactive Speaking" subtitle="Choose a scenario to practice" onBack={backToDetTab}>
            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="flex flex-col gap-3 max-w-md w-full mx-auto">
                    <p className="text-white/60 text-sm text-center mb-2">Each scenario is a connected chain of questions — work through them in order.</p>
                    {scenarios.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setScenario(s)}
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
