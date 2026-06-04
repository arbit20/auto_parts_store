<?php

declare(strict_types=1);

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;

class StoreUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nombre'   => ['required', 'string', 'max:100'],
            'apellido' => ['nullable', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:150', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'ci_nit'   => ['nullable', 'string', 'max:30'],
            'estado'   => ['required', 'string', 'in:activo,inactivo,bloqueado'],
            'roles'    => ['array'],
            'roles.*'  => ['integer', 'exists:roles,id'],
        ];
    }
}
