import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import UploadPage from '@/pages/UploadPage';
import GeneratePage from '@/pages/GeneratePage';

function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h1 className="text-4xl font-bold text-gray-900">Lesson Generator</h1>
            <p className="text-lg text-gray-500">AI-powered activities for English teachers</p>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/generate" element={<GeneratePage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('app')).render(<App />);
