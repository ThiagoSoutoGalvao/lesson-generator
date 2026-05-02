import { useState } from 'react';
import axios from 'axios';

export default function SavePanel({ activity, onDone }) {
    const [name, setName] = useState('');
    const [tags, setTags] = useState('');
    const [status, setStatus] = useState('idle');

    async function handleSave(e) {
        e.preventDefault();
        setStatus('saving');
        try {
            await axios.post('/api/activities', {
                name,
                type: activity.type,
                content: activity,
                tags: tags.trim() || null,
            });
            setStatus('saved');
            setTimeout(onDone, 1200);
        } catch {
            setStatus('error');
        }
    }

    if (status === 'saved') {
        return (
            <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-6">
                <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                    ✓ Activity saved!
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-4 px-4">
            <form
                onSubmit={handleSave}
                className="bg-gray-900/95 backdrop-blur border border-white/20 rounded-2xl px-6 py-5 shadow-2xl flex flex-col gap-3 w-full max-w-md"
            >
                <p className="text-white font-semibold text-sm">Save this activity</p>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                    placeholder="Name (e.g. Unit 3 – Travel vocabulary)"
                    className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Tags (optional, e.g. Unit 3, Travel)"
                    className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {status === 'error' && (
                    <p className="text-red-400 text-xs">Failed to save. Please try again.</p>
                )}
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onDone}
                        className="text-white/60 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={status === 'saving'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400/40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                        {status === 'saving' ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}
