<?php

namespace App\Http\Requests\Productos;

use App\Models\Producto;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductoRequest extends FormRequest
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
        $producto = $this->route('producto');
        $productoId = $producto instanceof Producto ? $producto->id : $producto;

        return [
            'codigo' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('productos', 'codigo')->ignore($productoId),
            ],
            'nombre' => ['sometimes', 'required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'categoria_id' => ['sometimes', 'required', 'integer', 'exists:categorias,id'],
            'marca_pieza_id' => ['nullable', 'integer', 'exists:marcas_pieza,id'],
            'peso_kg' => ['nullable', 'numeric', 'min:0', 'max:99999.999'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
