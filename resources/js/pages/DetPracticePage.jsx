import { useParams, useNavigate } from 'react-router-dom';
import ReadSelectDrill from '@/components/det/ReadSelectDrill';
import FillBlankDrill from '@/components/det/FillBlankDrill';
import ReadCompleteDrill from '@/components/det/ReadCompleteDrill';
import InteractiveReadingDrill from '@/components/det/InteractiveReadingDrill';

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
};

export default function DetPracticePage() {
    const { type } = useParams();
    const navigate = useNavigate();

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    const Drill = DRILLS[type];

    if (!Drill) {
        return (
            <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-white">Unknown practice type</h2>
                <p className="text-white/60 text-sm">
                    "{type}" isn't a recognised DET practice type. Expected one of: read-select, fill-blank, read-complete, interactive-reading.
                </p>
                <BackButton onClick={backToDetTab} />
            </div>
        );
    }

    return <Drill />;
}
