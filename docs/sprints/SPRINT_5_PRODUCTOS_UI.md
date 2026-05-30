# Sprint 5 - Productos UI

## Objetivo

Implementar CRUD completo de productos desde React.

## Cambios realizados

- Se creo listado de productos.
- Se agrego busqueda.
- Se agrego paginacion.
- Se creo detalle de producto.
- Se creo formulario de creacion.
- Se creo formulario de edicion.
- Se agrego eliminacion con confirmacion.
- Se integraron toasts.
- Se agregaron estados:
  - loading
  - empty
  - error
- Se mostraron relaciones por nombre.
- Se redirige o refresca el listado despues de guardar.

## Archivos principales

- `frontend/src/features/products/ProductosIndexPage.tsx`
- `frontend/src/features/products/ProductoShowPage.tsx`
- `frontend/src/features/products/ProductoFormPage.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/types.ts`
- `frontend/src/App.tsx`

## Verificacion

- Login en UI.
- Crear producto `TEST-001`.
- Buscar producto.
- Ver detalle.
- Editar producto.
- Probar validacion dejando campos requeridos vacios.
- Eliminar producto con confirmacion.

## Resultado esperado

El usuario puede completar todo el ciclo CRUD de productos desde la interfaz.
