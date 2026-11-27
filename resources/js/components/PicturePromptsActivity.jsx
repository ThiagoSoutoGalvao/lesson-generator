import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import UseItChecklist from '@/components/UseItChecklist';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { phrasesFor } from '@/lib/pictureFrames';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightProgress, LIGHT } from '@/components/light/LightFrame';
import { InlineItemEditor, EditItemButton, saveActivityText } from '@/components/ActivityTextEditor';

const QUESTION_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const CHIP_SIZES     = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];

// Picture Prompts — a photo, an open question, and natural ways to start a sentence.
// Speaking practice with no answer to check: the teacher listens and gives live feedback,
// so it records completion only. Students default to "I can see…"; the panel under the
// photo offers other openers for the activity's level (see lib/pictureFrames.js).
export default function PicturePromptsActivity({ activity, onClose, onComplete, hideSave, savedId = null, onTargetsChange, onContentChange }) {
    // Local copy so an edit made on this screen shows straight away (2026-11-27).
    const [prompts, setPrompts] = useState(activity.prompts);
    const [editing, setEditing] = useState(false);
    const total   = prompts.length;
    const phrases = phrasesFor(activity.level);

    const [index, setIndex]       = useState(0);
    const [photos, setPhotos]     = useState({});      // index → image url
    const [showPhrases, setShowPhrases] = useState(true);
    const [finished, setFinished] = useState(false);
    const [showSave, setShowSave] = useState(false);
    const { sizeIdx: fontSizeIdx } = useDisplay();
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: LightPicturePrompts below
    // "Use it!" targets (editable) and the Library id they save against (see DiscussionQuestionsActivity).
    const [targets, setTargets]   = useState(activity.targets ?? []);
    const [activityId, setActivityId] = useState(savedId);

    const current = prompts[index];

    // Fetch this photo and the next one, so "Next" is never a blank frame.
    useEffect(() => {
        let cancelled = false;
        [index, index + 1].forEach(i => {
            if (i >= total || photos[i] !== undefined) return;
            // Photo first (2026-11-24): the photo Claude checked against the question is saved with it.
            if (prompts[i].photo) { setPhotos(p => ({ ...p, [i]: prompts[i].photo })); return; }
            axios.get('/api/background', { params: { topic: prompts[i].keyword } })
                .then(({ data }) => { if (!cancelled) setPhotos(p => ({ ...p, [i]: data.url })); })
                .catch(() => { if (!cancelled) setPhotos(p => ({ ...p, [i]: null })); });
        });
        return () => { cancelled = true; };
    }, [index]);

    useEffect(() => {
        function onKey(e) { if (e.code === 'KeyF') toggleFullscreen(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Student app: completion only — speaking practice keeps no score.
    useEffect(() => {
        if (finished) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function next() {
        setEditing(false);
        if (index + 1 >= total) setFinished(true);
        else setIndex(i => i + 1);
    }

    // "Edit" on the question card: the teacher, on a saved activity (never in the student app).
    const canEdit = !hideSave && Boolean(activityId);
    async function saveItem({ question, lines }) {
        const list = prompts.map((p, i) => (i === index ? { ...p, question, starters: lines } : p));
        const content = await saveActivityText(activityId, 'picture_prompts', { ...activity, prompts: list });
        setPrompts(content.prompts);
        onContentChange?.(content);
        setEditing(false);
    }

    if (light) {
        return (
            <LightPicturePrompts
                activity={activity} current={current} index={index} total={total} photo={photos[index]} phrases={phrases}
                showPhrases={showPhrases} onTogglePhrases={() => setShowPhrases(v => !v)} finished={finished}
                onBack={() => { setEditing(false); setIndex(i => i - 1); }} onNext={next}
                onEdit={canEdit ? () => setEditing(true) : null}
                editor={editing ? <InlineItemEditor key={index} question={current.question} lines={current.starters} linesLabel="Sentence starters" onSave={saveItem} onCancel={() => setEditing(false)} /> : null} onRestart={() => { setIndex(0); setFinished(false); }}
                sizeIdx={fontSizeIdx} onClose={onClose} isFullscreen={isFullscreen} onFullscreen={toggleFullscreen}
                onSave={hideSave ? null : () => setShowSave(true)}
                overlay={!hideSave && showSave ? <SavePanel activity={{ ...activity, targets }} onSaved={a => setActivityId(a.id)} onDone={() => setShowSave(false)} /> : null}
                checklist={<UseItChecklist targets={targets} savedId={activityId} onTargetsChange={list => { setTargets(list); onTargetsChange?.(list); }} />}
            />
        );
    }

    if (finished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>
                <div className="text-center text-white flex flex-col items-center gap-6 px-8">
                    <h2 className="text-5xl font-bold">All done!</h2>
                    <p className="text-xl text-white/70">You described {total} pictures</p>
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => { setIndex(0); setFinished(false); }} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Start Over</button>
                        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    const photo = photos[index];

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' }}>

            {!hideSave && showSave && <SavePanel activity={{ ...activity, targets }} onSaved={a => setActivityId(a.id)} onDone={() => setShowSave(false)} />}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 sm:px-8 py-4">
                <span className="text-white/70 text-sm font-medium capitalize">{activity.topic} · Picture {index + 1} / {total}</span>
                <div className="flex items-center gap-5">
                    <DisplayControls colors={false} />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            <div className="relative z-10 px-6 sm:px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(index / total) * 100}%` }} />
                </div>
            </div>

            {/* Picture + the "Use it!" checklist: side by side from md up, each column scrolling on its own;
                stacked on a phone, where the OUTER box scrolls (the split-screen scroll trap, Claude.md §8). */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            {/* Top-aligned + scrollable, not centred — photo, question, openers and the phrase
                panel together can be taller than a phone; nothing may end up out of reach. */}
            <div className="shrink-0 md:shrink md:flex-1 md:min-h-0 flex flex-col items-center px-4 sm:px-8 gap-5 md:overflow-y-auto py-6">
                <div className="w-full max-w-3xl flex flex-col gap-5">
                    {photo ? (
                        // Whole photo, never cropped: object-cover in a wide 45vh strip kept only the middle
                        // band, so a building under construction became a sky with a crane tip.
                        <img src={photo} alt={current.keyword} className="block mx-auto w-auto max-w-full max-h-[45vh] object-contain rounded-2xl shadow-2xl" />
                    ) : (
                        <div className={`w-full aspect-video max-h-[45vh] rounded-2xl bg-white/10 flex items-center justify-center text-white/40 text-sm ${photo === undefined ? 'animate-pulse' : ''}`}>
                            {photo === null ? 'The photo could not be loaded' : ''}
                        </div>
                    )}

                    <p className={`text-white font-bold text-center leading-snug ${QUESTION_SIZES[fontSizeIdx]}`}>{current.question}</p>

                    {current.starters?.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {current.starters.map((s, i) => (
                                <span key={i} className={`bg-blue-500/25 border border-blue-300/50 text-white rounded-full px-4 py-1.5 ${CHIP_SIZES[fontSizeIdx]}`}>{s}</span>
                            ))}
                        </div>
                    )}

                    <div className="rounded-2xl bg-white/8 border border-white/15">
                        <button
                            type="button"
                            onClick={() => setShowPhrases(v => !v)}
                            aria-expanded={showPhrases}
                            className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left text-white font-semibold cursor-pointer"
                        >
                            <span>Instead of “I can see…” try:</span>
                            <span className="text-white/50 text-sm">{showPhrases ? 'Hide' : 'Show'}</span>
                        </button>
                        {showPhrases && (
                            <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-5 pb-4 text-white/85 ${CHIP_SIZES[fontSizeIdx]}`}>
                                {phrases.map((p, i) => <li key={i} className="flex gap-2"><span className="text-white/40">•</span><span>{p}</span></li>)}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-center gap-3 pt-1">
                        {index > 0 && (
                            <button onClick={() => setIndex(i => i - 1)} className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer">Back</button>
                        )}
                        <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl text-lg transition-colors cursor-pointer">
                            {index + 1 >= total ? 'Finish' : 'Next picture'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="shrink-0 md:w-80 md:min-h-0 md:overflow-y-auto px-4 md:pl-0 md:pr-8 pb-6 md:py-6 flex flex-col">
                <UseItChecklist
                    targets={targets}
                    savedId={activityId}
                    onTargetsChange={next => { setTargets(next); onTargetsChange?.(next); }}
                />
            </div>
            </div>
        </div>
    );
}

const LIGHT_Q_SIZES    = ['text-[20px] sm:text-xl', 'text-[22px] sm:text-2xl', 'text-[23px] sm:text-[30px]', 'text-[27px] sm:text-[36px]', 'text-[31px] sm:text-[44px]'];
const LIGHT_CHIP_SIZES = ['text-sm', 'text-base', 'text-[17px] sm:text-lg', 'text-lg sm:text-xl', 'text-xl sm:text-2xl'];

// Aurora Business light layout: the whole photo on its own panel (never cropped, never under text), the question
// and openers on a white card, "Use it!" on the right.
function LightPicturePrompts({ activity, current, index, total, photo, phrases, showPhrases, onTogglePhrases, finished,
    onBack, onNext, onRestart, sizeIdx, onClose, isFullscreen, onFullscreen, onSave, overlay, checklist, onEdit, editor }) {
    return (
        <LightFrame
            eyebrow="Picture prompts" title={activity.topic || 'Describe the picture'}
            extra={finished ? null : <span className="hidden sm:flex"><LightProgress index={index} total={total} label="Picture" /></span>}
            onSave={onSave} isFullscreen={isFullscreen} onFullscreen={onFullscreen} onClose={onClose} overlay={overlay}
        >
            <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 sm:py-7 flex flex-col md:flex-row gap-5 sm:gap-7">
                <div className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
                    {finished ? (
                        <section className={`${LIGHT.card} p-8 sm:p-10 flex flex-col items-center text-center gap-4`} aria-label="All done">
                            <p className={LIGHT.eyebrow}>Picture prompts</p>
                            <h1 className="font-display text-[32px] sm:text-[40px] font-semibold leading-tight">All done!</h1>
                            <p className="text-[19px] text-[#4A5163]">You described {total} {total === 1 ? 'picture' : 'pictures'}.</p>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                <button type="button" onClick={onRestart} className={LIGHT.primary}>Start over</button>
                                {onClose && <button type="button" onClick={onClose} className={LIGHT.secondary}>Close</button>}
                            </div>
                        </section>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-[#DDE1E8] bg-[#E9ECF1] p-2 sm:p-3 flex justify-center">
                                {photo ? (
                                    <img src={photo} alt={current.keyword} className="block w-auto max-w-full max-h-[42vh] object-contain rounded-xl" />
                                ) : (
                                    <div className={`w-full aspect-video max-h-[42vh] rounded-xl grid place-items-center text-[#4A5163] text-[15px] ${photo === undefined ? 'animate-pulse' : ''}`}>
                                        {photo === null ? 'The photo could not be loaded' : ''}
                                    </div>
                                )}
                            </div>
                            <section className={`${LIGHT.card} p-5 sm:p-8 flex flex-col gap-4`} aria-label="Question">
                                <div className="flex items-start justify-between gap-3">
                                    <p className={LIGHT.eyebrow}><span className="sm:hidden">Picture {index + 1} of {total} · </span>Talk about the picture</p>
                                    {onEdit && !editor && <EditItemButton onClick={onEdit} />}
                                </div>
                                {editor ?? <>
                                <h1 className={`font-display ${LIGHT_Q_SIZES[sizeIdx]} font-semibold leading-snug`}>{current.question}</h1>
                                {current.starters?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {current.starters.map((s, i) => (
                                            <span key={i} className={`bg-[#FDEEE7] border border-[#F4C3AE] rounded-full px-4 py-1.5 ${LIGHT_CHIP_SIZES[sizeIdx]}`}>{s}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="rounded-xl bg-[#F6F7F9] border border-[#DDE1E8]">
                                    <button type="button" onClick={onTogglePhrases} aria-expanded={showPhrases}
                                        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left font-semibold cursor-pointer min-h-11">
                                        <span>Instead of “I can see…” try:</span>
                                        <span className="text-[#4A5163] text-sm">{showPhrases ? 'Hide' : 'Show'}</span>
                                    </button>
                                    {showPhrases && (
                                        <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-4 sm:px-5 pb-4 ${LIGHT_CHIP_SIZES[sizeIdx]}`}>
                                            {phrases.map((p, i) => <li key={i} className="flex gap-2"><span className="text-[#4A5163]" aria-hidden="true">•</span><span>{p}</span></li>)}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex flex-wrap justify-end gap-3 pt-1">
                                    {index > 0 && <button type="button" onClick={onBack} className={LIGHT.secondary}>Back</button>}
                                    <button type="button" onClick={onNext} className={LIGHT.primary}>{index + 1 >= total ? 'Finish' : 'Next picture'}</button>
                                </div>
                                </>}
                            </section>
                        </>
                    )}
                </div>
                <div className="md:w-[340px] md:shrink-0 flex flex-col">{checklist}</div>
            </div>
        </LightFrame>
    );
}
