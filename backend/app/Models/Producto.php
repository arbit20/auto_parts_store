<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    public $timestamps = false;

    protected $table = 'productos';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria_id',
        'marca_pieza_id',
        'peso_kg',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'peso_kg' => 'decimal:3',
            'activo' => 'boolean',
            'creado_en' => 'datetime',
        ];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function marcaPieza(): BelongsTo
    {
        return $this->belongsTo(MarcaPieza::class, 'marca_pieza_id');
    }

    public function compatibilidades(): HasMany
    {
        return $this->hasMany(Compatibilidad::class, 'producto_id');
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(ProductoImagen::class, 'producto_id');
    }

    public function ofertas(): HasMany
    {
        return $this->hasMany(Oferta::class, 'producto_id');
    }
}
