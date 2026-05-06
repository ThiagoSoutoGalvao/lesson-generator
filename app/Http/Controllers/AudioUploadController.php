<?php

namespace App\Http\Controllers;

use App\Jobs\TranscribeAudioJob;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AudioUploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'audio' => [
                'required',
                'file',
                'mimetypes:audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm,audio/ogg',
                'max:25600',
            ],
        ]);

        $file = $request->file('audio');
        $path = $file->store('audio', 'local');

        $document = Document::create([
            'original_name' => $file->getClientOriginalName(),
            'stored_path'   => $path,
            'source_type'   => 'audio',
            'status'        => 'processing',
            'extracted_text' => null,
        ]);

        TranscribeAudioJob::dispatch($document->id, $path);

        return response()->json(['document_id' => $document->id], 202);
    }

    public function status(int $id)
    {
        $document = Document::findOrFail($id);

        return response()->json([
            'status'             => $document->status,
            'transcription_text' => $document->status === 'ready' ? $document->extracted_text : null,
            'original_name'      => $document->original_name,
        ]);
    }
}
