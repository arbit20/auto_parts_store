<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    public $timestamps = false;

    protected $table = 'categorias';

    protected $fillable = [
        'nombre',
        'descripcion',
        'categoria_padre_id',
    ];

    public function categoriaPadre(): BelongsTo
    {
        return $this->belongsTo(self::class, 'categoria_padre_id');
    }

    public function hijos(): HasMany
    {
        return $this->hasMany(self::class, 'categoria_padre_id');
    }

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'categoria_id');
    }
}
