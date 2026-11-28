import { useState } from 'react';
import SpeakingActivityShell from '@/components/SpeakingActivityShell';
import { EditableCard } from '@/lib/itemEdit';
import { useDisplay } from '@/hooks/useDisplay';
import { useInkColor, useIsLightUi } from '@/lib/uiTheme';

const SITUATION_SIZES = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const BRIEF_SIZES     = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

// Role-play cards (production): a situation and two roles. Role A is the student by default; "Swap roles"
// hands it to the teacher. The "Use it!" checklist and navigation come from SpeakingActivityShell.
//
// Aurora Business (light theme, 2026-11-13) is ALWAYS a group of 2–4: the roles are Student A / Student B, with an
// optional role C (a third student, or the teacher) when the card has one. Instead of "Swap roles" there is
// "Who's reading?": a student picks their role on their own phone in a breakout room and the other briefs are hidden,
// so nobody reads their partner's information. The pick is remembered for the rest of the activity (per tab).
export default function RolePlayActivity(props) {
    return (
        <SpeakingActivityShell
            {...props}
            items={props.activity.cards}
            label="Role-play"
            itemNoun="Card"
            nextLabel="Next card"
            renderItem={(card, i) => <EditableCard type="role_play" activity={props.activity} onEditItems={props.onEditItems} index={i}><RolePlayCard card={card} /></EditableCard>}
        />
    );
}

const ME_KEY = 'aurora.roleplay.me';
function readMe() { try { return sessionStorage.getItem(ME_KEY) || 'all'; } catch { return 'all'; } }
function saveMe(v) { try { sessionStorage.setItem(ME_KEY, v); } catch { /* private mode — just not remembered */ } }

function RolePlayCard({ card }) {
    const group = useIsLightUi();
    const [swapped, setSwapped] = useState(false);
    const [me, setMeState] = useState(readMe);
    const setMe = v => { setMeState(v); saveMe(v); };
    const { sizeIdx, textColor: chosen } = useDisplay();
    const textColor = useInkColor(chosen);

    const roles = group
        ? [
            { key: 'a', who: 'STUDENT A', role: card.role_a },
            { key: 'b', who: 'STUDENT B', role: card.role_b },
            ...(card.role_c ? [{ key: 'c', who: 'STUDENT C OR THE TEACHER · OPTIONAL', role: card.role_c }] : []),
        ].map(r => ({ ...r, student: me === r.key, hidden: me !== 'all' && me !== r.key }))
        : [
            { key: 'a', who: swapped ? 'TEACHER' : 'STUDENT', role: card.role_a, student: !swapped },
            { key: 'b', who: swapped ? 'STUDENT' : 'TEACHER', role: card.role_b, student: swapped },
        ];
    // A remembered "I'm C" on a card with no role C shows everything rather than nothing.
    const effectiveMe = group && roles.some(r => r.key === me) ? me : 'all';
    const shown = roles.map(r => (effectiveMe === 'all' ? { ...r, hidden: false } : r));

    return (
        <>
            <section className="rounded-2xl bg-ui-box border border-ui-line px-6 py-5">
                <p className="text-ui-faint text-xs font-bold tracking-[0.12em] mb-2 ab-chip">THE SITUATION</p>
                <p className={`${SITUATION_SIZES[sizeIdx]} leading-snug ${textColor}`}>{card.situation}</p>
            </section>
            {group && (
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Who's reading?">
                    <span className="text-ui-muted text-sm font-semibold mr-1">Who's reading?</span>
                    {[['all', 'Everyone'], ...roles.map(r => [r.key, `I'm ${r.key.toUpperCase()}`])].map(([k, lbl]) => (
                        <button key={k} type="button" onClick={() => setMe(k)} aria-pressed={effectiveMe === k}
                            className={`h-10 px-4 rounded-xl border text-[15px] font-semibold cursor-pointer transition-colors ${
                                effectiveMe === k ? 'bg-[#E0521F] border-[#E0521F] text-white' : 'bg-white border-[#DDE1E8] text-[#271D62] hover:bg-[#F1F2F5]'
                            }`}>{lbl}</button>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shown.map(r => (
                    <section
                        key={r.key}
                        aria-label={`Role ${r.key.toUpperCase()}: ${r.role.name}`}
                        className={`rounded-2xl px-6 py-5 flex flex-col gap-2 ${r.key === 'c' ? 'md:col-span-2' : ''} ${
                            r.hidden ? 'bg-ui-well border border-dashed border-ui-line' : r.student ? 'bg-ui-box border-2 border-ui-sel-line' : 'bg-ui-box border border-ui-line'
                        }`}
                    >
                        <p className={`text-xs font-bold tracking-[0.12em] ${r.student ? 'text-ui-accent' : 'text-ui-faint'}`}>ROLE {r.key.toUpperCase()} · {r.who}</p>
                        <p className="text-ui-ink font-semibold text-xl">{r.role.name}</p>
                        {r.hidden
                            ? <p className="text-ui-muted text-[15px] italic">Hidden: this is your partner's card.</p>
                            : <p className={`${BRIEF_SIZES[sizeIdx]} leading-relaxed ${textColor}`}>{r.role.brief}</p>}
                    </section>
                ))}
            </div>
            {!group && (
                <button
                    type="button"
                    onClick={() => setSwapped(v => !v)}
                    className="self-start bg-ui-field hover:bg-ui-well border border-ui-line text-ui-ink font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                    Swap roles
                </button>
            )}
        </>
    );
}
