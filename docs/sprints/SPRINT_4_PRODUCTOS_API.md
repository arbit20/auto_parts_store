# Sprint 4 - Productos API

## Objetivo

Implementar API CRUD de productos con relaciones listas para UI.

## Cambios realizados

- Se creo `ProductoController`.
- Se crearon requests de store y update.
- Se creo `ProductoResource`.
- Se agregaron rutas `apiResource` protegidas.
- Se agrego busqueda por codigo, nombre y descripcion.
- Se agrego paginacion.
- Se cargaron relaciones con `with()`.
- Se devolvieron relaciones por nombre:
  - categoria
  - marca de pieza
  - compatibilidades
  - imagenes
  - ofertas
  - vendedor
- Se calculo `precio_desde` y `stock_total`.
- Se valido create/update.
- Se manejo delete de productos con ofertas asociadas.
- Se agregaron tests de feature para productos.

## Archivos principales

- `backend/app/Http/Controllers/Api/ProductoController.php`
- `backend/app/Http/Requests/Productos/StoreProductoRequest.php`
- `backend/app/Http/Requests/Productos/UpdateProductoRequest.php`
- `backend/app/Http/Resources/ProductoResource.php`
- `backend/routes/api.php`
- `backend/tests/Feature/ProductoApiTest.php`
- `backend/tests/Feature/Support/CreatesDomainSchema.php`

## Verificacion

- `docker compose exec -T backend php artisan test --filter=ProductoApiTest`
- Acceder a productos desde la UI despues de login.

## Resultado esperado

La API entrega productos paginados, buscables y con relaciones legibles para el
frontend.
