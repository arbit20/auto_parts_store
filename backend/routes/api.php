<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'service' => config('app.name'),
]));

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
