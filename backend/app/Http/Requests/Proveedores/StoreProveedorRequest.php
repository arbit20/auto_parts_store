<?php

declare(strict_types=1);

namespace App\Http\Requests\Proveedores;

use Illuminate\Foundation\Http\FormRequest;

class StoreProveedorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nombre'     => ['required', 'string', 'max:150'],
            'tipo'       => ['required', 'string', 'in:empresa,particular'],
            'pais'       => ['nullable', 'string', 'max:80'],
            'contacto'   => ['nullable', 'string', 'max:100'],
            'telefono'   => ['nullable', 'string', 'max:30'],
            'email'      => ['nullable', 'email', 'max:150'],
            'usuario_id' => ['nullable', 'integer', 'exists:usuarios,id'],
        ];
    }
}
