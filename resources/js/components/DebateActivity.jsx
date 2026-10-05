import { useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';

const STATEMENT_SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
const IDEA_SIZES      = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

// Debate cards (production): an opinion statement with model arguments for and against. Both sides start
// hidden so the student answers with their own view first; the teacher reveals ideas if they get stuck.
export default function DebateActivity(props) {
    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.statements}
            label="Debate"
            itemNoun="Statement"
            nextLabel="Next statement"
            renderItem={card => <DebateCard card={card} />}
        />
    );
}

function DebateCard({ card }) {
    const [shown, setShown] = useState({ for: false, against: false });
    const { sizeIdx, textColor } = useDisplay();
    const sides = [
        { key: 'for', label: 'FOR', ideas: card.for, accent: 'text-[#86dcae]' },
        { key: 'against', label: 'AGAINST', ideas: card.against, accent: 'text-[#ff9b7a]' },
    ];

    return (
        <>
            <section className="rounded-2xl bg-[#2b2448]/80 border-2 border-[#fc6840] px-6 py-5">
                <p className="text-[#ff9b7a] text-xs font-bold tracking-[0.12em] mb-2">DO YOU AGREE?</p>
                <p className={`${STATEMENT_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{card.statement}</p>
            </section>
            <p className="text-white/70 text-lg">Agree, disagree or partly? Give your reason first — then look at the ideas.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sides.map(side => (
                    <section key={side.key} aria-label={side.label === 'FOR' ? 'Ideas for' : 'Ideas against'} className="rounded-2xl bg-black/30 border border-white/15 px-6 py-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className={`text-xs font-bold tracking-[0.12em] ${side.accent}`}>{side.label}</p>
                            <button
                                type="button"
                                aria-expanded={shown[side.key]}
                                onClick={() => setShown(s => ({ ...s, [side.key]: !s[side.key] }))}
                                className="text-sm text-white border border-white/25 hover:bg-white/10 rounded-lg px-3 py-1.5 cursor-pointer"
                            >
                                {shown[side.key] ? 'Hide ideas' : 'Show ideas'}
                            </button>
                        </div>
                        {shown[side.key] && (
                            <ul className="flex flex-col gap-2">
                                {side.ideas.map((idea, i) => (
                                    <li key={i} className={`${IDEA_SIZES[sizeIdx]} leading-snug ${textColor}`}>{idea}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}
