import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// The standard text-colour palette, shared by every activity and the navbar
// control. `cls` is the Tailwind class the activity applies to its text;
// `hex` is the same colour for the shell CSS-var mechanism and the swatch dot.
export const TEXT_COLORS = [
    { label: 'White',  cls: 'text-white',      hex: '#ffffff' },
    { label: 'Yellow', cls: 'text-yellow-300', hex: '#fde047' },
    { label: 'Orange', cls: 'text-orange-400', hex: '#fb923c' },
    { label: 'Red',    cls: 'text-red-400',    hex: '#f87171' },
    { label: 'Cyan',   cls: 'text-cyan-300',   hex: '#67e8f9' },
];

export const SIZE_STEPS = 5;          // indices 0..4
export const DEFAULT_SIZE_IDX = 2;
export const DEFAULT_TEXT_COLOR = 'text-white';

export const MIN_BRIGHTNESS = 50;
export const DEFAULT_BRIGHTNESS = 100;

// `data-app-font` on <html> drives the font-family rules in app.css.
export const FONTS = [
    { id: 'default', label: 'Default' },   // Inter — the app's normal face
    { id: 'system',  label: 'System' },
    { id: 'poppins', label: 'Poppins' },
    { id: 'lexend',  label: 'Lexend' },     // reading-tuned, good for lower levels
];
export const DEFAULT_FONT = 'default';

// rem values the shell pages (forms / lists under <main>) scale to, one per
// size index — applied via the --tf-* CSS vars + body.tf-active in app.css.
const SHELL_REM = ['0.9rem', '1rem', '1.15rem', '1.4rem', '1.7rem'];

const STORAGE_KEY = 'aurora.display';

const DEFAULTS = {
    sizeIdx: DEFAULT_SIZE_IDX,
    textColor: DEFAULT_TEXT_COLOR,
    brightness: DEFAULT_BRIGHTNESS,
    font: DEFAULT_FONT,
};

function load() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return {
            sizeIdx: Number.isInteger(raw.sizeIdx) && raw.sizeIdx >= 0 && raw.sizeIdx < SIZE_STEPS
                ? raw.sizeIdx : DEFAULT_SIZE_IDX,
            textColor: TEXT_COLORS.some(c => c.cls === raw.textColor)
                ? raw.textColor : DEFAULT_TEXT_COLOR,
            brightness: Number.isFinite(raw.brightness) && raw.brightness >= MIN_BRIGHTNESS && raw.brightness <= 100
                ? Math.round(raw.brightness) : DEFAULT_BRIGHTNESS,
            font: FONTS.some(f => f.id === raw.font) ? raw.font : DEFAULT_FONT,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

const DisplayContext = createContext(null);

export function DisplayProvider({ children }) {
    const [state, setState] = useState(load);
    const { sizeIdx, textColor, brightness, font } = state;

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch { /* private mode / disabled storage — setting just won't persist */ }

        const root = document.documentElement;

        // Shell-page text scaling (see body.tf-active rules in app.css).
        const textCustom = sizeIdx !== DEFAULT_SIZE_IDX || textColor !== DEFAULT_TEXT_COLOR;
        if (textCustom) {
            const hex = TEXT_COLORS.find(c => c.cls === textColor)?.hex ?? '#ffffff';
            root.style.setProperty('--tf-size', SHELL_REM[sizeIdx]);
            root.style.setProperty('--tf-color', hex);
            document.body.classList.add('tf-active');
        } else {
            document.body.classList.remove('tf-active');
            root.style.removeProperty('--tf-size');
            root.style.removeProperty('--tf-color');
        }

        // Font choice — `data-app-font` on <html>, rules in app.css.
        if (font && font !== DEFAULT_FONT) root.dataset.appFont = font;
        else delete root.dataset.appFont;
    }, [state, sizeIdx, textColor, font]);

    const value = useMemo(() => ({
        sizeIdx,
        textColor,
        textColorHex: TEXT_COLORS.find(c => c.cls === textColor)?.hex ?? '#ffffff',
        brightness,
        font,
        isCustom: sizeIdx !== DEFAULT_SIZE_IDX || textColor !== DEFAULT_TEXT_COLOR
            || brightness !== DEFAULT_BRIGHTNESS || font !== DEFAULT_FONT,
        setSizeIdx: (i) => setState(s => ({ ...s, sizeIdx: Math.max(0, Math.min(SIZE_STEPS - 1, i)) })),
        decSize:    () => setState(s => ({ ...s, sizeIdx: Math.max(0, s.sizeIdx - 1) })),
        incSize:    () => setState(s => ({ ...s, sizeIdx: Math.min(SIZE_STEPS - 1, s.sizeIdx + 1) })),
        setTextColor: (cls) => setState(s => ({ ...s, textColor: cls })),
        setBrightness: (n) => setState(s => ({ ...s, brightness: Math.max(MIN_BRIGHTNESS, Math.min(100, Math.round(n))) })),
        setFont: (id) => setState(s => ({ ...s, font: FONTS.some(f => f.id === id) ? id : DEFAULT_FONT })),
        reset: () => setState({ ...DEFAULTS }),
    }), [sizeIdx, textColor, brightness, font]);

    // Dimming overlay — a black veil above everything (activities are z-50), used
    // to take the edge off a harsh screen. pointer-events-none so it never blocks
    // interaction; the Display panel portals above it so it stays crisp.
    const dim = (100 - brightness) / 100;

    return (
        <DisplayContext.Provider value={value}>
            {children}
            {dim > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'fixed', inset: 0, background: '#000',
                        opacity: dim, pointerEvents: 'none', zIndex: 2000,
                    }}
                />
            )}
        </DisplayContext.Provider>
    );
}

export function useDisplay() {
    const ctx = useContext(DisplayContext);
    if (!ctx) throw new Error('useDisplay must be used within <DisplayProvider>');
    return ctx;
}
