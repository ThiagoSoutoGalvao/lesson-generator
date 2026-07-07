import phonemes from '@/data/pronunciation/phonemes.json';

export default function PronunciationChartPage() {
    const counts = phonemes.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="max-w-xl mx-auto mt-4 flex flex-col gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">Phonemic Chart</h2>
                <p className="text-white/60 mt-1 text-sm">
                    The full 44-sound British English phonemic chart (Underhill layout).
                </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md p-6 text-white/70 text-sm">
                Coming in Phase M4 — for now, confirming the data loads:
                <span className="text-white font-semibold"> {phonemes.length} phonemes </span>
                ({counts.monophthong} monophthongs, {counts.diphthong} diphthongs, {counts.consonant} consonants).
            </div>
        </div>
    );
}
