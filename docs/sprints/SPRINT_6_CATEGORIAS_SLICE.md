# Sprint 6 - Categorias vertical slice

## Objetivo

Replicar el patron backend + frontend para categorias como segundo slice
vertical del MVP.

## Cambios realizados

- Se creo `CategoriaController`.
- Se crearon requests de store y update.
- Se creo `CategoriaResource`.
- Se agregaron rutas `apiResource` protegidas.
- Se agrego busqueda y paginacion.
- Se muestra `categoriaPadre.nombre`.
- Se valida que una categoria no pueda ser su propio padre.
- Se bloquea delete si la categoria tiene productos o categorias hijas.
- Se creo listado de categorias en frontend.
- Se creo formulario de crear/editar categoria.
- Se agregaron tests de feature para categorias.

## Archivos principales

- `backend/app/Http/Controllers/Api/CategoriaController.php`
- `backend/app/Http/Requests/Categorias/StoreCategoriaRequest.php`
- `backend/app/Http/Requests/Categorias/UpdateCategoriaRequest.php`
- `backend/app/Http/Resources/CategoriaResource.php`
- `frontend/src/features/categories/CategoriasIndexPage.tsx`
- `frontend/src/features/categories/CategoriaFormPage.tsx`
- `backend/tests/Feature/CategoriaApiTest.php`

## Verificacion

- `docker compose exec -T backend php artisan test --filter=CategoriaApiTest`
- Crear categoria desde UI.
- Editar categoria.
- Intentar asignar padre invalido.
- Eliminar categoria vacia.
- Intentar eliminar categoria con productos o hijas.

## Resultado esperado

Categorias tiene un CRUD funcional y respeta reglas de integridad de negocio.
