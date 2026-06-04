<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Usuarios\StoreUsuarioRequest;
use App\Http\Requests\Usuarios\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $search  = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search) . '%';

        $usuarios = Usuario::query()
            ->with('roles')
            ->when($search !== '', function ($query) use ($like): void {
                $query->where(function ($query) use ($like): void {
                    $query->where('nombre', 'like', $like)
                        ->orWhere('apellido', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhereHas('roles', fn ($q) => $q->where('nombre', 'like', $like));
                });
            })
            ->orderBy('nombre')
            ->paginate($perPage)
            ->withQueryString();

        return UsuarioResource::collection($usuarios);
    }

    public function show(Usuario $usuario): UsuarioResource
    {
        return UsuarioResource::make($usuario->load('roles'));
    }

    public function store(StoreUsuarioRequest $request): JsonResponse
    {
        $data  = $request->validated();
        $roles = $data['roles'] ?? [];
        unset($data['roles']);

        $data['password_hash'] = Hash::make($data['password']);
        unset($data['password']);

        $usuario = Usuario::query()->create($data);
        $usuario->roles()->sync($roles);

        return UsuarioResource::make($usuario->load('roles'))
            ->additional(['message' => 'Usuario creado correctamente.'])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUsuarioRequest $request, Usuario $usuario): UsuarioResource
    {
        $data  = $request->validated();
        $roles = $data['roles'] ?? null;
        unset($data['roles']);

        if (! empty($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
        }
        unset($data['password']);

        $usuario->update($data);

        if ($roles !== null) {
            $usuario->roles()->sync($roles);
        }

        return UsuarioResource::make($usuario->load('roles'))
            ->additional(['message' => 'Usuario actualizado correctamente.']);
    }

    public function destroy(Usuario $usuario): JsonResponse
    {
        if ($usuario->proveedor()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar un usuario con un proveedor asociado.',
            ], 409);
        }

        $usuario->roles()->detach();
        $usuario->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }
}
