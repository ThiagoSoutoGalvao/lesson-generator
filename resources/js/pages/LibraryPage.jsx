import { useEffect, useState } from 'react';
import axios from 'axios';
import QuizActivity from '@/components/QuizActivity';
import FlashcardActivity from '@/components/FlashcardActivity';
import UnjumbleActivity from '@/components/UnjumbleActivity';
import Spinner from '@/components/Spinner';

const TYPE_LABELS = { quiz: 'Quiz', flashcards: 'Flashcards', unjumble: 'Unjumble' };
const TYPE_COLORS = {
    quiz:       'bg-blue-500/80 text-white',
    flashcards: 'bg-purple-500/80 text-white',
    unjumble:   'bg-orange-500/80 text-white',
};
const FILTERS = ['all', 'quiz', 'flashcards', 'unjumble'];

export default function LibraryPage() {
    const [activities, setActivities] = useState([]);
    const [filter, setFilter] = useState('all');
    const [launched, setLaunched] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageBg, setPageBg] = useState(null);

    useEffect(() => {
        axios.get('/api/background', { params: { topic: 'learning English' } })
            .then(({ data }) => setPageBg(data.url))
            .catch(() => null);
    }, []);

    useEffect(() => {
        axios.get('/api/activities')
            .then(({ data }) => setActivities(data))
            .catch(err => {
                setError(err.response?.data?.message ?? err.message ?? 'Failed to load activities');
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleDelete(id) {
        if (!confirm('Delete this activity?')) return;
        try {
            await axios.delete(`/api/activities/${id}`);
            setActivities(prev => prev.filter(a => a.id !== id));
        } catch {
            alert('Could not delete the activity. Please try again.');
        }
    }

    function handleClose() {
        setLaunched(null);
    }

    if (launched) {
        if (launched.type === 'quiz') {
            return <QuizActivity quiz={launched} onClose={handleClose} />;
        }
        if (launched.type === 'flashcards') {
            return <FlashcardActivity activity={launched} onClose={handleClose} />;
        }
        if (launched.type === 'unjumble') {
            return <UnjumbleActivity activity={launched} onClose={handleClose} />;
        }
    }

    const filtered = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const pageStyle = pageBg
        ? { backgroundImage: `url(${pageBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)' };

    return (
        <div className="relative -mx-6 -my-8" style={pageStyle}>
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 px-6 py-8 flex flex-col gap-6 min-h-screen">
                <div>
                    <h2 className="text-3xl font-bold text-white">Activity Library</h2>
                    <p className="text-white/60 mt-1 text-sm">
                        Your saved activities — relaunch them any time.
                    </p>
                </div>

                <div className="flex rounded-lg border border-white/20 overflow-hidden w-fit">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2 text-sm font-medium transition-colors capitalize cursor-pointer ${
                                filter === f
                                    ? 'bg-white text-gray-900'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            {f === 'all' ? 'All' : TYPE_LABELS[f]}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex justify-center py-12">
                        <Spinner message="Loading activities…" color="text-white/70" textColor="text-white/50" />
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-900/40 border border-red-400/30 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center py-20 text-white/40">
                        <p className="text-lg">No saved activities yet.</p>
                        <p className="text-sm mt-1">Generate an activity and click Save to add it here.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(a => (
                        <div
                            key={a.id}
                            className="bg-white/5 backdrop-blur-none border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-white leading-snug">{a.name}</h3>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${TYPE_COLORS[a.type]}`}>
                                    {TYPE_LABELS[a.type]}
                                </span>
                            </div>
                            {a.tags && (
                                <p className="text-xs text-white/60">{a.tags}</p>
                            )}
                            <p className="text-xs text-white/50 mt-auto">
                                {new Date(a.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </p>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setLaunched(a.content)}
                                    className="flex-1 bg-white hover:bg-white/90 text-gray-900 text-sm font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                    Launch
                                </button>
                                <button
                                    onClick={() => handleDelete(a.id)}
                                    className="bg-white/20 hover:bg-red-500/60 text-white text-sm px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
