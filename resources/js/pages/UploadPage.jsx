import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '@/components/Spinner';

// ─── Presentation Tab ─────────────────────────────────────────────────────────

const SLIDE_OPTIONS = [4, 5, 6, 7, 8, 10];

function PresentationGenerator() {
    const navigate = useNavigate();
    const [topic, setTopic]       = useState('');
    const [extra, setExtra]       = useState('');
    const [slides, setSlides]     = useState(6);
    const [status, setStatus]     = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    async function generate() {
        if (!topic.trim()) return;
        setStatus('loading');
        setErrorMsg('');
        try {
            const { data } = await axios.post('/api/presentation/generate', {
                topic:  topic.trim(),
                extra:  extra.trim() || undefined,
                slides,
            });
            navigate('/generate', { state: { activity: data } });
        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Something went wrong. Please try again.');
            setStatus('error');
        }
    }

    const inputCls = 'w-full lg-chip border rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Topic</label>
                <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generate()}
                    placeholder="e.g. Present Perfect, Travel vocabulary, IELTS writing tips…"
                    className={inputCls}
                    disabled={status === 'loading'}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">
                    Extra instructions
                    <span className="text-white/35 font-normal ml-1">— optional</span>
                </label>
                <textarea
                    value={extra}
                    onChange={e => setExtra(e.target.value)}
                    placeholder="e.g. Focus on common mistakes, include exam tips, suitable for business English…"
                    rows={5}
                    className={`${inputCls} resize-y`}
                    disabled={status === 'loading'}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Number of slides</label>
                <div className="flex gap-2 flex-wrap">
                    {SLIDE_OPTIONS.map(n => (
                        <button
                            key={n}
                            onClick={() => setSlides(n)}
                            disabled={status === 'loading'}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                                slides === n
                                    ? 'bg-indigo-500 border-indigo-400 text-white'
                                    : 'lg-chip lg-chip-hover border text-white/70 hover:text-white'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={generate}
                disabled={!topic.trim() || status === 'loading'}
                className="self-start bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
                Generate Presentation
            </button>

            {status === 'loading' && (
                <div className="flex justify-center py-6">
                    <Spinner message="Building your presentation… this takes about 20 seconds" color="text-indigo-400" textColor="text-white/60" />
                </div>
            )}

            {status === 'error' && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-300">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}

// ─── Reading Text Tab ─────────────────────────────────────────────────────────

const PARAGRAPH_OPTIONS = [1, 2, 3, 4, 5, 6];

function ReadingTextGenerator() {
    const navigate = useNavigate();
    const [topic, setTopic]           = useState('');
    const [vocabulary, setVocabulary] = useState('');
    const [extra, setExtra]           = useState('');
    const [paragraphs, setParagraphs] = useState(3);
    const [status, setStatus]         = useState('idle');
    const [errorMsg, setErrorMsg]     = useState('');

    async function generate() {
        if (!topic.trim()) return;
        setStatus('loading');
        setErrorMsg('');
        try {
            const { data } = await axios.post('/api/reading/generate', {
                topic:      topic.trim(),
                vocabulary: vocabulary.trim() || undefined,
                extra:      extra.trim() || undefined,
                paragraphs,
            });
            navigate('/generate', { state: { activity: data } });
        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Something went wrong. Please try again.');
            setStatus('error');
        }
    }

    const inputCls = 'w-full lg-chip border rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Topic</label>
                <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generate()}
                    placeholder="e.g. City life vs country life, A trip to Japan, Climate change…"
                    className={inputCls}
                    disabled={status === 'loading'}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">
                    Target vocabulary
                    <span className="text-white/35 font-normal ml-1">— optional, comma-separated</span>
                </label>
                <input
                    type="text"
                    value={vocabulary}
                    onChange={e => setVocabulary(e.target.value)}
                    placeholder="e.g. sustainable, commute, pollution, renewable energy"
                    className={inputCls}
                    disabled={status === 'loading'}
                />
                <p className="text-white/35 text-xs">Leave blank and Claude will pick useful vocabulary from the text itself.</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Number of paragraphs</label>
                <div className="flex gap-2 flex-wrap">
                    {PARAGRAPH_OPTIONS.map(n => (
                        <button
                            key={n}
                            onClick={() => setParagraphs(n)}
                            disabled={status === 'loading'}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                                paragraphs === n
                                    ? 'bg-emerald-500 border-emerald-400 text-white'
                                    : 'lg-chip lg-chip-hover border text-white/70 hover:text-white'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">
                    Extra instructions
                    <span className="text-white/35 font-normal ml-1">— optional</span>
                </label>
                <textarea
                    value={extra}
                    onChange={e => setExtra(e.target.value)}
                    placeholder="e.g. Write in the first person, suitable for a business English student…"
                    rows={3}
                    className={`${inputCls} resize-y`}
                    disabled={status === 'loading'}
                />
            </div>

            <button
                onClick={generate}
                disabled={!topic.trim() || status === 'loading'}
                className="self-start bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
                Generate Reading Text
            </button>

            {status === 'loading' && (
                <div className="flex justify-center py-6">
                    <Spinner message="Writing your reading text… this takes about 20 seconds" color="text-emerald-400" textColor="text-white/60" />
                </div>
            )}

            {status === 'error' && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-300">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}

// ─── PDF Tab ────────────────────────────────────────────────────────────────

function PdfUploader() {
    const [dragging, setDragging]   = useState(false);
    const [status, setStatus]       = useState('idle');
    const [result, setResult]       = useState(null);
    const [errorMsg, setErrorMsg]   = useState('');
    const [tooLarge, setTooLarge]   = useState(false);
    const inputRef = useRef(null);

    const MAX_MB = 500;

    async function upload(file) {
        if (!file || file.type !== 'application/pdf') {
            setErrorMsg('Please select a PDF file.');
            setTooLarge(false);
            setStatus('error');
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setTooLarge(true);
            setStatus('error');
            return;
        }
        setTooLarge(false);
        setStatus('uploading');
        setErrorMsg('');
        setResult(null);

        const form = new FormData();
        form.append('pdf', file);

        try {
            const { data } = await axios.post('/api/documents', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(data);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Upload failed. Please try again.');
            setStatus('error');
        }
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files[0]);
    }

    function onFileChange(e) {
        upload(e.target.files[0]);
        e.target.value = '';
    }

    function reset() {
        setStatus('idle');
        setResult(null);
        setErrorMsg('');
        setTooLarge(false);
    }

    return (
        <>
            {status !== 'success' && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={[
                        'border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200',
                        dragging
                            ? 'border-blue-400 bg-blue-500/20 backdrop-blur-md'
                            : 'lg-surface lg-surface-hover border',
                    ].join(' ')}
                >
                    <svg className={`w-12 h-12 transition-colors ${dragging ? 'text-blue-300' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {status === 'uploading' ? (
                        <Spinner message="Uploading and extracting text…" color="text-blue-400" textColor="text-white/60" />
                    ) : (
                        <>
                            <p className="text-sm text-white/80 font-medium">Drop your PDF here or click to browse</p>
                            <p className="text-xs text-white/40">PDF only · max 500 MB</p>
                        </>
                    )}
                    <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
                </div>
            )}

            {status === 'error' && tooLarge && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-400/30 backdrop-blur-md px-4 py-4 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-amber-300">File too large (max {MAX_MB} MB)</p>
                    <p className="text-xs text-amber-200/80">Split your PDF into smaller parts first, then upload each part separately:</p>
                    <div className="flex gap-3 mt-1">
                        <a href="https://www.ilovepdf.com/split_pdf" target="_blank" rel="noreferrer"
                            className="text-xs font-semibold text-white bg-amber-500/40 hover:bg-amber-500/60 border border-amber-400/40 px-3 py-1.5 rounded-lg transition-colors">
                            ilovepdf.com →
                        </a>
                        <a href="https://smallpdf.com/split-pdf" target="_blank" rel="noreferrer"
                            className="text-xs font-semibold text-white bg-amber-500/40 hover:bg-amber-500/60 border border-amber-400/40 px-3 py-1.5 rounded-lg transition-colors">
                            smallpdf.com →
                        </a>
                    </div>
                </div>
            )}

            {status === 'error' && !tooLarge && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-3 text-sm text-red-300">
                    {errorMsg}
                </div>
            )}

            {status === 'success' && result && (
                <div className="rounded-2xl border border-green-400/30 bg-green-500/10 backdrop-blur-md p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-green-300">{result.original_name}</p>
                            <p className="text-xs text-green-400/80 mt-0.5">{result.char_count.toLocaleString()} characters extracted</p>
                        </div>
                        <button onClick={reset} className="text-xs text-green-400 underline hover:text-green-200 transition-colors cursor-pointer">
                            Upload another
                        </button>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-green-400 mb-2">Text preview</p>
                        <pre className="text-xs text-white/70 bg-black/20 border border-white/10 rounded-xl p-3 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                            {result.preview}…
                        </pre>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Audio Tab ───────────────────────────────────────────────────────────────

const AUDIO_MAX_MB = 25;
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg'];

function AudioUploader() {
    const navigate = useNavigate();
    const [dragging, setDragging]     = useState(false);
    const [status, setStatus]         = useState('idle');  // idle | uploading | processing | ready | failed
    const [documentId, setDocumentId] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [editText, setEditText]     = useState('');
    const [editing, setEditing]       = useState(false);
    const [saving, setSaving]         = useState(false);
    const [fileName, setFileName]     = useState('');
    const [errorMsg, setErrorMsg]     = useState('');
    const pollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => () => clearInterval(pollRef.current), []);

    async function upload(file) {
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setErrorMsg('Please select an audio file (mp3, mp4, m4a, wav, or webm).');
            setStatus('failed');
            return;
        }
        if (file.size > AUDIO_MAX_MB * 1024 * 1024) {
            setErrorMsg(`File too large. Whisper API limit is ${AUDIO_MAX_MB} MB.`);
            setStatus('failed');
            return;
        }

        setFileName(file.name);
        setStatus('uploading');
        setErrorMsg('');

        const form = new FormData();
        form.append('audio', file);

        try {
            const { data } = await axios.post('/api/audio/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setDocumentId(data.document_id);
            setStatus('processing');
            startPolling(data.document_id);

        } catch (err) {
            setErrorMsg(err.response?.data?.message ?? 'Upload failed. Please try again.');
            setStatus('failed');
        }
    }

    function startPolling(id) {
        clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const { data } = await axios.get(`/api/audio/status/${id}`);
                if (data.status === 'ready') {
                    clearInterval(pollRef.current);
                    const text = data.transcription_text ?? '';
                    setTranscription(text);
                    setEditText(text);
                    setStatus('ready');
                } else if (data.status === 'failed') {
                    clearInterval(pollRef.current);
                    setErrorMsg('Transcription failed. Please try again.');
                    setStatus('failed');
                }
            } catch {
                clearInterval(pollRef.current);
                setErrorMsg('Could not reach the server. Please try again.');
                setStatus('failed');
            }
        }, 3000);
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files[0]);
    }

    function onFileChange(e) {
        upload(e.target.files[0]);
        e.target.value = '';
    }

    async function saveEdit() {
        setSaving(true);
        try {
            await axios.patch(`/api/documents/${documentId}`, { extracted_text: editText });
            setTranscription(editText);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    function reset() {
        clearInterval(pollRef.current);
        setStatus('idle');
        setDocumentId(null);
        setTranscription('');
        setEditText('');
        setEditing(false);
        setFileName('');
        setErrorMsg('');
    }

    if (status === 'ready') {
        const wordCount = transcription.trim().split(/\s+/).length;
        return (
            <div className="rounded-2xl border border-green-400/30 bg-green-500/10 backdrop-blur-md p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-green-300">🎧 {fileName}</p>
                        <p className="text-xs text-green-400/80 mt-0.5">{wordCount.toLocaleString()} words transcribed</p>
                    </div>
                    <button onClick={reset} className="text-xs text-green-400 underline hover:text-green-200 transition-colors cursor-pointer">
                        Upload another
                    </button>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-green-400">Transcription</p>
                        <button
                            onClick={() => { setEditing(e => !e); setEditText(transcription); }}
                            className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                        >
                            {editing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {editing ? (
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                rows={8}
                                className="w-full text-xs text-white/80 bg-black/30 border border-white/20 rounded-xl p-3 font-sans resize-y focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="self-end text-xs font-semibold text-white bg-green-600/60 hover:bg-green-600/80 border border-green-400/40 px-4 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    ) : (
                        <pre className="text-xs text-white/70 bg-black/20 border border-white/10 rounded-xl p-3 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                            {transcription}
                        </pre>
                    )}
                </div>

                <button
                    onClick={() => navigate(`/generate?doc=${documentId}`)}
                    className="w-full py-3 rounded-xl bg-purple-600/70 hover:bg-purple-600/90 border border-purple-400/40 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                    Generate Activity →
                </button>
            </div>
        );
    }

    return (
        <>
            {(status === 'idle' || status === 'uploading' || status === 'processing') && (
                <div
                    onClick={() => status === 'idle' && inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); if (status === 'idle') setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={status === 'idle' ? onDrop : undefined}
                    className={[
                        'border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-3 transition-all duration-200',
                        status === 'idle'
                            ? dragging
                                ? 'border-purple-400 bg-purple-500/20 backdrop-blur-md cursor-pointer'
                                : 'lg-surface lg-surface-hover border cursor-pointer'
                            : 'lg-surface border cursor-default',
                    ].join(' ')}
                >
                    {status === 'processing' ? (
                        <>
                            <Spinner message="" color="text-purple-400" />
                            <p className="text-sm text-white/80 font-medium">Transcribing audio…</p>
                            <p className="text-xs text-white/40">This takes about 20–30 seconds · {fileName}</p>
                        </>
                    ) : status === 'uploading' ? (
                        <Spinner message="Uploading…" color="text-purple-400" textColor="text-white/60" />
                    ) : (
                        <>
                            <svg className={`w-12 h-12 transition-colors ${dragging ? 'text-purple-300' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <p className="text-sm text-white/80 font-medium">Drop your audio file here or click to browse</p>
                            <p className="text-xs text-white/40">mp3, mp4, m4a, wav · max 25 MB</p>
                        </>
                    )}
                    <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={onFileChange} />
                </div>
            )}

            {status === 'failed' && (
                <div className="rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur-md px-4 py-4 flex flex-col gap-3">
                    <p className="text-sm text-red-300">{errorMsg}</p>
                    <button onClick={reset} className="self-start text-xs font-semibold text-white bg-red-500/30 hover:bg-red-500/50 border border-red-400/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                        Try again
                    </button>
                </div>
            )}
        </>
    );
}

// ─── Pronunciation Tab ────────────────────────────────────────────────────────

function PronunciationLauncher() {
    const navigate = useNavigate();

    const drillButtonCls = 'py-6 px-4 rounded-2xl lg-surface lg-surface-hover border text-white text-base font-semibold transition-all cursor-pointer hover:scale-[1.02]';

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate('/pronunciation')}
                className="w-full py-8 rounded-2xl bg-teal-600/70 hover:bg-teal-600/90 border border-teal-400/40 text-white font-bold text-xl transition-all cursor-pointer hover:scale-[1.01]"
            >
                🔤 Phonemic Chart
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => navigate('/pronunciation/drill/phoneme')} className={drillButtonCls}>
                    Phoneme Drill
                </button>
                <button onClick={() => navigate('/pronunciation/drill/ed-endings')} className={drillButtonCls}>
                    -ed Endings
                </button>
                <button onClick={() => navigate('/pronunciation/drill/sound-introduction')} className={drillButtonCls}>
                    Sound Introduction
                </button>
            </div>
        </div>
    );
}

// ─── DET Practice Tab ──────────────────────────────────────────────────────────

function DetPracticeLauncher() {
    const navigate = useNavigate();

    const drillButtonCls = 'py-6 px-4 rounded-2xl lg-surface lg-surface-hover border text-white text-base font-semibold transition-all cursor-pointer hover:scale-[1.02]';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <p className="lg-shell-text text-white/60 text-xs">
                    DET-format reading and vocabulary practice — no scoring, teacher-controlled pace.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/det/practice/read-select')} className={drillButtonCls}>
                        Read and Select
                    </button>
                    <button onClick={() => navigate('/det/practice/fill-blank')} className={drillButtonCls}>
                        Fill in the Blanks
                    </button>
                    <button onClick={() => navigate('/det/practice/read-complete')} className={drillButtonCls}>
                        Read and Complete
                    </button>
                    <button onClick={() => navigate('/det/practice/interactive-reading')} className={drillButtonCls}>
                        Interactive Reading
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <p className="lg-shell-text text-white/60 text-xs">
                    Speaking practice — no timer, no recording, you run it live — plus a quick vocabulary check-in.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/det/practice/read-then-speak')} className={drillButtonCls}>
                        Read, Then Speak
                    </button>
                    <button onClick={() => navigate('/det/practice/speak-about-photo')} className={drillButtonCls}>
                        Speak About the Photo
                    </button>
                    <button onClick={() => navigate('/det/practice/interactive-speaking')} className={drillButtonCls}>
                        Interactive Speaking
                    </button>
                    <button onClick={() => navigate('/det/practice/vocab-practice')} className={drillButtonCls}>
                        Vocabulary Practice
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Cambridge Practice Tab ────────────────────────────────────────────────────

function CambridgePracticeLauncher() {
    const navigate = useNavigate();

    const drillButtonCls = 'py-6 px-4 rounded-2xl lg-surface lg-surface-hover border text-white text-base font-semibold transition-all cursor-pointer hover:scale-[1.02]';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <p className="lg-shell-text text-white/70 text-sm font-semibold">B2 First</p>
                <p className="lg-shell-text text-white/60 text-xs -mt-2">
                    Cambridge-style practice (B2 First) — Reading &amp; Use of English. Original content, not real exam material; no official score, no recording.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/cambridge/practice/word-formation')} className={drillButtonCls}>
                        Word Formation
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/key-word-transformation')} className={drillButtonCls}>
                        Key Word Transformation
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/mc-cloze')} className={drillButtonCls}>
                        Multiple-Choice Cloze
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/open-cloze')} className={drillButtonCls}>
                        Open Cloze
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/mc-reading')} className={drillButtonCls}>
                        Multiple Choice Reading
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/multiple-matching')} className={drillButtonCls}>
                        Multiple Matching
                    </button>
                    <button onClick={() => navigate('/cambridge/practice/gapped-text')} className={drillButtonCls}>
                        Gapped Text
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
                <p className="lg-shell-text text-white/70 text-sm font-semibold">C1 Advanced</p>
                <p className="lg-shell-text text-white/60 text-xs -mt-2">
                    Harder, C1-level practice — currently just one part while B2 First is being validated with real students.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => navigate('/cambridge/practice/cross-text-matching')} className={drillButtonCls}>
                        Cross-Text Multiple Matching
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UploadPage() {
    const location = useLocation();
    const [tab, setTab] = useState(location.state?.tab ?? 'pdf');

    const tabs = [
        { id: 'pdf',          label: '📄 PDF',          active: 'bg-blue-500/30 border-blue-400/50 text-blue-200' },
        { id: 'audio',        label: '🎧 Audio',        active: 'bg-purple-500/30 border-purple-400/50 text-purple-200' },
        { id: 'presentation', label: '🎞 Presentation',  active: 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200' },
        { id: 'reading',       label: '📖 Reading Text',  active: 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200' },
        { id: 'pronunciation', label: '🔊 Pronunciation', active: 'bg-teal-500/30 border-teal-400/50 text-teal-200' },
        { id: 'det',           label: '🎯 DET Practice',  active: 'bg-amber-500/30 border-amber-400/50 text-amber-200' },
        { id: 'cambridge',     label: '🎓 Cambridge',     active: 'bg-rose-500/30 border-rose-400/50 text-rose-200' },
    ];

    return (
        <div className="max-w-xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="lg-shell-text text-3xl font-bold text-white">Upload Content</h2>
                <p className="lg-shell-text text-white/70 mt-1 text-sm">Upload a PDF or audio file, create a presentation or reading text from any topic, or practice pronunciation and DET question types.</p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                            tab === t.id
                                ? t.active
                                : 'lg-chip lg-chip-hover text-white/60 hover:text-white/85'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'pdf'          && <PdfUploader />}
            {tab === 'audio'        && <AudioUploader />}
            {tab === 'presentation' && <PresentationGenerator />}
            {tab === 'reading'       && <ReadingTextGenerator />}
            {tab === 'pronunciation' && <PronunciationLauncher />}
            {tab === 'det'           && <DetPracticeLauncher />}
            {tab === 'cambridge'     && <CambridgePracticeLauncher />}
        </div>
    );
}
