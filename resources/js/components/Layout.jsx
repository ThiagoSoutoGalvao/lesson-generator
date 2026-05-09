import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
    { to: '/upload',   label: 'Upload' },
    { to: '/generate', label: 'Generate' },
    { to: '/library',  label: 'Library' },
];

const PAGE_BACKGROUNDS = {
    '/':         '/backgrounds/pic1.jpg',
    '/upload':   '/backgrounds/upload.jpg',
    '/generate': '/backgrounds/generate.jpg',
    '/library':  '/backgrounds/pic4.jpg',
};

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
    const bgUrl    = PAGE_BACKGROUNDS[location.pathname] ?? '/backgrounds/pic5.jpg';
    const bgStyle  = { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };

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
            <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

            <header className="relative z-10 bg-black/15 backdrop-blur-xl border-b border-white/8 px-6 py-4 sticky top-0">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to="/" className="text-xl font-semibold text-white hover:text-white/80 transition-colors">
                        Lesson Generator
                    </Link>
                    <nav className="flex items-center gap-1 text-sm">
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
