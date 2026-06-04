<?php

namespace App\Http\Requests\Categorias;

use App\Models\Categoria;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCategoriaRequest extends FormRequest
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
            'nombre' => ['sometimes', 'required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'categoria_padre_id' => ['nullable', 'integer', 'exists:categorias,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('categoria_padre_id') || $this->input('categoria_padre_id') === null) {
                return;
            }

            $categoria = $this->route('categoria');
            $categoriaId = $categoria instanceof Categoria ? $categoria->id : (int) $categoria;
            $parentId = (int) $this->input('categoria_padre_id');

            if ($parentId === $categoriaId || $this->parentIsDescendant($categoriaId, $parentId)) {
                $validator->errors()->add('categoria_padre_id', 'La categoria padre no puede ser la misma categoria ni una descendiente.');
            }
        });
    }

    private function parentIsDescendant(int $categoriaId, int $parentId): bool
    {
        while ($parentId !== 0) {
            $parent = Categoria::query()->find($parentId);

            if ($parent === null || $parent->categoria_padre_id === null) {
                return false;
            }

            if ((int) $parent->categoria_padre_id === $categoriaId) {
                return true;
            }

            $parentId = (int) $parent->categoria_padre_id;
        }

        return false;
    }
}
