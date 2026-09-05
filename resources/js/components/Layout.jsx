import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
    { to: '/upload',   label: 'Upload' },
    { to: '/generate', label: 'Generate' },
    { to: '/library',  label: 'Library' },
];

// "Aurora Night" — the deep half of the brand gradient as the ground for every
// shell page, so the shell reads the same as the fullscreen activity screens.
const AURORA_GRADIENT = 'linear-gradient(150deg, #1A0F3D 0%, #2A1560 32%, #5A1B73 66%, #8E2160 92%, #B8433A 120%)';

const FONT_SIZES = [
    { value: '1rem'     },
    { value: '1.25rem'  },
    { value: '1.5rem'   },
    { value: '1.875rem' },
];

const COLORS = [
    { value: '#ffffff', title: 'White'  },
    { value: '#fef9c3', title: 'Cream'  },
    { value: '#fde047', title: 'Yellow' },
    { value: '#fb923c', title: 'Orange' },
    { value: '#86efac', title: 'Green'  },
    { value: '#7dd3fc', title: 'Sky'    },
    { value: '#d8b4fe', title: 'Purple' },
];

export default function Layout({ children }) {
    const location = useLocation();
    const [sizeIdx, setSizeIdx]       = useState(null);
    const [activeColor, setActiveColor] = useState(null);

    const isActive = sizeIdx !== null || activeColor !== null;
    const bgStyle  = { backgroundImage: AURORA_GRADIENT, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };

    useEffect(() => {
        const r = document.documentElement;
        if (isActive) {
            r.style.setProperty('--tf-family', 'Inter Variable, sans-serif');
            r.style.setProperty('--tf-size',   sizeIdx !== null ? FONT_SIZES[sizeIdx].value : '1.5rem');
            r.style.setProperty('--tf-color',  activeColor ?? '#ffffff');
            document.body.classList.add('tf-active');
        } else {
            document.body.classList.remove('tf-active');
            r.style.removeProperty('--tf-family');
            r.style.removeProperty('--tf-size');
            r.style.removeProperty('--tf-color');
        }
    }, [sizeIdx, activeColor]);

    const handleSizeUp   = () => setSizeIdx(p => p === null ? 2 : Math.min(FONT_SIZES.length - 1, p + 1));
    const handleSizeDown = () => setSizeIdx(p => p === null ? 1 : Math.max(0, p - 1));

    return (
        <div className="min-h-screen relative" style={bgStyle}>
            <div className="fixed inset-0 lg-shell-overlay pointer-events-none z-0" />

            {/* Faint Aurora mark, bottom-right — a watermark, not a UI element */}
            <img
                src="/brand/aurora-symbol.png"
                alt=""
                aria-hidden="true"
                className="fixed -bottom-10 -right-10 w-72 h-72 object-contain opacity-[0.06] pointer-events-none z-0 select-none"
            />

            <header className="relative z-10 bg-[#160c33]/55 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 sticky top-0">
                <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
                    <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
                        <img src="/brand/aurora-logo-horizontal-white.png" alt="Aurora" className="h-10 sm:h-11 w-auto" />
                    </Link>
                    <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
                        {NAV_LINKS.map(({ to, label }) => {
                            const active = location.pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                                        active
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}

                        {/* Accessibility font control */}
                        <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1.5 rounded-lg bg-white/8 border border-white/12">
                            <span className="text-white/35 text-[10px] font-medium select-none leading-none">Aa</span>
                            <div className="w-px h-3 bg-white/20 mx-0.5" />
                            <button
                                onClick={handleSizeDown}
                                disabled={sizeIdx === 0}
                                className="text-white/50 hover:text-white disabled:opacity-25 text-[11px] font-bold px-1 rounded transition-colors cursor-pointer leading-none"
                                title="Smaller text"
                            >A−</button>
                            <button
                                onClick={handleSizeUp}
                                disabled={sizeIdx === FONT_SIZES.length - 1}
                                className="text-white/50 hover:text-white disabled:opacity-25 text-[11px] font-bold px-1 rounded transition-colors cursor-pointer leading-none"
                                title="Larger text"
                            >A+</button>
                            <div className="w-px h-3 bg-white/20 mx-0.5" />
                            {COLORS.map(({ value, title }) => (
                                <button
                                    key={value}
                                    onClick={() => setActiveColor(c => c === value ? null : value)}
                                    title={title}
                                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                                        activeColor === value
                                            ? 'scale-125 outline outline-1 outline-white outline-offset-1'
                                            : 'opacity-60 hover:opacity-100 hover:scale-110'
                                    }`}
                                    style={{ background: value }}
                                />
                            ))}
                            {isActive && (
                                <>
                                    <div className="w-px h-3 bg-white/20 mx-0.5" />
                                    <button
                                        onClick={() => { setSizeIdx(null); setActiveColor(null); }}
                                        className="text-white/35 hover:text-white text-[10px] cursor-pointer transition-colors leading-none"
                                        title="Reset font"
                                    >✕</button>
                                </>
                            )}
                        </div>

                        <form method="POST" action="/logout" className="ml-3">
                            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                            <button type="submit" className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/10">
                                Log out
                            </button>
                        </form>
                    </nav>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
