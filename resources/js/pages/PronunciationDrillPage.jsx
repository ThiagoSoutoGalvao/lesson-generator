import { useParams, useNavigate } from 'react-router-dom';
import SoundIntroductionCard from '@/components/SoundIntroductionCard';
import MinimalPairsDrill from '@/components/MinimalPairsDrill';
import EdEndingsDrill from '@/components/EdEndingsDrill';
import WordStressDrill from '@/components/WordStressDrill';

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

export default function PronunciationDrillPage() {
    const { type } = useParams();
    const navigate = useNavigate();

    function backToPronunciation() {
        navigate('/upload', { state: { tab: 'pronunciation' } });
    }

    if (type === 'sound-introduction') {
        return <SoundIntroductionCard />;
    }

    if (type === 'phoneme') {
        return <MinimalPairsDrill />;
    }

    if (type === 'ed-endings') {
        return <EdEndingsDrill />;
    }

    if (type === 'word-stress') {
        return <WordStressDrill />;
    }

    return (
        <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-white">Unknown drill type</h2>
            <p className="text-white/60 text-sm">"{type}" isn't a recognised drill. Expected one of: phoneme, ed-endings, sound-introduction, word-stress.</p>
            <BackButton onClick={backToPronunciation} />
        </div>
    );
}
