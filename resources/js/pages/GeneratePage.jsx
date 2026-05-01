import { useEffect, useState } from 'react';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';

export default function GeneratePage() {
    const [documents, setDocuments] = useState([]);
    const [documentId, setDocumentId] = useState('');
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [quiz, setQuiz] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        axios.get('/api/documents').then(({ data }) => setDocuments(data));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('loading');
        setQuiz(null);
        setErrorMsg('');

        try {
            const { data } = await axios.post('/api/generate', {
                document_id: documentId,
                prompt,
            });
            setQuiz(data);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Something went wrong. Please try again.');
            setStatus('error');
        }
    }

    if (quiz) {
        return <QuizActivity quiz={quiz} onClose={() => { setQuiz(null); setStatus('idle'); }} />;
    }

    return (
        <div className="max-w-2xl mx-auto mt-12 flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Generate an Activity</h2>
                <p className="text-gray-500 mt-1 text-sm">
                    Select a document, describe what you want, and Claude will generate it.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Course book</label>
                    <select
                        value={documentId}
                        onChange={(e) => setDocumentId(e.target.value)}
                        required
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select a document…</option>
                        {documents.map((doc) => (
                            <option key={doc.id} value={doc.id}>{doc.original_name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                        rows={4}
                        placeholder="e.g. Give me 5 multiple choice questions about vocabulary from this text"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="self-start bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                >
                    {status === 'loading' ? 'Generating…' : 'Generate'}
                </button>
            </form>

            {status === 'error' && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}
