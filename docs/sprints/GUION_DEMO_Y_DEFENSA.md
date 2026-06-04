# Guion de demo y defensa — BAGG Auto Parts Store

> Documento de estabilización (Sprint 12). Úsalo para el ensayo cronometrado y como apoyo en la defensa. Datos sembrados ⇒ todo tiene contenido real.

## 0. Antes de empezar (montaje, ~3 min)

```powershell
cd D:\auto_parts_store
docker compose up -d            # levanta los 4 servicios
docker compose ps               # esperar mariadb/backend/frontend = healthy
```

- Frontend: **http://localhost:5174**  (el 5173 lo ocupa otro proyecto; el `.env` mapea a 5174)
- Backend health: **http://localhost:8000/api/health**
- phpMyAdmin: **http://localhost:8081**
- Credenciales demo: **test@example.com** / **password**

**Reset limpio (si algo quedó sucio):** `docker compose down -v && docker compose up -d` (reimporta el SQL y resiembra).

---

## 1. Libreto del demo grupal (nota continua · silencioso)

> Orden a prueba de fallos: empezar por lo sólido, terminar con el "wow" (M:N).

1. **Login** → entrar con las credenciales demo. Muestra auth Sanctum + ruta protegida (si entras a `/proveedores` sin sesión, redirige a login).
2. **Productos / Index** → tabla con **categoría y marca por nombre** (no IDs), precio y stock. Usar el **buscador** ("freno"). Mostrar **estado vacío** filtrando algo inexistente ("zzz").
3. **Productos / Show** → detalle con **compatibilidades legibles** ("Toyota Corolla…"), imágenes y ofertas 1P/3P con **nombre del vendedor**.
4. **Crear producto** → en el formulario, pulsar Guardar vacío para mostrar el **mensaje de validación inline**; luego completar → **toast de éxito + redirección al index** (aparece el nuevo).
5. **Editar / Eliminar** → editar el producto y guardar; eliminar con el **diálogo de confirmación accesible** (no `window.confirm`).
6. **Categorías** → crear/editar mostrando **categoría padre por nombre** (auto-relación jerárquica).
7. **Proveedores** → listado con **usuario y país por nombre**; crear/eliminar (3er CRUD, `belongsTo` opcional).
8. **Usuarios y roles (BONUS, el "wow")** → el listado muestra los **roles como badges por nombre**; *Jorge Ticona* tiene **dos roles** (cliente + proveedor) = **muchos-a-muchos visible**. Crear un usuario marcando **varios roles** (checkboxes) → aparece con sus badges.
9. *(técnico, si hay preguntas)* mostrar `/api/health`, un endpoint en Postman con la cookie de sesión, y las **queries de integridad** (abajo) dando 0 filas.

**Reglas:** nunca improvisar rutas; si algo falla, pasar al Plan B (capturas/video) sin detenerse.

---

## 2. Pruebas de integridad (defensa técnica)

Las 3 consultas `[DEBE=0]` del esquema `bagg_autopartes__v2.sql` deben devolver **0 filas** (prueba de que el modelo quedó consistente):

```powershell
docker compose exec -T backend php artisan tinker --execute "echo DB::table('ofertas')->whereRaw(\"(tipo_venta='propio' AND (vendedor_id IS NOT NULL OR precio_compra<=0)) OR (tipo_venta='marketplace' AND (vendedor_id IS NULL OR comision_pct<=0))\")->count();"
```

- `ofertas_inconsistentes` (regla 1P/3P) = **0** ✅
- `usuarios_sin_rol` = **0** ✅
- `stock_vs_kardex` (stock vs libro de inventario) = **0** ✅

Backend: **35 tests** (`docker compose exec -T backend php artisan test`).
E2E: `corepack pnpm --dir frontend test:e2e` (login, CRUD Productos/Proveedores, M:N Usuarios).

---

## 3. División de defensa individual (nota procesual)

### Integrante A — Backend & Datos
- **ORM/Eloquent**: cómo los modelos mapean tablas en español; `$fillable`, `$timestamps=false`, columnas `creado_en`.
- **Relaciones**: `belongsTo`/`hasMany`/`belongsToMany`. Ejemplos en vivo: Producto→Categoría (belongsTo), Usuario↔Rol (M:N vía `usuario_rol`).
- **Migraciones vs SQL**: el dominio vive en SQL versionado (`v1`+`v2`); las migraciones de Laravel aportan las tablas de auth (`users`, `personal_access_tokens`) dentro de `bagg_autopartes`.
- **Controllers & routes**: API Resource Controllers, `apiResource`, middleware `auth:sanctum`. Mencionar el detalle del **parámetro de ruta fijado** para `proveedores`/`usuarios` (el inflector inglés singulariza mal el español).
- **Sanctum/tokens**: flujo SPA cookie + CSRF (`/sanctum/csrf-cookie`).

### Integrante B — Frontend & UX
- **Vistas (Blade→React)**: arquitectura desacoplada SPA+API. El rol de las vistas Blade lo cumplen los componentes React; `@foreach` ≡ `.map()`, `{{ $var }}` ≡ `{var}` en JSX; los controladores devuelven JSON que React consume con `fetch`.
- **Tailwind/Vite**: tokens de diseño, utilidades, HMR, build de Vite.
- **Listado y lógica de datos**: cómo el Index consume la API, pagina, busca y muestra **relaciones por nombre**.
- **Validación**: doble validación (cliente con react-hook-form + zod; servidor con FormRequest).
- **Estados y accesibilidad**: loading/empty/error boundary; toasts con live region; diálogo de confirmación accesible (radix); labels y `aria-*`.
- **Consumo de API + auth**: cliente HTTP con `withCredentials`, `ProtectedRoute`, `AuthContext`.

---

## 4. Limitación conocida (ser honestos en la defensa)

La **autorización por roles** dentro del área autenticada es una mejora futura: el modelo de auth (`User` de Sanctum) está desacoplado del modelo de dominio (`Usuario`/roles). Todas las rutas exigen `auth:sanctum`; el sistema de roles del dominio se modeló como **entidad CRUD** para demostrar la relación M:N, no como control de acceso del login. El MVP opera con una sola cuenta administrativa. Ver `HALLAZGOS_REVISION_S7.md`.

---

## 5. Plan B (si falla la red/Docker en vivo)

- Tener **capturas** o un **video** del recorrido §1 grabado de antemano.
- Tener la BD reseteada y el stack levantado **antes** de entrar a defender.
- Si un contenedor no levanta: `docker compose restart <servicio>`; si el frontend no recarga cambios: `docker compose restart frontend`.
