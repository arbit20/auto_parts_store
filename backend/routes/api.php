<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'service' => config('app.name'),
]));

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('productos', ProductoController::class);
    Route::apiResource('categorias', CategoriaController::class);
    Route::apiResource('proveedores', ProveedorController::class)
        ->parameters(['proveedores' => 'proveedor']);

    Route::get('/roles', [RolController::class, 'index']);
    Route::apiResource('usuarios', UsuarioController::class)
        ->parameters(['usuarios' => 'usuario']);
});
