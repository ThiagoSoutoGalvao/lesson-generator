import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
    { to: '/upload',   label: 'Upload' },
    { to: '/generate', label: 'Generate' },
    { to: '/library',  label: 'Library' },
];

const PAGE_BACKGROUNDS = {
    '/':         '/backgrounds/pic1.jpg',
    '/upload':   '/backgrounds/pic2.jpg',
    '/generate': '/backgrounds/pic3.jpg',
    '/library':  '/backgrounds/pic4.jpg',
};

export default function Layout({ children }) {
    const location = useLocation();

    const bgUrl = PAGE_BACKGROUNDS[location.pathname] ?? '/backgrounds/pic5.jpg';
    const bgStyle = { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };

    return (
        <div className="min-h-screen relative" style={bgStyle}>
            <div className="fixed inset-0 bg-black/55 pointer-events-none z-0" />

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
                        <form method="POST" action="/logout" className="ml-4">
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
