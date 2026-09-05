import DisplayControls from '@/components/DisplayControls';
import { useFullscreen } from '@/hooks/useFullscreen';

const chromeBtnCls = 'px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors cursor-pointer';

const SHELL_BG = '#1a1a2e';

// Duolingo-style owl mascot, amber instead of green. Every shape uses its own genuinely
// distinct fill color (never one that matches SHELL_BG to fake a "cutout") — a face disc,
// pupils, and eye-shine give it real contrast so the face reads clearly even at low opacity,
// and because nothing depends on matching the backdrop, it can never show a seam or patch
// where other content (e.g. a translucent input box) happens to render on top of it.
function OwlWatermark() {
    return (
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <svg viewBox="0 0 400 460" className="opacity-[0.20] w-auto h-[85%] max-w-[90%]" aria-hidden="true">
                {/* wings */}
                <ellipse cx="68"  cy="290" rx="48" ry="115" fill="#b45309" />
                <ellipse cx="332" cy="290" rx="48" ry="115" fill="#b45309" />
                {/* ear tufts */}
                <path d="M118 55 Q136 8 166 66 Q138 88 118 55 Z" fill="#b45309" />
                <path d="M282 55 Q264 8 234 66 Q262 88 282 55 Z" fill="#b45309" />
                {/* body */}
                <ellipse cx="200" cy="265" rx="148" ry="175" fill="#f59e0b" />
                {/* face disc */}
                <ellipse cx="200" cy="222" rx="108" ry="100" fill="#fde68a" />
                {/* eyes */}
                <circle cx="158" cy="215" r="42" fill="#ffffff" />
                <circle cx="242" cy="215" r="42" fill="#ffffff" />
                <circle cx="158" cy="222" r="17" fill="#3b2712" />
                <circle cx="242" cy="222" r="17" fill="#3b2712" />
                <circle cx="150" cy="214" r="5" fill="#ffffff" />
                <circle cx="234" cy="214" r="5" fill="#ffffff" />
                {/* beak */}
                <path d="M190 258 L210 258 L200 280 Z" fill="#92400e" />
                {/* feet */}
                <ellipse cx="158" cy="436" rx="20" ry="11" fill="#b45309" />
                <ellipse cx="242" cy="436" rx="20" ry="11" fill="#b45309" />
            </svg>
        </div>
    );
}

export default function PracticeSessionShell({
    title, subtitle, progressLabel, paused, onTogglePause, onRedo, onBack, children,
    displayControls = true,
    watermark,
}) {
    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

    return (
        <div className="fixed inset-0 flex flex-col z-50" style={{ backgroundColor: SHELL_BG }}>
            {watermark ?? <OwlWatermark />}

            <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-4">
                    {progressLabel && <span className="text-white/50 text-xs font-semibold tabular-nums">{progressLabel}</span>}

                    {displayControls && <DisplayControls />}

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

            <div className="relative z-10 flex-1 flex flex-col min-h-0">
                {paused ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/40 text-2xl font-semibold">Paused</p>
                    </div>
                ) : children}
            </div>
        </div>
    );
}
