import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DisplayProvider } from '@/hooks/useDisplay';
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
            <img src="/brand/aurora-logo-horizontal-white.png" alt="Aurora" className="h-20 w-auto" />
            <p className="font-display text-2xl font-semibold text-white/85 lg-shell-text">AI-powered activities for English teachers</p>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
          <DisplayProvider>
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
          </DisplayProvider>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('app')).render(<App />);
