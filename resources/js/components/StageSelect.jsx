import { useState } from 'react';
import axios from 'axios';
import { STAGES, STAGE_LABELS, defaultStage } from '@/lib/stages';

// Lesson-pack stage of one trilha activity, set straight from where it's listed (Library card, lesson pack).
// Untagged activities show the type's usual stage as a suggestion only — nothing is saved until the teacher
// picks (that pick IS the review).
export default function StageSelect({ activity: a, onSaved }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr]   = useState('');

    async function change(e) {
        const stage = e.target.value || null;
        setBusy(true); setErr('');
        try {
            const { data } = await axios.patch(`/api/activities/${a.id}`, { stage });
            onSaved(data);
        } catch {
            setErr('Could not save the stage.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor={`stage-${a.id}`} className="text-xs text-ui-muted">Stage</label>
            <select
                id={`stage-${a.id}`}
                value={a.stage ?? ''}
                onChange={change}
                disabled={busy}
                className={`text-xs rounded-lg px-2 py-1 border cursor-pointer disabled:opacity-50 ${
                    a.stage ? 'bg-ui-field border-ui-line text-ui-ink' : 'bg-ui-warn-bg border-ui-warn-line text-ui-warn'
                }`}
            >
                <option value="" className="text-black bg-white">Not set (usually {STAGE_LABELS[defaultStage(a.type)]})</option>
                {STAGES.map(s => <option key={s.key} value={s.key} className="text-black bg-white">{s.label}</option>)}
            </select>
            {err && <span className="text-xs text-ui-danger">{err}</span>}
        </div>
    );
}
