import { useParams, useNavigate } from 'react-router-dom';
import ReadSelectDrill from '@/components/det/ReadSelectDrill';
import FillBlankDrill from '@/components/det/FillBlankDrill';
import readComplete from '@/data/det/readComplete.json';
import interactiveReading from '@/data/det/interactiveReading.json';

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

// Data-driven summary for types that don't have a real drill yet (Phase 3).
const PLACEHOLDER_TYPE_INFO = {
    'read-complete': {
        label: 'Read and Complete',
        summary: data => {
            const blankCount = data.reduce((sum, p) => sum + p.blanks.length, 0);
            return `${data.length} paragraphs loaded · ${blankCount} blanks total`;
        },
        data: readComplete,
    },
    'interactive-reading': {
        label: 'Interactive Reading',
        summary: data => `${data.length} passage${data.length === 1 ? '' : 's'} loaded · ${data[0]?.tasks.length ?? 0} sub-tasks each`,
        data: interactiveReading,
    },
};

export default function DetPracticePage() {
    const { type } = useParams();
    const navigate = useNavigate();

    function backToDetTab() {
        navigate('/upload', { state: { tab: 'det' } });
    }

    if (type === 'read-select') {
        return <ReadSelectDrill />;
    }

    if (type === 'fill-blank') {
        return <FillBlankDrill />;
    }

    const info = PLACEHOLDER_TYPE_INFO[type];

    if (!info) {
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

    return (
        <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">{info.label}</h2>
                <p className="text-white/60 mt-1 text-sm">DET Practice Mode — Phase 1 checkpoint</p>
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur-md p-6">
                <p className="text-amber-300 font-semibold">{info.summary(info.data)}</p>
                <p className="text-white/40 text-xs mt-2">
                    Content is loading correctly from resources/js/data/det/. The real interactive drill for
                    "{info.label}" comes in a later phase.
                </p>
            </div>

            <BackButton onClick={backToDetTab} />
        </div>
    );
}
