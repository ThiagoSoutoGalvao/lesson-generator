<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\TranscriptionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TranscribeAudioJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $documentId,
        public string $storedPath,
    ) {}

    public function handle(TranscriptionService $transcriber): void
    {
        $document = Document::findOrFail($this->documentId);

        try {
            $absolutePath = Storage::disk('local')->path($this->storedPath);
            $text = $transcriber->transcribe($absolutePath);

            $document->update([
                'extracted_text' => $text,
                'status'         => 'ready',
            ]);
        } catch (\Throwable $e) {
            Log::error("TranscribeAudioJob failed for document {$this->documentId}: " . $e->getMessage());
            $document->update(['status' => 'failed']);
        }
    }
}
