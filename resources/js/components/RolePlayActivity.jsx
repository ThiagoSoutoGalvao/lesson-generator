import { useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { useDisplay } from '@/hooks/useDisplay';

const SITUATION_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const BRIEF_SIZES     = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

// Role-play cards (production): a situation and two roles. Role A is the student by default; "Swap roles"
// hands it to the teacher. The "Use it!" checklist and navigation come from SpeakingActivityShell.
export default function RolePlayActivity(props) {
    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.cards}
            label="Role-play"
            itemNoun="Card"
            nextLabel="Next card"
            renderItem={card => <RolePlayCard card={card} />}
        />
    );
}

function RolePlayCard({ card }) {
    const [swapped, setSwapped] = useState(false);
    const { sizeIdx, textColor } = useDisplay();
    const roles = [
        { key: 'a', who: swapped ? 'TEACHER' : 'STUDENT', role: card.role_a, student: !swapped },
        { key: 'b', who: swapped ? 'STUDENT' : 'TEACHER', role: card.role_b, student: swapped },
    ];

    return (
        <>
            <section className="rounded-2xl bg-black/30 border border-white/15 px-6 py-5">
                <p className="text-white/55 text-xs font-bold tracking-[0.12em] mb-2">THE SITUATION</p>
                <p className={`${SITUATION_SIZES[sizeIdx]} leading-snug ${textColor}`}>{card.situation}</p>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map(r => (
                    <section
                        key={r.key}
                        aria-label={`Role ${r.key.toUpperCase()}: ${r.role.name}`}
                        className={`rounded-2xl px-6 py-5 flex flex-col gap-2 ${r.student ? 'bg-[#2b2448]/80 border-2 border-[#fc6840]' : 'bg-black/30 border border-white/15'}`}
                    >
                        <p className={`text-xs font-bold tracking-[0.12em] ${r.student ? 'text-[#ff9b7a]' : 'text-white/55'}`}>ROLE {r.key.toUpperCase()} · {r.who}</p>
                        <p className="text-white font-semibold text-xl">{r.role.name}</p>
                        <p className={`${BRIEF_SIZES[sizeIdx]} leading-relaxed ${textColor}`}>{r.role.brief}</p>
                    </section>
                ))}
            </div>
            <button
                type="button"
                onClick={() => setSwapped(v => !v)}
                className="self-start bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
            >
                Swap roles
            </button>
        </>
    );
}
