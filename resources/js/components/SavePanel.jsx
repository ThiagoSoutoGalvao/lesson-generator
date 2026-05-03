import { useEffect, useState } from 'react';
import axios from 'axios';

const fieldCls = 'bg-white/10 border border-white/20 text-white placeholder:text-white/35 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';

export default function SavePanel({ activity, onDone }) {
    const [name, setName]       = useState('');
    const [book, setBook]       = useState('');
    const [lesson, setLesson]   = useState('');
    const [folder, setFolder]   = useState('');
    const [folders, setFolders] = useState([]);
    const [status, setStatus]   = useState('idle');

    useEffect(() => {
        axios.get('/api/folders')
            .then(({ data }) => setFolders(data))
            .catch(() => null);
    }, []);

    async function handleSave(e) {
        e.preventDefault();
        setStatus('saving');
        try {
            await axios.post('/api/activities', {
                name,
                type:    activity.type,
                content: activity,
                book:    book.trim()   || null,
                lesson:  lesson.trim() || null,
                folder:  folder.trim() || null,
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
                    placeholder="Activity name (e.g. Travel vocabulary quiz)"
                    className={fieldCls}
                />

                <div className="grid grid-cols-2 gap-2">
                    <input
                        value={book}
                        onChange={e => setBook(e.target.value)}
                        placeholder="Book (e.g. Speak Out B2)"
                        className={fieldCls}
                    />
                    <input
                        value={lesson}
                        onChange={e => setLesson(e.target.value)}
                        placeholder="Lesson (e.g. Unit 3)"
                        className={fieldCls}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <input
                        value={folder}
                        onChange={e => setFolder(e.target.value)}
                        list="folder-list"
                        placeholder="Folder (optional)"
                        className={fieldCls}
                    />
                    <datalist id="folder-list">
                        {folders.map(f => <option key={f} value={f} />)}
                    </datalist>
                    <p className="text-white/30 text-xs px-1">Type a new name to create a folder, or pick an existing one.</p>
                </div>

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
