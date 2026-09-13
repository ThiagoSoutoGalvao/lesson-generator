import { useParams, useNavigate } from 'react-router-dom';
import { PracticeBackContext } from '@/hooks/usePracticeBack';
import ReadSelectDrill from '@/components/det/ReadSelectDrill';
import FillBlankDrill from '@/components/det/FillBlankDrill';
import ReadCompleteDrill from '@/components/det/ReadCompleteDrill';
import InteractiveReadingDrill from '@/components/det/InteractiveReadingDrill';
import ReadThenSpeakDrill from '@/components/det/ReadThenSpeakDrill';
import SpeakAboutPhotoDrill from '@/components/det/SpeakAboutPhotoDrill';
import InteractiveSpeakingDrill from '@/components/det/InteractiveSpeakingDrill';
import VocabPracticeDrill from '@/components/det/VocabPracticeDrill';

function BackButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-fit px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
            ← Back
        </button>
    );
}

const DRILLS = {
    'read-select': ReadSelectDrill,
    'fill-blank': FillBlankDrill,
    'read-complete': ReadCompleteDrill,
    'interactive-reading': InteractiveReadingDrill,
    'vocab-practice': VocabPracticeDrill,
    'read-then-speak': ReadThenSpeakDrill,
    'speak-about-photo': SpeakAboutPhotoDrill,
    'interactive-speaking': InteractiveSpeakingDrill,
};

const DEFAULT_BACK_TO = { path: '/upload', state: { tab: 'det' } };

// `backTo` lets whoever renders this route say where its own "Back" button (and every
// leaf drill's) should go — the teacher's Upload page by default, or the student's
// Practice tab (see StudentShell.jsx) when rendered there instead.
export default function DetPracticePage({ backTo = DEFAULT_BACK_TO }) {
    const { type } = useParams();
    const navigate = useNavigate();

    function backToDetTab() {
        navigate(backTo.path, { state: backTo.state });
    }

    const Drill = DRILLS[type];

    if (!Drill) {
        return (
            <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-white">Unknown practice type</h2>
                <p className="text-white/60 text-sm">
                    "{type}" isn't a recognised DET practice type. Expected one of: read-select, fill-blank, read-complete, interactive-reading, vocab-practice, read-then-speak, speak-about-photo, interactive-speaking.
                </p>
                <BackButton onClick={backToDetTab} />
            </div>
        );
    }

    return (
        <PracticeBackContext.Provider value={backTo}>
            <Drill />
        </PracticeBackContext.Provider>
    );
}
