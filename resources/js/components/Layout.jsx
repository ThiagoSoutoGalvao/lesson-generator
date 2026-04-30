export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <span className="text-xl font-semibold text-gray-900">Lesson Generator</span>
                    <nav className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900">Library</a>
                        <a href="#" className="hover:text-gray-900">New Activity</a>
                    </nav>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
