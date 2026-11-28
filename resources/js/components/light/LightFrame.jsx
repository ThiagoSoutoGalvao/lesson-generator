import DisplayControls from '@/components/DisplayControls';

// The shared pieces of a light-theme (Aurora Business) activity screen, from the approved mockup
// (docs/aurora-business/mockup/, AuroraBusiness.md §4): a white header bar, a light grey ground, solid white cards,
// photos in their own panel — never behind text — and one coral accent. A template draws its own content inside.

export const LIGHT = {
    ink: 'text-[#271D62]',
    muted: 'text-[#4A5163]',
    card: 'bg-white border border-[#E9E1D6] rounded-2xl',
    // "B · Mais quente" (2026-11-28): the listening's soft glow, for highlights only (a score, a result) — never behind
    // running text — and a glow chip for a card's small label (the question label).
    glowCard: 'bg-[linear-gradient(135deg,#F6E3F2_0%,#FBE6EC_50%,#FDE9DF_100%)] border border-[#EBCFE3] rounded-2xl shadow-[0_10px_30px_-18px_rgba(160,40,110,0.35)]',
    chipCenter: 'self-center inline-block rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9A3412] bg-[linear-gradient(135deg,#F6E3F2_0%,#FBE6EC_50%,#FDE9DF_100%)] border border-[#EBCFE3]',
    chip: 'self-start inline-block rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9A3412] bg-[linear-gradient(135deg,#F6E3F2_0%,#FBE6EC_50%,#FDE9DF_100%)] border border-[#EBCFE3]',
    eyebrow: 'text-[13px] sm:text-[15px] font-semibold text-[#4A5163] uppercase tracking-[0.05em]',
    primary: 'h-12 sm:h-14 px-7 sm:px-8 rounded-xl bg-[#E0521F] hover:bg-[#C9461A] text-white font-semibold text-[17px] sm:text-[19px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'h-12 sm:h-14 px-6 rounded-xl bg-white border border-[#E9E1D6] hover:bg-[#F1F2F5] text-[#271D62] font-semibold text-[17px] sm:text-[18px] cursor-pointer',
    iconBtn: 'h-11 min-w-11 px-3 grid place-items-center rounded-[10px] border border-[#E9E1D6] bg-white text-[#271D62] hover:bg-[#F1F2F5] cursor-pointer text-[15px] font-semibold',
    // Right / wrong answer treatments: the colour plus a heavier border, so they read without colour too.
    right: 'border-2 border-[#1E7A4C] bg-[#E5F4EC] font-semibold',
    wrong: 'border-2 border-[#B42318] bg-[#FDECEA] font-semibold',
    rightChip: 'bg-[#1E7A4C] text-white',
    wrongChip: 'bg-[#B42318] text-white',
};

/**
 * The whole screen: header + scrolling body.
 *   eyebrow / title  the two header lines ("Quiz" / the topic)
 *   extra            header items before the standard buttons (progress, score…)
 *   onSave           shows a Save button (omit for students)
 *   ground           another page colour (the reading's plain warm paper, #FAF6F0); default = paper with a pink wash
 */
const WASH = 'linear-gradient(180deg, #FBEFF3 0px, #FAF6F0 340px) #FAF6F0';
export function LightFrame({ eyebrow, title, extra, onSave, isFullscreen, onFullscreen, onClose, children, overlay, ground }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F6F7F9] text-[#271D62]" style={{ background: ground ?? WASH }} data-ui-screen="light">
            {overlay}
            <header className="shrink-0 bg-white border-b border-[#E9E1D6] flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-8 py-3 sm:min-h-[72px]">
                {/* the logo with the listening's soft glow behind it */}
                <span className="hidden sm:grid place-items-center w-11 h-11 rounded-full bg-[radial-gradient(circle,#FBE6EC_0%,#F6E3F2_55%,rgba(246,227,242,0)_72%)]" aria-hidden="true">
                    <img src="/brand/aurora-symbol.png" alt="" className="w-8 h-8 object-contain" />
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                    {eyebrow && <span className="text-[12px] sm:text-[13px] font-semibold text-[#4A5163] tracking-[0.04em] uppercase truncate">{eyebrow}</span>}
                    {title && <span className="font-display text-[16px] sm:text-[19px] font-semibold truncate">{title}</span>}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    {extra}
                    <DisplayControls light colors={false} />
                    {onSave && <button type="button" onClick={onSave} className={LIGHT.iconBtn}>Save</button>}
                    {onFullscreen && (
                        <button type="button" onClick={onFullscreen} className={`${LIGHT.iconBtn} hidden sm:grid`} aria-label={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'} title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
                            {isFullscreen ? '⊡' : '⛶'}
                        </button>
                    )}
                    {onClose && (
                        <button type="button" onClick={onClose} className={LIGHT.iconBtn} aria-label="Close">
                            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                        </button>
                    )}
                </div>
            </header>
            {/* Scrolls on its own; nothing is centred on the scroll axis (Claude.md §8, the overflow trap). */}
            <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
        </div>
    );
}

/** A progress bar + "Question 2 of 6". */
export function LightProgress({ index, total, label = 'Question' }) {
    const pct = total ? Math.round((index / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-[14px] sm:text-[16px] text-[#4A5163] font-medium whitespace-nowrap">{label} {Math.min(index + 1, total)} of {total}</span>
            <div className="hidden sm:block w-40 h-2 rounded bg-[#E6E9EE] overflow-hidden" aria-hidden="true">
                <div className="h-2 bg-[linear-gradient(90deg,#B8408F,#E0521F)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/** The photo, in its own panel. No photo (offline, or none found) → a quiet grey panel, never a broken image. */
export function LightPhoto({ url, alt = '', className = '' }) {
    return (
        <div className={`relative rounded-2xl overflow-hidden border border-[#E9E1D6] bg-[#EDE6DB] ${className}`}>
            {/* absolute: the photo never sets the panel's height, so a panel can grow to fill a column */}
            {url ? <img src={url} alt={alt} className="absolute inset-0 w-full h-full object-cover" /> : null}
        </div>
    );
}
