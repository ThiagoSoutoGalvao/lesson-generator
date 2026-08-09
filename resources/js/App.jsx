import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import UploadPage from '@/pages/UploadPage';
import GeneratePage from '@/pages/GeneratePage';
import LibraryPage from '@/pages/LibraryPage';
import PronunciationChartPage from '@/pages/PronunciationChartPage';
import PronunciationDrillPage from '@/pages/PronunciationDrillPage';
import DetPracticePage from '@/pages/DetPracticePage';
import CambridgePracticePage from '@/pages/CambridgePracticePage';

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
                        <Route path="/pronunciation" element={<PronunciationChartPage />} />
                        <Route path="/pronunciation/drill/:type" element={<PronunciationDrillPage />} />
                        <Route path="/det/practice/:type" element={<DetPracticePage />} />
                        <Route path="/cambridge/practice/:type" element={<CambridgePracticePage />} />
                    </Routes>
                </Layout>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('app')).render(<App />);
