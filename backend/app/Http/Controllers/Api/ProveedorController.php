<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Proveedores\StoreProveedorRequest;
use App\Http\Requests\Proveedores\UpdateProveedorRequest;
use App\Http\Resources\ProveedorResource;
use App\Models\Proveedor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProveedorController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $search  = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search) . '%';

        $proveedores = Proveedor::query()
            ->with('usuario')
            ->withCount('ofertas')
            ->when($search !== '', function ($query) use ($like): void {
                $query->where(function ($query) use ($like): void {
                    $query->where('nombre', 'like', $like)
                        ->orWhere('pais', 'like', $like)
                        ->orWhere('tipo', 'like', $like)
                        ->orWhereHas('usuario', fn ($q) => $q->where('nombre', 'like', $like));
                });
            })
            ->orderBy('nombre')
            ->paginate($perPage)
            ->withQueryString();

        return ProveedorResource::collection($proveedores);
    }

    public function show(Proveedor $proveedor): ProveedorResource
    {
        return ProveedorResource::make(
            $proveedor->load('usuario')->loadCount('ofertas'),
        );
    }

    public function store(StoreProveedorRequest $request): JsonResponse
    {
        $proveedor = Proveedor::query()->create($request->validated());

        return ProveedorResource::make($proveedor->load('usuario')->loadCount('ofertas'))
            ->additional(['message' => 'Proveedor creado correctamente.'])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProveedorRequest $request, Proveedor $proveedor): ProveedorResource
    {
        $proveedor->update($request->validated());

        return ProveedorResource::make($proveedor->load('usuario')->loadCount('ofertas'))
            ->additional(['message' => 'Proveedor actualizado correctamente.']);
    }

    public function destroy(Proveedor $proveedor): JsonResponse
    {
        if ($proveedor->ofertas()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar un proveedor con ofertas asociadas.',
            ], 409);
        }

        $proveedor->delete();

        return response()->json(['message' => 'Proveedor eliminado correctamente.']);
    }
}
