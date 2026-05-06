<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\BackgroundController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SavedActivityController;
use App\Http\Controllers\SectionController;
use App\Services\TranscriptionService;
use Illuminate\Support\Facades\Route;

// Temporary test route — remove after Audio Phase 1 is verified
Route::get('/audio/test-transcribe', function (TranscriptionService $transcriber) {
    $path = storage_path('app/audio/test.mp3');
    if (!file_exists($path)) {
        return response()->json(['error' => 'Place a test audio file at storage/app/audio/test.mp3'], 404);
    }
    $text = $transcriber->transcribe($path);
    return response()->json(['transcription' => $text]);
});

Route::middleware('auth:web')->group(function () {
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::post('/generate', [ActivityController::class, 'generate']);
    Route::post('/detect-sections', [SectionController::class, 'detect']);
    Route::get('/background', [BackgroundController::class, 'fetch']);

    Route::get('/activities', [SavedActivityController::class, 'index']);
    Route::post('/activities', [SavedActivityController::class, 'store']);
    Route::delete('/activities/{activity}', [SavedActivityController::class, 'destroy']);
    Route::get('/folders', [SavedActivityController::class, 'folders']);
});
