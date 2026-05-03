import { Link } from 'react-router-dom';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                        Lesson Generator
                    </Link>
                    <nav className="flex items-center gap-6 text-sm text-gray-500">
                        <Link to="/upload" className="hover:text-gray-900">Upload PDF</Link>
                        <Link to="/generate" className="hover:text-gray-900">Generate</Link>
                        <Link to="/library" className="hover:text-gray-900">Library</Link>
                        <form method="POST" action="/logout">
                            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                            <button type="submit" className="hover:text-gray-900 cursor-pointer">Log out</button>
                        </form>
                    </nav>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
