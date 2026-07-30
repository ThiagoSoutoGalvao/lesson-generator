import { useFullscreen } from '@/hooks/useFullscreen';

const chromeBtnCls = 'px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors cursor-pointer';

export default function PracticeSessionShell({ title, subtitle, progressLabel, paused, onTogglePause, onRedo, onBack, children }) {
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    return (
        <div className="fixed inset-0 flex flex-col z-50 bg-[#1a1a2e]">
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-4">
                    {progressLabel && <span className="text-white/50 text-xs font-semibold tabular-nums">{progressLabel}</span>}
                    {onRedo && <button onClick={onRedo} className={chromeBtnCls}>↻ Redo</button>}
                    {onTogglePause && (
                        <button onClick={onTogglePause} className={chromeBtnCls}>
                            {paused ? '▶ Resume' : '⏸ Pause'}
                        </button>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                        title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                    >
                        {isFullscreen ? '⊡' : '⛶'}
                    </button>
                    <button onClick={onBack} className={chromeBtnCls}>← Back</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {paused ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/40 text-2xl font-semibold">Paused</p>
                    </div>
                ) : children}
            </div>
        </div>
    );
}
