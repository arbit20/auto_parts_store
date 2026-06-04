<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Categorias\StoreCategoriaRequest;
use App\Http\Requests\Categorias\UpdateCategoriaRequest;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoriaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->query('per_page', 50), 1), 100);

        $categorias = Categoria::query()
            ->with('categoriaPadre')
            ->withCount(['hijos', 'productos'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where('nombre', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%")
                    ->orWhereHas('categoriaPadre', fn ($query) => $query->where('nombre', 'like', "%{$search}%"));
            })
            ->orderBy('nombre')
            ->paginate($perPage)
            ->withQueryString();

        return CategoriaResource::collection($categorias);
    }

    public function show(Categoria $categoria): CategoriaResource
    {
        return CategoriaResource::make($categoria->load('categoriaPadre')->loadCount(['hijos', 'productos']));
    }

    public function store(StoreCategoriaRequest $request): JsonResponse
    {
        $categoria = Categoria::query()->create($request->validated());

        return CategoriaResource::make($categoria->load('categoriaPadre')->loadCount(['hijos', 'productos']))
            ->additional(['message' => 'Categoria creada correctamente.'])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCategoriaRequest $request, Categoria $categoria): CategoriaResource
    {
        $categoria->update($request->validated());

        return CategoriaResource::make($categoria->load('categoriaPadre')->loadCount(['hijos', 'productos']))
            ->additional(['message' => 'Categoria actualizada correctamente.']);
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        if ($categoria->productos()->exists() || $categoria->hijos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar una categoria con productos o subcategorias.',
            ], 409);
        }

        $categoria->delete();

        return response()->json([
            'message' => 'Categoria eliminada correctamente.',
        ]);
    }
}
