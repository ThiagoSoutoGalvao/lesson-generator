import { useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';
import { useInkColor } from '@/lib/uiTheme';

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
    const { sizeIdx, textColor: chosen } = useDisplay();
    const textColor = useInkColor(chosen);
    const sides = [
        { key: 'for', label: 'FOR', ideas: card.for, accent: 'text-ui-good' },
        { key: 'against', label: 'AGAINST', ideas: card.against, accent: 'text-ui-accent' },
    ];

    return (
        <>
            <section className="rounded-2xl bg-ui-box border-2 border-ui-sel-line px-6 py-5">
                <p className="text-ui-accent text-xs font-bold tracking-[0.12em] mb-2 ab-chip">DO YOU AGREE?</p>
                <p className={`${STATEMENT_SIZES[sizeIdx]} font-bold leading-tight ${textColor}`}>{card.statement}</p>
            </section>
            <p className="text-ui-muted text-lg">Agree, disagree or partly? Give your reason first — then look at the ideas.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sides.map(side => (
                    <section key={side.key} aria-label={side.label === 'FOR' ? 'Ideas for' : 'Ideas against'} className="rounded-2xl bg-ui-box border border-ui-line px-6 py-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className={`text-xs font-bold tracking-[0.12em] ${side.accent}`}>{side.label}</p>
                            <button
                                type="button"
                                aria-expanded={shown[side.key]}
                                onClick={() => setShown(s => ({ ...s, [side.key]: !s[side.key] }))}
                                className="text-sm text-ui-ink border border-ui-line bg-ui-field hover:bg-ui-well rounded-lg px-3 py-1.5 cursor-pointer"
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
