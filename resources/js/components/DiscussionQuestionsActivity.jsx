import { useEffect, useState } from 'react';
import axios from 'axios';
import SavePanel from '@/components/SavePanel';
import DisplayControls from '@/components/DisplayControls';
import UseItChecklist from '@/components/UseItChecklist';
import { useDisplay } from '@/hooks/useDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsLightUi } from '@/lib/uiTheme';
import { LightFrame, LightPhoto, LightProgress, LIGHT } from '@/components/light/LightFrame';
import { InlineItemEditor, EditItemButton, saveActivityText } from '@/components/ActivityTextEditor';

const FONT_SIZES = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
const LIGHT_SIZES = ['text-[22px] sm:text-2xl', 'text-2xl sm:text-3xl', 'text-[24px] sm:text-[36px]', 'text-[28px] sm:text-[42px]', 'text-[32px] sm:text-[50px]'];
const FOLLOW_SIZES = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

export default function DiscussionQuestionsActivity({ activity, onClose, onComplete, hideSave, savedId = null, onTargetsChange, onContentChange }) {
    // Local copy so an edit made on this screen shows straight away (2026-11-27).
    const [questions, setQuestions] = useState(activity.questions);
    const [editing, setEditing] = useState(false);
    const [index, setIndex]           = useState(0);
    const [bgUrl, setBgUrl]           = useState(null);
    const [showSave, setShowSave]     = useState(false);
    const { sizeIdx: fontSizeIdx, textColor } = useDisplay();
    const [displayQuestion, setDisplayQuestion] = useState(activity.questions[0]?.question ?? '');
    const [followUps, setFollowUps]         = useState(activity.questions[0]?.follow_ups ?? []);
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
    const light = useIsLightUi(); // Aurora Business: the light layout below
    // "Use it!" targets (editable) and the Library id they save against — set by the Library launch, or by
    // saving this freshly generated activity from the Save panel.
    const [targets, setTargets]   = useState(activity.targets ?? []);
    const [activityId, setActivityId] = useState(savedId);

    const current   = questions[index];
    const total     = questions.length;

    useEffect(() => {
        axios.get('/api/background', { params: { topic: activity.keyword || activity.topic } })
            .then(({ data }) => setBgUrl(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); next(); }
            if (e.code === 'ArrowLeft')  { e.preventDefault(); prev(); }
            if (e.code === 'KeyF')        toggleFullscreen();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index]);

    useEffect(() => {
        setDisplayQuestion(current.question);
        setFollowUps(current.follow_ups ?? []);
        setEditing(false);
    }, [index, questions]);

    // "Edit" on the question card: the teacher, on a saved activity (never in the student app).
    const canEdit = !hideSave && Boolean(activityId);
    async function saveItem({ question, lines }) {
        const list = questions.map((q, i) => (i === index ? { ...q, question, follow_ups: lines } : q));
        const content = await saveActivityText(activityId, 'discussion_questions', { ...activity, questions: list });
        setQuestions(content.questions);
        onContentChange?.(content);
    }

    function next() { if (index < total - 1) setIndex(i => i + 1); }
    function prev() { if (index > 0) setIndex(i => i - 1); }

    // Student app (Phase S4): no reveal/finish concept here — the only real
    // "reached the end" signal is arriving at the last question. No score.
    useEffect(() => {
        if (index === total - 1) onComplete?.({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    function promoteFollowUp(fu) {
        setDisplayQuestion(fu);
        setFollowUps(prev => prev.filter(f => f !== fu));
    }

    const bgStyle = bgUrl
        ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    const checklist = (
        <UseItChecklist
            targets={targets}
            savedId={activityId}
            onTargetsChange={next => { setTargets(next); onTargetsChange?.(next); }}
        />
    );
    const savePanel = !hideSave && showSave
        ? <SavePanel activity={{ ...activity, targets }} onSaved={a => setActivityId(a.id)} onDone={() => setShowSave(false)} />
        : null;

    // Aurora Business light layout: the photo as a band above the question (never behind it), "Use it!" on the right.
    if (light) {
        return (
            <LightFrame
                eyebrow="Discussion" title={activity.topic || 'Discuss'}
                extra={<span className="hidden sm:flex"><LightProgress index={index} total={total} /></span>}
                onSave={hideSave ? null : () => setShowSave(true)} isFullscreen={isFullscreen} onFullscreen={toggleFullscreen} onClose={onClose}
                overlay={savePanel}
            >
                <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 sm:py-7 flex flex-col md:flex-row gap-5 sm:gap-7">
                    <div className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
                        <LightPhoto url={bgUrl} className="h-[150px] sm:h-[200px]" />
                        <section className={`${LIGHT.card} p-5 sm:p-9 flex flex-col gap-5`} aria-label="Question">
                            <div className="flex items-start justify-between gap-3">
                                <p className={LIGHT.chip}><span className="sm:hidden">Question {index + 1} of {total} · </span>Discuss</p>
                                {canEdit && !editing && <EditItemButton onClick={() => setEditing(true)} />}
                            </div>
                            {editing ? <InlineItemEditor key={index} question={current.question} lines={current.follow_ups} linesLabel="Follow-up questions" onSave={saveItem} onCancel={() => setEditing(false)} /> : <>
                            <h1 className={`font-display ${LIGHT_SIZES[fontSizeIdx]} font-semibold leading-snug`}>{displayQuestion}</h1>
                            {followUps.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[14px] font-semibold text-[#4A5163]">Follow-up questions — tap one to ask it</p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {followUps.map((fu, i) => (
                                            <button key={i} type="button" onClick={() => promoteFollowUp(fu)}
                                                className={`text-left px-4 py-2.5 rounded-xl bg-[#F6F7F9] border border-[#DDE1E8] hover:bg-[#FDEEE7] hover:border-[#E0521F] ${FOLLOW_SIZES[fontSizeIdx]} cursor-pointer`}>
                                                {fu}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-wrap justify-end gap-3 pt-1">
                                {index > 0 && <button type="button" onClick={prev} className={LIGHT.secondary}>← Previous</button>}
                                <button type="button" onClick={next} disabled={index === total - 1} className={LIGHT.primary}>{index === total - 1 ? 'Last question' : 'Next question'}</button>
                            </div>
                            </>}
                        </section>
                    </div>
                    <div className="md:w-[340px] md:shrink-0 flex flex-col">{checklist}</div>
                </div>
            </LightFrame>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={bgStyle}>
            <div className="absolute inset-0 bg-black/40" />

            {savePanel}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-4">
                <span className="text-white/70 text-sm font-medium">Question {index + 1} / {total}</span>
                <div className="flex items-center gap-5">
                    <DisplayControls />
                    {!hideSave && <button onClick={() => setShowSave(true)} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer">Save</button>}
                    <button onClick={toggleFullscreen} className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer" title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">✕</button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 px-8">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-1 bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </div>
            </div>

            {/* Question + the "Use it!" checklist. Side by side from md up (each column scrolls on its own);
                stacked on a phone, where the OUTER box scrolls — the split-screen scroll trap (Claude.md §8). */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            {/* Top-aligned + scrollable, not centered — several follow-up
                chips can't push Prev/Next off-screen on a phone. */}
            <div className="shrink-0 md:shrink md:flex-1 md:min-h-0 flex flex-col items-center px-8 gap-8 md:overflow-y-auto py-8">
                <div className="max-w-3xl w-full flex flex-col items-center gap-6 text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest">Discuss</p>
                    <h2 className={`${FONT_SIZES[fontSizeIdx]} font-bold leading-snug ${textColor}`}>{displayQuestion}</h2>

                    {followUps.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {followUps.map((fu, i) => (
                                <button key={i} onClick={() => promoteFollowUp(fu)}
                                    className={`px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 ${FOLLOW_SIZES[fontSizeIdx]} backdrop-blur-sm ${textColor} opacity-80 hover:opacity-100 transition-all duration-150 cursor-pointer text-left`}>
                                    {fu}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <button onClick={prev} disabled={index === 0}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer">← Prev</button>
                    <button onClick={next} disabled={index === total - 1}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-default text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors cursor-pointer">Next →</button>
                </div>
            </div>
            <div className="shrink-0 md:w-80 md:min-h-0 md:overflow-y-auto px-6 md:pl-0 md:pr-8 pb-8 md:py-8 flex flex-col">
                {checklist}
            </div>
            </div>
        </div>
    );
}
