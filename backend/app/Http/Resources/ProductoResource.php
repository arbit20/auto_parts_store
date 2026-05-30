<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'categoria_id' => $this->categoria_id,
            'marca_pieza_id' => $this->marca_pieza_id,
            'peso_kg' => $this->peso_kg,
            'activo' => $this->activo,
            'creado_en' => optional($this->creado_en)->toISOString(),
            'precio_desde' => $this->whenLoaded('ofertas', fn () => $this->ofertas->where('activo', true)->min('precio')),
            'stock_total' => $this->whenLoaded('ofertas', fn () => $this->ofertas->where('activo', true)->sum('stock')),
            'categoria' => $this->whenLoaded('categoria', fn () => $this->categoria ? [
                'id' => $this->categoria->id,
                'nombre' => $this->categoria->nombre,
            ] : null),
            'marca_pieza' => $this->whenLoaded('marcaPieza', fn () => $this->marcaPieza ? [
                'id' => $this->marcaPieza->id,
                'nombre' => $this->marcaPieza->nombre,
            ] : null),
            'compatibilidades' => $this->whenLoaded('compatibilidades', fn () => $this->compatibilidades->map(function ($compatibilidad): array {
                $modelo = $compatibilidad->modelo;
                $marca = $modelo?->marcaVehiculo;
                $rango = collect([$compatibilidad->anio_desde, $compatibilidad->anio_hasta])
                    ->filter()
                    ->implode('-');

                return [
                    'id' => $compatibilidad->id,
                    'anio_desde' => $compatibilidad->anio_desde,
                    'anio_hasta' => $compatibilidad->anio_hasta,
                    'etiqueta' => trim(sprintf(
                        '%s %s %s',
                        $marca?->nombre ?? '',
                        $modelo?->nombre ?? '',
                        $rango
                    )),
                    'modelo' => $modelo ? [
                        'id' => $modelo->id,
                        'nombre' => $modelo->nombre,
                        'anio_inicio' => $modelo->anio_inicio,
                        'anio_fin' => $modelo->anio_fin,
                    ] : null,
                    'marca_vehiculo' => $marca ? [
                        'id' => $marca->id,
                        'nombre' => $marca->nombre,
                    ] : null,
                ];
            })->values()),
            'imagenes' => $this->whenLoaded('imagenes', fn () => $this->imagenes->map(fn ($imagen): array => [
                'id' => $imagen->id,
                'url' => $imagen->url,
                'es_principal' => $imagen->es_principal,
            ])->values()),
            'ofertas' => $this->whenLoaded('ofertas', fn () => $this->ofertas->map(fn ($oferta): array => [
                'id' => $oferta->id,
                'tipo_venta' => $oferta->tipo_venta,
                'condicion' => $oferta->condicion,
                'origen' => $oferta->origen,
                'precio' => $oferta->precio,
                'moneda' => $oferta->moneda,
                'stock' => $oferta->stock,
                'stock_minimo' => $oferta->stock_minimo,
                'activo' => $oferta->activo,
                'vendedor' => $oferta->vendedor ? [
                    'id' => $oferta->vendedor->id,
                    'nombre' => $oferta->vendedor->nombre,
                ] : [
                    'id' => null,
                    'nombre' => 'Bagg',
                ],
            ])->values()),
        ];
    }
}
