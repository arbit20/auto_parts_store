<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Compatibilidad extends Model
{
    public $timestamps = false;

    protected $table = 'compatibilidades';

    protected $fillable = [
        'producto_id',
        'modelo_vehiculo_id',
        'anio_desde',
        'anio_hasta',
    ];

    protected function casts(): array
    {
        return [
            'anio_desde' => 'integer',
            'anio_hasta' => 'integer',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function modelo(): BelongsTo
    {
        return $this->belongsTo(ModeloVehiculo::class, 'modelo_vehiculo_id');
    }
}
