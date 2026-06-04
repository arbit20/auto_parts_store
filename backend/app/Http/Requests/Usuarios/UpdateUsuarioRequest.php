<?php

declare(strict_types=1);

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $usuario = $this->route('usuario');
        $usuarioId = is_object($usuario) ? $usuario->id : (int) $usuario;

        return [
            'nombre'   => ['sometimes', 'required', 'string', 'max:100'],
            'apellido' => ['nullable', 'string', 'max:100'],
            'email'    => ['sometimes', 'required', 'email', 'max:150', Rule::unique('usuarios', 'email')->ignore($usuarioId)],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'ci_nit'   => ['nullable', 'string', 'max:30'],
            'estado'   => ['sometimes', 'required', 'string', 'in:activo,inactivo,bloqueado'],
            'roles'    => ['array'],
            'roles.*'  => ['integer', 'exists:roles,id'],
        ];
    }
}
