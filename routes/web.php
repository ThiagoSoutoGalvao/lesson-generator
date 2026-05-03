<?php

use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::middleware('auth')->get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
