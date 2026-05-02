<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\BackgroundController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\SavedActivityController;
use Illuminate\Support\Facades\Route;

Route::get('/documents', [DocumentController::class, 'index']);
Route::post('/documents', [DocumentController::class, 'store']);
Route::post('/generate', [ActivityController::class, 'generate']);
Route::get('/background', [BackgroundController::class, 'fetch']);

Route::get('/activities', [SavedActivityController::class, 'index']);
Route::post('/activities', [SavedActivityController::class, 'store']);
Route::delete('/activities/{activity}', [SavedActivityController::class, 'destroy']);
