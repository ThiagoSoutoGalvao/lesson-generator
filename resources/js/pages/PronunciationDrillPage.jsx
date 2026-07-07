import { useParams, Link } from 'react-router-dom';
import minimalPairs from '@/data/pronunciation/minimalPairs.json';
import edEndings from '@/data/pronunciation/edEndings.json';
import soundCards from '@/data/pronunciation/soundCards.json';

const DRILL_INFO = {
    'phoneme': {
        title: 'Phoneme Drill (Minimal Pairs)',
        summary: (data) => `${data.length} confusable-sound groups loaded (${minimalPairs.map(g => g.label).join(', ')}).`,
        data: minimalPairs,
    },
    'ed-endings': {
        title: '-ed Endings Drill',
        summary: (data) => `${data.length} ending groups loaded (/${data.map(g => g.ending).join('/, /')}/).`,
        data: edEndings,
    },
    'sound-introduction': {
        title: 'Sound Introduction',
        summary: (data) => `${data.length} sound cards loaded.`,
        data: soundCards,
    },
};

export default function PronunciationDrillPage() {
    const { type } = useParams();
    const info = DRILL_INFO[type];

    if (!info) {
        return (
            <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-white">Unknown drill type</h2>
                <p className="text-white/60 text-sm">"{type}" isn't a recognised drill. Expected one of: phoneme, ed-endings, sound-introduction.</p>
                <Link to="/upload" className="text-indigo-300 hover:text-indigo-200 text-sm underline w-fit">← Back to Upload</Link>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">{info.title}</h2>
                <p className="text-white/60 mt-1 text-sm">Drill setup screen coming in Phase M6/M7.</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md p-6 text-white/70 text-sm">
                {info.summary(info.data)}
            </div>
        </div>
    );
}
