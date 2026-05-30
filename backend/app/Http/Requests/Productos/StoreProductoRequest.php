<?php

namespace App\Http\Requests\Productos;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:50', 'unique:productos,codigo'],
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'categoria_id' => ['required', 'integer', 'exists:categorias,id'],
            'marca_pieza_id' => ['nullable', 'integer', 'exists:marcas_pieza,id'],
            'peso_kg' => ['nullable', 'numeric', 'min:0', 'max:99999.999'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
