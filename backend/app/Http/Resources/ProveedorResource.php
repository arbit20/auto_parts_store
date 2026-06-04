<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProveedorResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'nombre'       => $this->nombre,
            'tipo'         => $this->tipo,
            'pais'         => $this->pais,
            'contacto'     => $this->contacto,
            'telefono'     => $this->telefono,
            'email'        => $this->email,
            'usuario_id'   => $this->usuario_id,
            'usuario'      => $this->whenLoaded('usuario', fn () => $this->usuario ? [
                'id'     => $this->usuario->id,
                'nombre' => $this->usuario->nombre,
            ] : null),
            'ofertas_count' => $this->whenCounted('ofertas'),
        ];
    }
}
