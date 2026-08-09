import { useParams, useNavigate } from 'react-router-dom';
import WordFormationDrill from '@/components/cambridge/WordFormationDrill';
import KeyWordTransformationDrill from '@/components/cambridge/KeyWordTransformationDrill';
import McClozeDrill from '@/components/cambridge/McClozeDrill';
import OpenClozeDrill from '@/components/cambridge/OpenClozeDrill';
import McReadingDrill from '@/components/cambridge/McReadingDrill';
import MultipleMatchingDrill from '@/components/cambridge/MultipleMatchingDrill';

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
    'word-formation': WordFormationDrill,
    'key-word-transformation': KeyWordTransformationDrill,
    'mc-cloze': McClozeDrill,
    'open-cloze': OpenClozeDrill,
    'mc-reading': McReadingDrill,
    'multiple-matching': MultipleMatchingDrill,
};

export default function CambridgePracticePage() {
    const { type } = useParams();
    const navigate = useNavigate();

    function backToCambridgeTab() {
        navigate('/upload', { state: { tab: 'cambridge' } });
    }

    const Drill = DRILLS[type];

    if (!Drill) {
        return (
            <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-white">Unknown practice type</h2>
                <p className="text-white/60 text-sm">
                    "{type}" isn't a recognised Cambridge practice type. Expected one of: word-formation, key-word-transformation, mc-cloze, open-cloze, mc-reading, multiple-matching.
                </p>
                <BackButton onClick={backToCambridgeTab} />
            </div>
        );
    }

    return <Drill />;
}
