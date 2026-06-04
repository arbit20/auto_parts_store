<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Productos\StoreProductoRequest;
use App\Http\Requests\Productos\UpdateProductoRequest;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    private const RELATIONS = [
        'categoria',
        'marcaPieza',
        'compatibilidades.modelo.marcaVehiculo',
        'imagenes',
        'ofertas.vendedor',
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        $productos = Producto::query()
            ->with(self::RELATIONS)
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('codigo', 'like', "%{$search}%")
                        ->orWhere('nombre', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%")
                        ->orWhereHas('categoria', fn ($query) => $query->where('nombre', 'like', "%{$search}%"))
                        ->orWhereHas('marcaPieza', fn ($query) => $query->where('nombre', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return ProductoResource::collection($productos);
    }

    public function show(Producto $producto): ProductoResource
    {
        return ProductoResource::make($producto->load(self::RELATIONS));
    }

    public function store(StoreProductoRequest $request): JsonResponse
    {
        $producto = Producto::query()->create($request->validated());

        return ProductoResource::make($producto->load(self::RELATIONS))
            ->additional(['message' => 'Producto creado correctamente.'])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductoRequest $request, Producto $producto): ProductoResource
    {
        $producto->update($request->validated());

        return ProductoResource::make($producto->load(self::RELATIONS))
            ->additional(['message' => 'Producto actualizado correctamente.']);
    }

    public function destroy(Producto $producto): JsonResponse
    {
        DB::transaction(function () use ($producto): void {
            $producto->ofertas()->delete();
            $producto->delete();
        });

        return response()->json([
            'message' => 'Producto eliminado correctamente.',
        ]);
    }
}
