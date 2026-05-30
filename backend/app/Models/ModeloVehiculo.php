<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModeloVehiculo extends Model
{
    public $timestamps = false;

    protected $table = 'modelos_vehiculo';

    protected $fillable = [
        'marca_vehiculo_id',
        'nombre',
        'anio_inicio',
        'anio_fin',
    ];

    protected function casts(): array
    {
        return [
            'anio_inicio' => 'integer',
            'anio_fin' => 'integer',
        ];
    }

    public function marcaVehiculo(): BelongsTo
    {
        return $this->belongsTo(MarcaVehiculo::class, 'marca_vehiculo_id');
    }

    public function compatibilidades(): HasMany
    {
        return $this->hasMany(Compatibilidad::class, 'modelo_vehiculo_id');
    }
}
