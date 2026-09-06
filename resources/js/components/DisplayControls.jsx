import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    useDisplay, TEXT_COLORS, SIZE_STEPS, FONTS,
    MIN_BRIGHTNESS, DEFAULT_BRIGHTNESS,
} from '@/hooks/useDisplay';

const SIZE_PREVIEW = ['text-[11px]', 'text-xs', 'text-sm', 'text-base', 'text-lg'];
const FONT_PREVIEW = {
    default: "'Inter Variable', sans-serif",
    system:  'ui-sans-serif, system-ui, sans-serif',
    poppins: "'Poppins', sans-serif",
    lexend:  "'Lexend', sans-serif",
};

// The shared text / display control. A small "Aa" trigger opens one popover
// panel (text size, colour, screen brightness, font) — the same panel from the
// navbar (`variant="nav"`) and from every activity header (`variant="activity"`).
// All of it reads/writes the persisted DisplayProvider state.
export default function DisplayControls({ variant = 'activity', className = '' }) {
    const d = useDisplay();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const [pos, setPos] = useState(null);

    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function onKey(e) { if (e.key === 'Escape') setOpen(false); }
        function onDown(e) {
            if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            setOpen(false);
        }
        window.addEventListener('keydown', onKey);
        window.addEventListener('mousedown', onDown, true);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('mousedown', onDown, true);
        };
    }, [open]);

    const nav = variant === 'nav';
    const triggerCls = nav
        ? `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-white/70 hover:text-white transition-colors cursor-pointer ${
            open ? 'bg-white/15 border-white/25' : 'bg-white/8 border-white/12'}`
        : `flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
            open ? 'text-white' : 'text-white/50 hover:text-white'}`;

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                className={triggerCls}
                title="Display settings"
                aria-expanded={open}
            >
                <span className={nav ? 'text-[13px] font-semibold leading-none' : 'text-base font-semibold leading-none'}>Aa</span>
                {d.isCustom && <span className="w-1.5 h-1.5 rounded-full bg-[#fc6840]" />}
            </button>

            {open && pos && createPortal(
                <div
                    ref={panelRef}
                    style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 2100 }}
                    className="w-72 rounded-2xl border border-white/12 bg-[#1c1540] shadow-2xl shadow-black/50 p-4 flex flex-col gap-4 text-white"
                >
                    {/* Text size */}
                    <Section label="Text size">
                        <div className="flex items-end gap-1.5">
                            {Array.from({ length: SIZE_STEPS }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => d.setSizeIdx(i)}
                                    className={`flex-1 h-9 rounded-lg border font-bold leading-none transition-colors cursor-pointer ${SIZE_PREVIEW[i]} ${
                                        d.sizeIdx === i
                                            ? 'bg-[#fc6840] border-[#fc6840] text-white'
                                            : 'bg-white/5 border-white/12 text-white/70 hover:bg-white/10'
                                    }`}
                                >A</button>
                            ))}
                        </div>
                    </Section>

                    {/* Text colour */}
                    <Section label="Text colour">
                        <div className="flex items-center gap-2.5">
                            {TEXT_COLORS.map(({ label, cls, hex }) => (
                                <button
                                    key={cls}
                                    onClick={() => d.setTextColor(cls)}
                                    title={label}
                                    className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                                        d.textColor === cls
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1540] scale-110'
                                            : 'opacity-60 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: hex }}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Screen brightness */}
                    <Section label="Screen brightness">
                        <input
                            type="range"
                            min={MIN_BRIGHTNESS}
                            max={100}
                            value={d.brightness}
                            onChange={e => d.setBrightness(Number(e.target.value))}
                            className="w-full accent-[#fc6840] cursor-pointer"
                        />
                        <p className="text-white/40 text-[11px] mt-1">
                            {d.brightness === DEFAULT_BRIGHTNESS ? 'Full — drag left to dim a harsh screen.' : `Dimmed to ${d.brightness}%`}
                        </p>
                    </Section>

                    {/* Font */}
                    <Section label="Font">
                        <div className="grid grid-cols-2 gap-1.5">
                            {FONTS.map(({ id, label }) => (
                                <button
                                    key={id}
                                    onClick={() => d.setFont(id)}
                                    style={{ fontFamily: FONT_PREVIEW[id] }}
                                    className={`h-8 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                                        d.font === id
                                            ? 'bg-[#fc6840] border-[#fc6840] text-white'
                                            : 'bg-white/5 border-white/12 text-white/70 hover:bg-white/10'
                                    }`}
                                >{label}</button>
                            ))}
                        </div>
                        <p className="text-white/40 text-[11px] mt-1">Lexend is tuned for reading — good for lower levels.</p>
                    </Section>

                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-white/35 text-[11px]">Sticks across activities &amp; sessions.</span>
                        {d.isCustom && (
                            <button onClick={d.reset} className="text-[#fc9d6a] hover:text-white text-[11px] font-semibold cursor-pointer transition-colors">
                                Reset
                            </button>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
}

function Section({ label, children }) {
    return (
        <div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">{label}</p>
            {children}
        </div>
    );
}
