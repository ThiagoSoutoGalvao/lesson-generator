// Placeholder until Phase S3 (the progress layer). Kept so the bottom-nav
// "Progress" tab has a real destination from S1.
export default function ProgressPage() {
    return (
        <div className="px-5 pt-8">
            <h1 className="font-display font-bold text-[26px] text-white leading-tight">Your progress</h1>
            <div className="rounded-2xl border border-white/10 bg-[#291f66]/55 backdrop-blur-md p-6 mt-6 text-center">
                <p className="text-white/70 text-sm">Nothing here yet.</p>
                <p className="text-white/40 text-xs mt-1.5">
                    Once you start completing activities, your scores and history will show up here.
                </p>
            </div>
        </div>
    );
}
