import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import Layout from '@/components/Layout';

function App() {
    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-4xl font-bold text-gray-900">Lesson Generator</h1>
                <p className="text-lg text-gray-500">AI-powered activities for English teachers</p>
            </div>
        </Layout>
    );
}

createRoot(document.getElementById('app')).render(<App />);
