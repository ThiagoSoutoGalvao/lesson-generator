import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Spinner from '@/components/Spinner';

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
                        'border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 backdrop-blur-md',
                        dragging
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/25 bg-white/8 hover:border-white/50 hover:bg-white/12',
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
    const [dragging, setDragging]     = useState(false);
    const [status, setStatus]         = useState('idle');  // idle | uploading | processing | ready | failed
    const [documentId, setDocumentId] = useState(null);
    const [transcription, setTranscription] = useState('');
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
                    setTranscription(data.transcription_text ?? '');
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

    function reset() {
        clearInterval(pollRef.current);
        setStatus('idle');
        setDocumentId(null);
        setTranscription('');
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
                    <p className="text-xs font-medium text-green-400 mb-2">Transcription preview</p>
                    <pre className="text-xs text-white/70 bg-black/20 border border-white/10 rounded-xl p-3 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                        {transcription}
                    </pre>
                </div>
                <p className="text-xs text-white/40">This document is now available on the Generate page.</p>
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
                        'border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-3 transition-all duration-200 backdrop-blur-md',
                        status === 'idle'
                            ? dragging
                                ? 'border-purple-400 bg-purple-500/20 cursor-pointer'
                                : 'border-white/25 bg-white/8 hover:border-white/50 hover:bg-white/12 cursor-pointer'
                            : 'border-white/15 bg-white/5 cursor-default',
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UploadPage() {
    const [tab, setTab] = useState('pdf');

    return (
        <div className="max-w-xl mx-auto mt-4 flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Upload Content</h2>
                <p className="text-white/60 mt-1 text-sm">Upload a PDF or audio file to generate activities from it.</p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab('pdf')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        tab === 'pdf'
                            ? 'bg-blue-500/30 border-blue-400/50 text-blue-200'
                            : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                >
                    📄 PDF
                </button>
                <button
                    onClick={() => setTab('audio')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        tab === 'audio'
                            ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                            : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                >
                    🎧 Audio
                </button>
            </div>

            {tab === 'pdf' ? <PdfUploader /> : <AudioUploader />}
        </div>
    );
}
