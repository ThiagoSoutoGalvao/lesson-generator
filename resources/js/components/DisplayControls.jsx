import { useDisplay, TEXT_COLORS, SIZE_STEPS } from '@/hooks/useDisplay';

// The shared text-size + text-colour control. One instance lives in the navbar
// (`variant="nav"`), one in every activity/drill header (`variant="activity"`,
// the default). All instances read and write the same persisted DisplayProvider
// state, so a change in one place is reflected everywhere.
export default function DisplayControls({ variant = 'activity', className = '' }) {
    const { sizeIdx, textColor, isCustom, decSize, incSize, setTextColor, reset } = useDisplay();
    const nav = variant === 'nav';

    const stepBtn = nav
        ? 'text-white/50 hover:text-white disabled:opacity-25 text-[11px] font-bold px-1 rounded transition-colors cursor-pointer leading-none'
        : 'text-white/50 hover:text-white disabled:opacity-25 text-sm font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer';
    const dot = nav ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <div
            className={
                (nav
                    ? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 border border-white/12'
                    : 'flex items-center gap-3') + (className ? ` ${className}` : '')
            }
        >
            {nav && <span className="text-white/35 text-[10px] font-medium select-none leading-none">Aa</span>}
            {nav && <span className="w-px h-3 bg-white/20 mx-0.5" />}

            <div className="flex items-center gap-1">
                <button onClick={decSize} disabled={sizeIdx === 0} className={stepBtn} title="Smaller text">A−</button>
                <button onClick={incSize} disabled={sizeIdx === SIZE_STEPS - 1} className={stepBtn} title="Larger text">A+</button>
            </div>

            {nav && <span className="w-px h-3 bg-white/20 mx-0.5" />}

            <div className="flex items-center gap-1.5">
                {TEXT_COLORS.map(({ label, cls, hex }) => (
                    <button
                        key={cls}
                        onClick={() => setTextColor(cls)}
                        title={label}
                        className={`${dot} rounded-full transition-all cursor-pointer ${
                            textColor === cls
                                ? 'ring-2 ring-white ring-offset-1 ring-offset-black/60 scale-110'
                                : 'opacity-50 hover:opacity-90'
                        }`}
                        style={{ backgroundColor: hex }}
                    />
                ))}
            </div>

            {nav && isCustom && (
                <>
                    <span className="w-px h-3 bg-white/20 mx-0.5" />
                    <button
                        onClick={reset}
                        className="text-white/35 hover:text-white text-[10px] cursor-pointer transition-colors leading-none"
                        title="Reset text size and colour"
                    >✕</button>
                </>
            )}
        </div>
    );
}
