import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { A2_PARTS } from '@/lib/cambridgeLevels';

// Exam-prep practice, reachable on its own — independent of the student's trilha.
// Same drills the teacher launches from Upload → DET/Cambridge tabs
// (resources/js/pages/UploadPage.jsx), just reachable directly by the student now.
// Aurora Homework Phase H1: browsable + self-serve, no assignment tracking yet.

const DET_SECTIONS = [
    {
        label: 'Reading & vocabulary',
        note: 'No scoring, self-paced.',
        items: [
            { type: 'read-select', label: 'Read and Select' },
            { type: 'fill-blank', label: 'Fill in the Blanks' },
            { type: 'read-complete', label: 'Read and Complete' },
            { type: 'interactive-reading', label: 'Interactive Reading' },
        ],
    },
    {
        label: 'Speaking',
        note: 'No timer, no recording — talk it through out loud on your own.',
        items: [
            { type: 'read-then-speak', label: 'Read, Then Speak' },
            { type: 'speak-about-photo', label: 'Speak About the Photo' },
            { type: 'interactive-speaking', label: 'Interactive Speaking' },
            { type: 'vocab-practice', label: 'Vocabulary Practice' },
        ],
    },
];

const CAMBRIDGE_SECTIONS = [
    {
        label: 'B2 First — Reading & Use of English',
        items: [
            { type: 'word-formation', label: 'Word Formation' },
            { type: 'key-word-transformation', label: 'Key Word Transformation' },
            { type: 'mc-cloze', label: 'Multiple-Choice Cloze' },
            { type: 'open-cloze', label: 'Open Cloze' },
            { type: 'mc-reading', label: 'Multiple Choice Reading' },
            { type: 'multiple-matching', label: 'Multiple Matching' },
            { type: 'gapped-text', label: 'Gapped Text' },
        ],
    },
    {
        label: 'Writing',
        note: 'Write on paper or your own doc — nothing to submit here.',
        items: [
            { type: 'essay', label: 'Essay' },
            { type: 'genre', label: 'Genre Choice' },
        ],
    },
    {
        label: 'Speaking',
        note: 'No timer, no recording — talk it through out loud on your own.',
        items: [
            { type: 'interview', label: 'Interview' },
            { type: 'long-turn', label: 'Individual Long Turn' },
            { type: 'collaborative', label: 'Collaborative Task' },
            { type: 'discussion', label: 'Discussion' },
        ],
    },
    {
        label: 'C1 Advanced',
        note: 'Harder — just one part for now.',
        items: [
            { type: 'cross-text-matching', label: 'Cross-Text Multiple Matching' },
        ],
    },
];

// The same seven Reading & Use of English task types, written at A2 (see lib/cambridgeLevels.js).
// Listed first so a learner who is starting out finds it before the B2 set.
const CAMBRIDGE_A2_SECTION = {
    label: 'A2 easy start',
    note: 'A gentler set in the same task styles: short texts and everyday topics. A good place to begin.',
    items: A2_PARTS,
};

function DrillRow({ to, label }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#291f66]/55 backdrop-blur-md p-3.5 transition-colors hover:border-white/20 hover:bg-[#342874]/70"
        >
            <span className="flex-1 min-w-0">
                <span className="block font-display font-semibold text-[14.5px] text-white">{label}</span>
            </span>
            <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 5l7 7-7 7" /></svg>
        </Link>
    );
}

function Section({ label, note, items, base }) {
    return (
        <div className="mb-7">
            <p className="font-display font-semibold text-[11px] tracking-[0.13em] uppercase text-[#9384bd] mb-2">{label}</p>
            {note && <p className="text-white/45 text-[12px] mb-3 leading-relaxed">{note}</p>}
            <div className="flex flex-col gap-2.5">
                {items.map(item => (
                    <DrillRow key={item.type} to={`${base}/${item.type}`} label={item.label} />
                ))}
            </div>
        </div>
    );
}

export default function PracticePage() {
    const location = useLocation();
    // Restores whichever tab a drill's Back button was sent from (see usePracticeBack),
    // same pattern as UploadPage's own tab restore.
    const [mode, setMode] = useState(location.state?.mode ?? 'cambridge');

    return (
        <div className="px-5 pt-8">
            <p className="font-display font-semibold text-[11px] tracking-[0.14em] uppercase text-[#9384bd] mb-2">
                Exam prep
            </p>
            <h1 className="font-display font-bold text-[26px] text-white leading-tight">Practice</h1>
            <p className="text-white/60 text-sm mt-2">
                Extra drills, separate from your trilha. Come back to any of these as many times as you like.
            </p>

            <div className="flex gap-2 mt-6 mb-7">
                <button
                    onClick={() => setMode('cambridge')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold border transition-colors cursor-pointer ${
                        mode === 'cambridge'
                            ? 'bg-[#fc6840]/20 border-[#fc6840]/60 text-[#ffceb8]'
                            : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                >
                    🎓 Cambridge
                </button>
                <button
                    onClick={() => setMode('det')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold border transition-colors cursor-pointer ${
                        mode === 'det'
                            ? 'bg-[#f8c63d]/20 border-[#f8c63d]/60 text-[#fbe3a1]'
                            : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                >
                    🎯 DET
                </button>
            </div>

            {mode === 'cambridge' && (
                <Section {...CAMBRIDGE_A2_SECTION} base="/s/practice/cambridge-a2" />
            )}
            {mode === 'cambridge' && CAMBRIDGE_SECTIONS.map(section => (
                <Section key={section.label} {...section} base="/s/practice/cambridge" />
            ))}
            {mode === 'det' && DET_SECTIONS.map(section => (
                <Section key={section.label} {...section} base="/s/practice/det" />
            ))}
        </div>
    );
}
