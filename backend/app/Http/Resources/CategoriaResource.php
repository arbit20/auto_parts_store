<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoriaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'categoria_padre_id' => $this->categoria_padre_id,
            'categoria_padre' => $this->whenLoaded('categoriaPadre', fn () => $this->categoriaPadre ? [
                'id' => $this->categoriaPadre->id,
                'nombre' => $this->categoriaPadre->nombre,
            ] : null),
            'hijos_count' => $this->whenCounted('hijos'),
            'productos_count' => $this->whenCounted('productos'),
        ];
    }
}
