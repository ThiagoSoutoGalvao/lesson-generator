import { useEffect, useState } from 'react';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';
import FlashcardActivity from '@/components/FlashcardActivity';

const ACTIVITY_TYPES = [
    { value: 'quiz',       label: 'Quiz' },
    { value: 'flashcards', label: 'Flashcards' },
];

export default function GeneratePage() {
    const [documents, setDocuments] = useState([]);
    const [documentId, setDocumentId] = useState('');
    const [activityType, setActivityType] = useState('quiz');
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [activity, setActivity] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        axios.get('/api/documents').then(({ data }) => setDocuments(data));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('loading');
        setActivity(null);
        setErrorMsg('');

        try {
            const { data } = await axios.post('/api/generate', {
                document_id: documentId,
                prompt,
                type: activityType,
            });
            setActivity(data);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Something went wrong. Please try again.');
            setStatus('error');
        }
    }

    function handleClose() {
        setActivity(null);
        setStatus('idle');
    }

    if (activity?.type === 'quiz') {
        return <QuizActivity quiz={activity} onClose={handleClose} />;
    }

    if (activity?.type === 'flashcards') {
        return <FlashcardActivity activity={activity} onClose={handleClose} />;
    }

    return (
        <div className="max-w-2xl mx-auto mt-12 flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Generate an Activity</h2>
                <p className="text-gray-500 mt-1 text-sm">
                    Select a document, choose an activity type, and describe what you want.
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
                    <label className="text-sm font-medium text-gray-700">Activity type</label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
                        {ACTIVITY_TYPES.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={(e) => { e.preventDefault(); setActivityType(value); }}
                                className={`px-5 py-2 text-sm font-medium transition-colors ${
                                    activityType === value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                        rows={4}
                        placeholder={
                            activityType === 'quiz'
                                ? 'e.g. Give me 5 multiple choice questions about vocabulary from this text'
                                : 'e.g. Create 8 flashcards for the key vocabulary words in this text'
                        }
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
