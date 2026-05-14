import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import UploadPage from '@/pages/UploadPage';
import GeneratePage from '@/pages/GeneratePage';
import LibraryPage from '@/pages/LibraryPage';

function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h1 className="text-6xl font-bold text-white">Lesson Generator</h1>
            <p className="text-2xl text-white/80">AI-powered activities for English teachers</p>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/upload" element={<UploadPage />} />
                        <Route path="/generate" element={<GeneratePage />} />
                        <Route path="/library" element={<LibraryPage />} />
                    </Routes>
                </Layout>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('app')).render(<App />);
