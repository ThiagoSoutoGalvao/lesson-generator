import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { A2_PARTS } from '@/lib/cambridgeLevels';

// Practice (2026-10-08): the ready-made practice modes — Pronunciation, DET and Cambridge — moved here from the
// Upload page (now "Materials") so that page holds only lesson material. Same launchers as before; every drill's
// Back button returns here (`/practice`, with the tab in location state). Students reach the same drills from
// their own Practice tab (`/s/practice`).

// ─── Pronunciation Tab ────────────────────────────────────────────────────────

function PronunciationLauncher() {
    const navigate = useNavigate();

    const drillButtonCls = 'py-6 px-4 rounded-2xl lg-surface lg-surface-hover border text-white text-base font-semibold transition-all cursor-pointer hover:scale-[1.02]';

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate('/pronunciation')}
                className="w-full py-8 rounded-2xl bg-teal-600 hover:bg-teal-700 border border-teal-500 text-white font-bold text-xl transition-all cursor-pointer hover:scale-[1.01]"
            >
                🔤 Phonemic Chart
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => navigate('/pronunciation/drill/phoneme')} className={drillButtonCls}>
                    Phoneme Drill
                </button>
                <button onClick={() => navigate('/pronunciation/drill/ed-endings')} className={drillButtonCls}>
                    -ed Endings
                </button>
                <button onClick={() => navigate('/pronunciation/drill/sound-introduction')} className={drillButtonCls}>
                    Sound Introduction
                </button>
                <button onClick={() => navigate('/pronunciation/drill/word-stress')} className={drillButtonCls}>
                    Word Stress
                </button>
                <button onClick={() => navigate('/pronunciation/drill/homophones')} className={drillButtonCls}>
                    Homophones
                </button>
                <button onClick={() => navigate('/pronunciation/drill/silent-letters')} className={drillButtonCls}>
                    Silent Letters
                </button>
            </div>
        </div>
    );
}

// ─── DET Practice Tab ──────────────────────────────────────────────────────────

function DetPracticeLauncher() {
    const navigate = useNavigate();

    const drillButtonCls = 'py-6 px-4 rounded-2xl lg-surface lg-surface-hover border text-white text-base font-semibold transition-all cursor-pointer hover:scale-[1.02]';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <p className="lg-shell-text text-white/75 text-xs font-medium">
                    DET-format reading and vocabulary practice — no scoring, teacher-controlled pace.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/det/practice/read-select')} className={drillButtonCls}>
                        Read and Select
                    </button>
                    <button onClick={() => navigate('/det/practice/fill-blank')} className={drillButtonCls}>
                        Fill in the Blanks
                    </button>
                    <button onClick={() => navigate('/det/practice/read-complete')} className={drillButtonCls}>
                        Read and Complete
                    </button>
                    <button onClick={() => navigate('/det/practice/interactive-reading')} className={drillButtonCls}>
                        Interactive Reading
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <p className="lg-shell-text text-white/75 text-xs font-medium">
                    Speaking practice — no timer, no recording, you run it live — plus a quick vocabulary check-in.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/det/practice/read-then-speak')} className={drillButtonCls}>
                        Read, Then Speak
                    </button>
                    <button onClick={() => navigate('/det/practice/speak-about-photo')} className={drillButtonCls}>
                        Speak About the Photo
                    </button>
                    <button onClick={() => navigate('/det/practice/interactive-speaking')} className={drillButtonCls}>
                        Interactive Speaking
                    </button>
                    <button onClick={() => navigate('/det/practice/vocab-practice')} className={drillButtonCls}>
                        Vocabulary Practice
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Cambridge Practice Tab ────────────────────────────────────────────────────

function CambridgePracticeLauncher() {
    const navigate = useNavigate();

    const drillButtonCls = 'py-6 px-4 rounded-2xl lg-surface lg-surface-hover border text-white text-base font-semibold transition-all cursor-pointer hover:scale-[1.02]';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <p className="font-display lg-shell-text text-white text-2xl font-bold">A2 easy start</p>
                <p className="lg-shell-text text-white/75 text-xs font-medium -mt-2">
                    The same Reading &amp; Use of English task styles, written at A2: short texts, everyday topics. Original content; no official score, no recording.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {A2_PARTS.map(part => (
                        <button key={part.type} onClick={() => navigate(`/cambridge/a2/${part.type}`)} className={drillButtonCls}>
                            {part.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <p className="font-display lg-shell-text text-white text-2xl font-bold">B2 First</p>
                <p className="lg-shell-text text-white/75 text-xs font-medium -mt-2">
                    Cambridge-style practice. Original content, not real exam material; no official score, no recording.
                </p>

                <p className="lg-shell-text text-white/75 text-xs font-semibold uppercase tracking-wide mt-2">Reading &amp; Use of English</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/cambridge/practice/word-formation')} className={drillButtonCls}>
                        Word Formation
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/key-word-transformation')} className={drillButtonCls}>
                        Key Word Transformation
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/mc-cloze')} className={drillButtonCls}>
                        Multiple-Choice Cloze
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/open-cloze')} className={drillButtonCls}>
                        Open Cloze
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/mc-reading')} className={drillButtonCls}>
                        Multiple Choice Reading
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/multiple-matching')} className={drillButtonCls}>
                        Multiple Matching
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/gapped-text')} className={drillButtonCls}>
                        Gapped Text
                    </button>
                </div>

                <p className="lg-shell-text text-white/75 text-xs font-semibold uppercase tracking-wide mt-2">Writing — the student writes on paper or their own doc, no capture, no auto-checking</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/cambridge/practice/essay')} className={drillButtonCls}>
                        Essay
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/genre')} className={drillButtonCls}>
                        Genre Choice
                    </button>
                </div>

                <p className="lg-shell-text text-white/75 text-xs font-semibold uppercase tracking-wide mt-2">Speaking — no timer, no recording, you run it live</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/cambridge/practice/interview')} className={drillButtonCls}>
                        Interview
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/long-turn')} className={drillButtonCls}>
                        Individual Long Turn
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/collaborative')} className={drillButtonCls}>
                        Collaborative Task
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/discussion')} className={drillButtonCls}>
                        Discussion
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
                <p className="font-display lg-shell-text text-white text-2xl font-bold">C1 Advanced</p>
                <p className="lg-shell-text text-white/75 text-xs font-medium -mt-2">
                    Harder, C1-level practice — currently just one part while B2 First is being validated with real students.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/cambridge/practice/cross-text-matching')} className={drillButtonCls}>
                        Cross-Text Multiple Matching
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PracticeHubPage() {
    const location = useLocation();
    const [tab, setTab] = useState(location.state?.tab ?? 'pronunciation');
    const tabs = [
        { id: 'pronunciation', label: '🔊 Pronunciation', active: 'bg-teal-500/30 border-teal-400/60 text-teal-100' },
        { id: 'det',           label: '🎯 DET Practice',  active: 'bg-amber-500/30 border-amber-400/60 text-amber-100' },
        { id: 'cambridge',     label: '🎓 Cambridge',     active: 'bg-rose-500/30 border-rose-400/60 text-rose-100' },
    ];

    return (
        <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="font-display lg-shell-text text-3xl font-bold text-white">Practice</h2>
                <p className="lg-shell-text text-white/70 mt-1 text-sm">Ready-made practice: pronunciation drills and DET- and Cambridge-style exam tasks. Students see the same under their Practice tab.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        aria-pressed={tab === t.id}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                            tab === t.id ? t.active : 'lg-chip lg-chip-hover text-white/60 hover:text-white/90'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === 'pronunciation' && <PronunciationLauncher />}
            {tab === 'det'           && <DetPracticeLauncher />}
            {tab === 'cambridge'     && <CambridgePracticeLauncher />}
        </div>
    );
}
