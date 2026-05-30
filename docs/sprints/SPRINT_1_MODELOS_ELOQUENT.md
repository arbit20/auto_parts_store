# Sprint 1 - Modelos Eloquent

## Objetivo

Mapear las tablas de dominio existentes a modelos Laravel con relaciones
explicitas.

## Cambios realizados

- Se crearon modelos Eloquent para las entidades principales:
  - `Producto`
  - `Categoria`
  - `MarcaPieza`
  - `MarcaVehiculo`
  - `ModeloVehiculo`
  - `Compatibilidad`
  - `ProductoImagen`
  - `Oferta`
  - `Proveedor`
  - `Usuario`
  - `Rol`
- Se definieron nombres de tabla con `$table`.
- Se desactivaron timestamps Laravel donde las tablas no los usan.
- Se definieron `$fillable` para escritura controlada.
- Se agregaron casts para booleanos, decimales, enteros y fechas.
- Se modelaron relaciones:
  - producto a categoria
  - producto a marca de pieza
  - producto a compatibilidades
  - compatibilidad a modelo vehiculo
  - modelo vehiculo a marca vehiculo
  - producto a imagenes
  - producto a ofertas
  - oferta a vendedor/proveedor
  - categoria a categoria padre e hijas
  - usuario de dominio a roles

## Archivos principales

- `backend/app/Models/Producto.php`
- `backend/app/Models/Categoria.php`
- `backend/app/Models/MarcaPieza.php`
- `backend/app/Models/MarcaVehiculo.php`
- `backend/app/Models/ModeloVehiculo.php`
- `backend/app/Models/Compatibilidad.php`
- `backend/app/Models/ProductoImagen.php`
- `backend/app/Models/Oferta.php`
- `backend/app/Models/Proveedor.php`
- `backend/app/Models/Usuario.php`
- `backend/app/Models/Rol.php`

## Verificacion

Comandos documentados en `VERIFICACION_SPRINTS_0_6.txt`.

Ejemplos esperados:

- Producto: `Pastillas de freno delanteras`
- Categoria: `Filtros / padre: Motor`
- Usuario de dominio: `Arbit`

## Resultado esperado

Laravel puede leer entidades de dominio y navegar relaciones por nombre sin que
el frontend tenga que resolver IDs manualmente.
