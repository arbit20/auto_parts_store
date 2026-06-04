<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Oferta extends Model
{
    public $timestamps = false;

    protected $table = 'ofertas';

    protected $fillable = [
        'producto_id',
        'vendedor_id',
        'tipo_venta',
        'condicion',
        'origen',
        'precio_compra',
        'precio',
        'moneda',
        'comision_pct',
        'stock',
        'stock_minimo',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio_compra' => 'decimal:2',
            'precio' => 'decimal:2',
            'comision_pct' => 'decimal:2',
            'stock' => 'integer',
            'stock_minimo' => 'integer',
            'activo' => 'boolean',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'vendedor_id');
    }
}
