<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        // ci_nit es un documento de identidad (PII): solo se expone en el detalle (show),
        // no en el listado, mientras no exista autorizacion por roles.
        $isDetail = $request->routeIs('usuarios.show');

        return [
            'id'        => $this->id,
            'nombre'    => $this->nombre,
            'apellido'  => $this->apellido,
            'email'     => $this->email,
            'telefono'  => $this->telefono,
            'ci_nit'    => $this->when($isDetail, $this->ci_nit),
            'estado'    => $this->estado,
            'creado_en' => $this->creado_en,
            'roles'     => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($rol) => [
                'id'     => $rol->id,
                'nombre' => $rol->nombre,
            ])->values()),
        ];
    }
}
