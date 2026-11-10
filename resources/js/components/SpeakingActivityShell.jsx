import { useEffect, useState } from 'react';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import UseItChecklist from '@/components/UseItChecklist';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';

// The frame shared by the production templates (Aurora Lessons Phase 1, step 3): Role-play cards, Story
// builder, Debate cards, Mini presentation. It owns the header, the Save panel, card-by-card navigation, the
// "All done" screen, the completion signal for the student app and the "Use it!" checklist column. Each
// template only draws one card: `renderItem(item, index)` — remounted per card (key), so a card's own state
// (swapped roles, hidden prompts, notes) starts fresh. Side by side from md up; stacked on a phone with the
// OUTER box scrolling (the split-screen scroll trap, Claude.md §8).

const GRADIENT = 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)';

export default function SpeakingActivityShell({
    activity, items, label, itemNoun, nextLabel, renderItem,
    onClose, onComplete, hideSave, savedId = null, onTargetsChange,
}) {
    const total = items.length;
    const [index, setIndex]       = useState(0);
    const [finished, setFinished] = useState(false);
    const [showSave, setShowSave] = useState(false);
    const [targets, setTargets]   = useState(activity.targets ?? []);
    const [activityId, setActivityId] = useState(savedId);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below; each card's classes follow the ui-* tokens

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'KeyF') toggleFullscreen();
            if (finished) return;
            if (e.code === 'ArrowRight') next();
            if (e.code === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, finished]);

    // Student app: completion only — a speaking task has no answer to check (the teacher's live ticks
    // are a separate record, saved from the checklist).
    useEffect(() => {
        if (finished) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function next() {
        if (index + 1 >= total) setFinished(true);
        else setIndex(i => i + 1);
    }

    const checklist = (
        <UseItChecklist
            targets={targets}
            savedId={activityId}
            onTargetsChange={list => { setTargets(list); onTargetsChange?.(list); }}
        />
    );
    const savePanel = !hideSave && showSave
        ? <SavePanel activity={{ ...activity, targets }} onSaved={a => setActivityId(a.id)} onDone={() => setShowSave(false)} />
        : null;

    // Aurora Business light layout (mockup "Activity · Role-play card"): the card on the left, "Use it!" on the right.
    if (light) {
        return (
            <LightFrame
                eyebrow={`${label} · Production`} title={activity.topic || label}
                extra={<span className="hidden sm:flex"><LightProgress index={index} total={total} label={itemNoun} /></span>}
                onSave={hideSave ? null : () => setShowSave(true)} isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={savePanel}
            >
                <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 sm:py-7 flex flex-col md:flex-row gap-5 sm:gap-7">
                    <div className="flex-1 min-w-0 flex flex-col gap-5">
                        {finished ? (
                            <section className={`${LIGHT.card} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="All done">
                                <p className={LIGHT.eyebrow}>{label}</p>
                                <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-tight">All done!</h1>
                                <p className="text-[19px] text-[#4A5163]">All {total} {total === 1 ? itemNoun.toLowerCase() : `${itemNoun.toLowerCase()}s`} done. Save the ticks before you close.</p>
                                <div className="flex flex-wrap justify-center gap-3 mt-2">
                                    <button type="button" onClick={() => { setIndex(0); setFinished(false); }} className={LIGHT.primary}>Start over</button>
                                    {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                                </div>
                            </section>
                        ) : (
                            <>
                                <p className={`${LIGHT.eyebrow} sm:hidden`}>{itemNoun} {index + 1} of {total}</p>
                                <div key={index} className="flex flex-col gap-5">{renderItem(items[index], index)}</div>
                                <div className="flex flex-wrap items-center justify-end gap-3">
                                    {index > 0 && <button type="button" onClick={() => setIndex(i => i - 1)} className={LIGHT.secondary}>Back</button>}
                                    <button type="button" onClick={next} className={LIGHT.primary}>{index + 1 >= total ? 'Finish' : nextLabel}</button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Same element in both states, so the ticks survive "Finish". */}
                    <div className="md:w-[340px] md:shrink-0 flex flex-col">{checklist}</div>
                </div>
            </LightFrame>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={{ background: GRADIENT }}>
            {savePanel}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 sm:px-8 py-4">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-bold tracking-[0.12em] text-[#86dcae] bg-[#1f3a33] px-2.5 py-1 rounded-full shrink-0">PRODUCTION</span>
                    <span className="text-white/70 text-sm font-medium truncate">{label}{activity.topic ? ` · ${activity.topic}` : ''} · {itemNoun} {index + 1} / {total}</span>
                </div>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            <div className="relative z-10 px-6 sm:px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(index / total) * 100}%` }} />
                </div>
            </div>

            <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                <div className="shrink-0 md:shrink md:flex-1 md:min-h-0 md:overflow-y-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
                    {finished ? (
                        <div className="text-center text-white flex flex-col items-center gap-6 py-10">
                            <h2 className="text-5xl font-bold">All done!</h2>
                            <p className="text-xl text-white/70">{label}: all {total} done</p>
                            <div className="flex gap-4 mt-2">
                                <button onClick={() => { setIndex(0); setFinished(false); }} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Start Over</button>
                                <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div key={index} className="flex flex-col gap-5">{renderItem(items[index], index)}</div>
                            <div className="flex justify-center gap-3 pt-1">
                                {index > 0 && (
                                    <button onClick={() => setIndex(i => i - 1)} className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Back</button>
                                )}
                                <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                                    {index + 1 >= total ? 'Finish' : nextLabel}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                {/* Same element in both states, so the ticks survive "Finish" — the natural moment to save them. */}
                <div className="shrink-0 md:w-80 md:min-h-0 md:overflow-y-auto px-4 md:pl-0 md:pr-8 pb-6 md:py-6 flex flex-col">
                    {checklist}
                </div>
            </div>
        </div>
    );
}
