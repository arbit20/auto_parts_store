<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarcaPieza extends Model
{
    public $timestamps = false;

    protected $table = 'marcas_pieza';

    protected $fillable = [
        'nombre',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'marca_pieza_id');
    }
}
