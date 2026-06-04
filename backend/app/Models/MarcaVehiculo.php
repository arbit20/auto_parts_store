<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarcaVehiculo extends Model
{
    public $timestamps = false;

    protected $table = 'marcas_vehiculo';

    protected $fillable = [
        'nombre',
        'pais_origen',
    ];

    public function modelos(): HasMany
    {
        return $this->hasMany(ModeloVehiculo::class, 'marca_vehiculo_id');
    }
}
