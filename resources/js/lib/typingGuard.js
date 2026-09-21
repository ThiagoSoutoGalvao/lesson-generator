// Nearly every activity screen registers a window-level keydown shortcut (Space = next / flip / reveal, F = fullscreen,
// P / R / V / arrows on a few). Those fired while a teacher was typing in a text box inside the same screen — the Save
// panel's name fields, the essay box — so a space was swallowed (preventDefault) and letters toggled fullscreen or
// revealed answers. Names came out as "Pastsimplevspresentperfect".
//
// One guard instead of an "is the user typing?" check in 30 handlers: while focus is in a text-entry element, this
// listener stops the event from reaching the window-level shortcut handlers. It only has to run FIRST, so it is
// imported before anything else in App.jsx; the components add their listeners later, in useEffect, at mount.
//
// It does not touch the typing itself (no preventDefault), React's own onKeyDown on the input still runs (those fire
// before the event bubbles up to window), and Escape / Tab are let through so popovers still close and focus still moves.

const NOT_TEXT = new Set(['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file', 'image']);

export function isTypingTarget(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    return el.tagName === 'INPUT' && !NOT_TEXT.has(el.type);
}

if (typeof window !== 'undefined' && !window.__auroraTypingGuard) {
    window.__auroraTypingGuard = true;
    window.addEventListener('keydown', e => {
        if (e.code === 'Escape' || e.code === 'Tab') return;
        if (isTypingTarget(e.target)) e.stopImmediatePropagation();
    });
}
