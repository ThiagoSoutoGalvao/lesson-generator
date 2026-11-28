import { Link, useLocation } from 'react-router-dom';
import DisplayControls from '@/components/DisplayControls';
import { useIsLightUi } from '@/lib/uiTheme';

const NAV_LINKS = [
    { to: '/upload',   label: 'Materials' },
    { to: '/generate', label: 'Generate' },
    { to: '/lessons',  label: 'Lessons' },
    { to: '/library',  label: 'Library' },
    { to: '/students', label: 'Students' },
    { to: '/practice', label: 'Practice' },
];

// "Aurora Night" — the deep half of the brand gradient as the ground for every
// shell page, so the shell reads the same as the fullscreen activity screens.
const AURORA_GRADIENT = 'linear-gradient(150deg, #1A0F3D 0%, #2A1560 32%, #5A1B73 66%, #8E2160 92%, #B8433A 120%)';

// An Aurora Business screen switches the frame to the light theme (lib/uiTheme.js): light grey ground, a white
// header with the dark logo, no gradient, veil or watermark.
export default function Layout({ children }) {
    const location = useLocation();
    const light    = useIsLightUi();
    const bgStyle  = light
        ? { background: 'linear-gradient(180deg, #FBEFF3 0px, #FAF6F0 340px) #FAF6F0' } // warm paper + pink wash (2026-11-28, "B")
        : { backgroundImage: AURORA_GRADIENT, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };

    return (
        <div className="min-h-screen relative" style={bgStyle}>
            {!light && <div className="fixed inset-0 lg-shell-overlay pointer-events-none z-0" />}

            {/* Faint Aurora mark, bottom-right — a watermark, not a UI element */}
            {!light && (
                <img
                    src="/brand/aurora-symbol.png"
                    alt=""
                    aria-hidden="true"
                    className="fixed -bottom-10 -right-10 w-72 h-72 object-contain opacity-[0.06] pointer-events-none z-0 select-none"
                />
            )}

            <header className={`relative z-10 border-b px-6 py-3.5 sticky top-0 ${light ? 'bg-white border-[#E9E1D6]' : 'bg-[#160c33]/55 backdrop-blur-xl border-white/10'}`}>
                <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
                    <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
                        <img src={light ? '/brand/aurora-logo-horizontal.png' : '/brand/aurora-logo-horizontal-white.png'} alt="Aurora" className="h-10 sm:h-11 w-auto" />
                    </Link>
                    <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
                        {NAV_LINKS.map(({ to, label }) => {
                            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
                            const cls = light
                                ? (active ? 'bg-[#FDEEE7] text-[#9A3412] font-semibold' : 'text-[#4A5163] hover:text-[#271D62] hover:bg-[#F1F2F5]')
                                : (active ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10');
                            return (
                                <Link key={to} to={to} className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${cls}`}>
                                    {label}
                                </Link>
                            );
                        })}

                        {/* Shared display control — same panel as inside every activity */}
                        <DisplayControls variant="nav" className="ml-4" />

                        <form method="POST" action="/logout" className="ml-3">
                            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                            <button type="submit" className={`text-sm transition-colors cursor-pointer px-3 py-1.5 rounded-lg ${light ? 'text-[#4A5163] hover:text-[#271D62] hover:bg-[#F1F2F5]' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
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
