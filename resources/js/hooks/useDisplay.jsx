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

// rem values the shell pages (forms / lists under <main>) scale to, one per
// size index — applied via the --tf-* CSS vars + body.tf-active in app.css.
const SHELL_REM = ['0.9rem', '1rem', '1.15rem', '1.4rem', '1.7rem'];

const STORAGE_KEY = 'aurora.display';

function load() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const sizeIdx = Number.isInteger(raw.sizeIdx) && raw.sizeIdx >= 0 && raw.sizeIdx < SIZE_STEPS
            ? raw.sizeIdx : DEFAULT_SIZE_IDX;
        const textColor = TEXT_COLORS.some(c => c.cls === raw.textColor)
            ? raw.textColor : DEFAULT_TEXT_COLOR;
        return { sizeIdx, textColor };
    } catch {
        return { sizeIdx: DEFAULT_SIZE_IDX, textColor: DEFAULT_TEXT_COLOR };
    }
}

const DisplayContext = createContext(null);

export function DisplayProvider({ children }) {
    const [{ sizeIdx, textColor }, setState] = useState(load);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ sizeIdx, textColor }));
        } catch { /* private mode / disabled storage — setting just won't persist */ }

        // Drive the shell-page text scaling (see body.tf-active rules in app.css).
        const root = document.documentElement;
        const custom = sizeIdx !== DEFAULT_SIZE_IDX || textColor !== DEFAULT_TEXT_COLOR;
        if (custom) {
            const hex = TEXT_COLORS.find(c => c.cls === textColor)?.hex ?? '#ffffff';
            root.style.setProperty('--tf-family', 'Inter Variable, sans-serif');
            root.style.setProperty('--tf-size', SHELL_REM[sizeIdx]);
            root.style.setProperty('--tf-color', hex);
            document.body.classList.add('tf-active');
        } else {
            document.body.classList.remove('tf-active');
            root.style.removeProperty('--tf-family');
            root.style.removeProperty('--tf-size');
            root.style.removeProperty('--tf-color');
        }
    }, [sizeIdx, textColor]);

    const value = useMemo(() => ({
        sizeIdx,
        textColor,
        textColorHex: TEXT_COLORS.find(c => c.cls === textColor)?.hex ?? '#ffffff',
        isCustom: sizeIdx !== DEFAULT_SIZE_IDX || textColor !== DEFAULT_TEXT_COLOR,
        setSizeIdx: (i) => setState(s => ({ ...s, sizeIdx: Math.max(0, Math.min(SIZE_STEPS - 1, i)) })),
        decSize:    () => setState(s => ({ ...s, sizeIdx: Math.max(0, s.sizeIdx - 1) })),
        incSize:    () => setState(s => ({ ...s, sizeIdx: Math.min(SIZE_STEPS - 1, s.sizeIdx + 1) })),
        setTextColor: (cls) => setState(s => ({ ...s, textColor: cls })),
        reset: () => setState({ sizeIdx: DEFAULT_SIZE_IDX, textColor: DEFAULT_TEXT_COLOR }),
    }), [sizeIdx, textColor]);

    return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay() {
    const ctx = useContext(DisplayContext);
    if (!ctx) throw new Error('useDisplay must be used within <DisplayProvider>');
    return ctx;
}
