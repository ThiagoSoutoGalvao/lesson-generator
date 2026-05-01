import { useRef, useState } from 'react';
import axios from 'axios';

export default function UploadPage() {
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | uploading | success | error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef(null);

    async function upload(file) {
        if (!file || file.type !== 'application/pdf') {
            setErrorMsg('Please select a PDF file.');
            setStatus('error');
            return;
        }

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
            const msg = err.response?.data?.message ?? 'Upload failed. Please try again.';
            setErrorMsg(msg);
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
    }

    return (
        <div className="max-w-xl mx-auto mt-12 flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Upload a Course Book</h2>
                <p className="text-gray-500 mt-1 text-sm">Upload a PDF and we'll extract its text so you can generate activities from it.</p>
            </div>

            {status !== 'success' && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={[
                        'border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                        dragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white hover:border-gray-400',
                    ].join(' ')}
                >
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">
                        {status === 'uploading' ? 'Uploading…' : 'Drop your PDF here or click to browse'}
                    </p>
                    <p className="text-xs text-gray-400">PDF only · max 50 MB</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={onFileChange}
                    />
                </div>
            )}

            {status === 'error' && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {errorMsg}
                </div>
            )}

            {status === 'success' && result && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-green-800">{result.original_name}</p>
                            <p className="text-xs text-green-600 mt-0.5">{result.char_count.toLocaleString()} characters extracted</p>
                        </div>
                        <button
                            onClick={reset}
                            className="text-xs text-green-700 underline hover:text-green-900"
                        >
                            Upload another
                        </button>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-green-700 mb-1">Text preview</p>
                        <pre className="text-xs text-gray-700 bg-white border border-green-100 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                            {result.preview}…
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
