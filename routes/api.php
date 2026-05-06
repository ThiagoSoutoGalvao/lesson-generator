<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AudioUploadController;
use App\Http\Controllers\BackgroundController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SavedActivityController;
use App\Http\Controllers\SectionController;
use Illuminate\Support\Facades\Route;

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

    Route::post('/audio/upload', [AudioUploadController::class, 'store']);
    Route::get('/audio/status/{id}', [AudioUploadController::class, 'status']);
    Route::patch('/documents/{id}', [DocumentController::class, 'update']);
});
