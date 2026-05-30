<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    public $timestamps = false;

    protected $table = 'proveedores';

    protected $fillable = [
        'usuario_id',
        'nombre',
        'tipo',
        'pais',
        'contacto',
        'telefono',
        'email',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function ofertas(): HasMany
    {
        return $this->hasMany(Oferta::class, 'vendedor_id');
    }
}
