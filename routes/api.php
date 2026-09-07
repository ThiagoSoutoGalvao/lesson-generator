<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AudioUploadController;
use App\Http\Controllers\BackgroundController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SavedActivityController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TrilhaLessonBriefController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:web')->group(function () {
    // Current user — the SPA branches on `role` at the top of App.jsx.
    Route::get('/me', fn () => auth()->user()->only(['id', 'name', 'role', 'trilha', 'is_active']));

    // Teacher-facing student management (StudentController enforces role=teacher).
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::patch('/students/{student}', [StudentController::class, 'update']);

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::post('/generate', [ActivityController::class, 'generate']);
    Route::post('/presentation/generate', [ActivityController::class, 'generatePresentation']);
    Route::post('/reading/generate', [ActivityController::class, 'generateReadingText']);
    Route::post('/essay-feedback/generate', [ActivityController::class, 'generateEssayFeedback']);
    Route::post('/detect-sections', [SectionController::class, 'detect']);
    Route::get('/background', [BackgroundController::class, 'fetch']);

    Route::get('/activities', [SavedActivityController::class, 'index']);
    Route::post('/activities', [SavedActivityController::class, 'store']);
    Route::delete('/activities/{activity}', [SavedActivityController::class, 'destroy']);
    Route::get('/folders', [SavedActivityController::class, 'folders']);

    Route::get('/trilha-briefs', [TrilhaLessonBriefController::class, 'index']);
    Route::put('/trilha-briefs', [TrilhaLessonBriefController::class, 'upsert']);

    Route::post('/audio/upload', [AudioUploadController::class, 'store']);
    Route::get('/audio/status/{id}', [AudioUploadController::class, 'status']);
    Route::patch('/documents/{id}', [DocumentController::class, 'update']);
});
