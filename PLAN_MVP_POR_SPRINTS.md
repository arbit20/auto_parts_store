# 📋 PLAN_MVP_POR_SPRINTS.md — BAGG Auto Parts Store

> **Documento técnico y académico** · Defensa final de semestre · Generado 2026-05-30
> **Stack**: React 19 + Vite 8 + Tailwind 4 (SPA) · Laravel 13 + Sanctum (API) · MariaDB 11.8 (`bagg_autopartes`) · Docker Compose · pnpm monorepo
> **Equipo**: 2 integrantes · **Meta**: MVP funcional, demostrable y defendible (25 pts)
> ⚠️ **Antes de empezar**: reemplazar `[FECHA_DEFENSA]` por la fecha real y ajustar el ritmo de sprints a los días disponibles.

---

## 1. Objetivo

Convertir el avance actual (bootstrap) en un **MVP funcional para defensa final**, organizado en sprints pequeños, verificables y ejecutables — cada uno cabe en **una sola ventana de contexto / sesión de trabajo** para no saturar al modelo ni al equipo. El plan responde a: qué está hecho, qué falta, qué priorizar para maximizar la nota, qué mostrar en pantalla y qué explica cada integrante.

---

## 2. Diagnóstico del estado actual (radiografía)

### 2.1 Matriz Hecho / Incompleto / Roto / Falta

| Capa | ✅ HECHO | 🟡 INCOMPLETO | 🔴 ROTO / RIESGO | ⬜ FALTA (para MVP) |
|---|---|---|---|---|
| **Infra/Docker** | `docker-compose.yml` (frontend, backend, mariadb, phpmyadmin) con healthchecks, volúmenes, redes; README excelente | — | Healthcheck backend apunta a `/api/health` (verificar que responde 200, no 404) | — |
| **Backend** | Sanctum instalado; `/api/health`, `/api/user`, `/`; modelo `User`; seeder de 1 usuario test | Auth (instalada, sin endpoints login/register/logout) | — | Modelos de dominio, controllers, FormRequests, API Resources, rutas resource, tests reales |
| **Frontend** | Starter Vite; deps instaladas (react-hook-form, @hookform/resolvers, zod, radix-ui, lucide, tailwind-merge, CVA); tokens de diseño (oklch, dark mode); tsconfig strict; `cn()` util | `components.json` de shadcn configurado pero sin componentes generados | `index.html` `<title>` = `vite-scaffold-tmp`; sin proxy Vite → **CORS romperá llamadas a la API en dev** | Router, cliente HTTP, TanStack Query, formularios, estado/auth, todas las vistas CRUD, runner de tests |
| **Base de datos** | Esquema `bagg_autopartes` v1+v2: ~35 tablas, FKs, triggers (kardex/stock), constraints (XOR import, 1P/3P), **datos sembrados** de demo | — | **Mismatch dual-DB**: app apunta a `auto_parts_store` (vacía de dominio) ↔ dominio en `bagg_autopartes` → la app no "ve" el dominio | Modelos Eloquent que mapeen las tablas; columnas timestamp en español (`creado_en`/`actualizado_en`) |
| **Auth/Seguridad** | Sanctum config (stateful: 5173/8000); tabla `personal_access_tokens` | Provider de auth sin endpoints | `.env.example` con credenciales por defecto (OK como ejemplo; **no commitear `.env` real**) | Login/register/logout, protección de rutas, rate limit, validación en todos los endpoints |
| **Tests** | `phpunit.xml` (SQLite memoria), ESLint flat config | — | Tests = stubs triviales (pasan porque no hay nada) | Feature tests API, E2E Playwright, smoke de demo |
| **Docs** | README de colaboradores (nivel oro), guía de setup | — | `backend/README.md` es boilerplate genérico | Este plan; guion de defensa |

### 2.2 El problema central (a resolver en Sprint 0–1)

```
HOY:   Laravel ──conecta──▶ auto_parts_store   (solo users, cache, jobs, tokens)  ❌ sin dominio
       SQL    ──define────▶ bagg_autopartes     (~35 tablas + datos)              ❌ sin modelos

MVP:   Laravel ──conecta──▶ bagg_autopartes     (DB_DATABASE=bagg_autopartes)
              + migraciones de auth de Laravel (users, sessions, personal_access_tokens) DENTRO de bagg_autopartes
              + modelos Eloquent sobre las tablas de dominio existentes
```
**Por qué es el primer dominó**: sin esto, nada del frontend tiene datos reales que mostrar y la rúbrica de "relaciones visibles" no se puede cumplir. Es config trivial (`config/database.php` ya usa `env('DB_CONNECTION')`), no cirugía.

### 2.3 Activos reutilizables (no reinventar — principio ECC "Research & Reuse")

- **Datos de demo ya sembrados** en `bagg_autopartes_v1.sql`: 5 productos reales (FRN-001 frenos, FLT-002 filtro, ELE-003 bujía, SUS-004 amortiguador, ELE-005 batería), categorías, marcas, modelos de vehículo, compatibilidades, 7 ofertas (1P/3P), proveedores, 2 pedidos, envíos, pagos, 1 reseña. **No hay que sembrar a mano**: el demo tiene contenido real desde el minuto cero.
- **Deps frontend ya instaladas**: `react-hook-form`+`@hookform/resolvers`+`zod` (formularios+validación), `radix-ui`+`lucide-react`+`tailwind-variants`+CVA (UI), `recharts` (gráficas opcionales). Solo faltan: `react-router-dom`, cliente HTTP (axios o wrapper fetch), `@tanstack/react-query`, runner de tests (vitest/playwright).
- **Consultas de validación SQL** dentro de `bagg_autopartes__v2.sql` (16 queries que deben dar 0 filas): úsalas como **prueba de integridad** en la defensa técnica.

---

## 3. Decisiones de arquitectura (y el "tema Blade")

| Decisión | Elección | Razón |
|---|---|---|
| Conexión a dominio | `DB_DATABASE=bagg_autopartes` + modelos Eloquent sobre tablas existentes | Camino más rápido y seguro; reusa datos y relaciones reales |
| Auth | Sanctum SPA (cookie) con tablas de auth de Laravel migradas dentro de `bagg_autopartes`; la tabla de dominio `usuarios` se trata como **entidad CRUD** (no como login) | Evita pelear con el esquema de `usuarios`; además `usuarios↔roles` (M:N) es un excelente CRUD con relaciones para el demo |
| Timestamps | Modelos con `const CREATED_AT='creado_en'; const UPDATED_AT='actualizado_en';` o `$timestamps=false` según la tabla | Las columnas del esquema están en español; sin esto, Eloquent rompe |
| Capa de servicios | Controllers delgados + validación en FormRequest + (opcional) servicios para lógica de pedidos | ECC PHP: "thin controllers, explicit services" |

### ⚠️ Tensión rúbrica ↔ arquitectura: **no hay Blade**
La rúbrica de defensa individual menciona **Blade**, pero el proyecto es **SPA React + API JSON** (sin vistas Blade). Dos acciones:
1. **Narrativa (obligatoria)**: cada integrante debe poder decir *"Usamos arquitectura desacoplada SPA+API. El rol de las vistas Blade lo cumplen los componentes React; los controladores son API Resource Controllers que devuelven JSON consumido por React vía fetch/axios. El equivalente a `@foreach` de Blade es el `.map()` de React, y el de `{{ $var }}` es `{var}` en JSX."*
2. **Seguro de nota (opcional, Sprint 10)**: agregar **UNA** vista Blade server-rendered (`GET /productos` en `web.php`, `resources/views/productos/index.blade.php` con Eloquent + Tailwind por CDN/build). Costo bajo, permite demostrar Blade literal si el docente lo exige. Marcado **opcional / seguro**.

---

## 4. Mapeo Rúbrica → Qué construir (los 25 pts)

### 4.1 Nota continua (15 pts · grupal · demo silencioso en navegador)

| # | Criterio | Estado | Evidencia en pantalla | Sprint que lo cubre |
|---|---|---|---|---|
| 1 | **CRUD escritura** (Create/Update/Delete) sin errores, guarda en BD, redirige | Obligatorio | Crear/editar/eliminar producto desde formularios; toast de éxito; redirección a index | S4–S5, S6, S7 |
| 2 | **CRUD lectura** (Index/Show) con **relaciones visibles** (nombres, no IDs) | Obligatorio | Index productos muestra **categoría.nombre**, **marca.nombre**, precio, stock; Show muestra compatibilidades "Toyota Corolla 2010-2018" | S4–S5 |
| 3 | Validación de formularios | Supuesto a confirmar | Campos requeridos, mensajes inline (zod + FormRequest) | S4–S5 (patrón), todos |
| 4 | Mensajes de éxito/error | Supuesto | Toasts/alerts visibles, sin stack traces | S4, S11 |
| 5 | Estados vacíos | Supuesto | "No hay productos aún" en listas vacías | S5, S11 |
| 6 | Búsqueda / filtro / paginación | Supuesto | Buscador por nombre/código + paginación servidor | S4 (backend), S5 (UI) |
| 7 | Seguridad básica / protección de rutas | Supuesto | Rutas API tras `auth:sanctum`; guard de rutas en React; rate limit en login | S2, S3, S11 |
| 8 | Consistencia visual (Tailwind/Vite) | Supuesto | Layout, header/nav, tokens, sin "look starter" | S3, S11 |
| 9 | Sin errores visibles | Supuesto | Sin errores en consola ni pantallas blancas; error boundary | S11 |

### 4.2 Nota procesual (10 pts · individual)
Cada integrante explica su parte (ver §8). Temas exigidos: **ORM, relaciones, migraciones, seeders, controllers, routes, Blade(→React), Tailwind, listado y lógica de datos, Sanctum/tokens, use cases**.

---

## 5. Modelo de dominio para el MVP (entidades + relaciones visibles)

> Estas son las relaciones que se **muestran como nombres** en Index/Show (Criterio 2).

| Entidad CRUD | Tabla | Relaciones a mostrar (nombre, no ID) |
|---|---|---|
| **Producto** ⭐ | `productos` | `categoria.nombre`, `marcaPieza.nombre`, `compatibilidades → modelo.nombre + marca + años`, `imagenes`, `ofertas → precio/stock + vendedor.nombre (1P=Bagg / 3P)` |
| **Categoría** | `categorias` | `categoriaPadre.nombre` (auto-relación jerárquica) |
| **Proveedor** | `proveedores` | `usuario.nombre` (si tiene portal), `pais`, `tipo` |
| **Usuario+Roles** (bonus M:N) | `usuarios` / `usuario_rol` / `roles` | `roles → rol.nombre` (muchos-a-muchos) |
| **Pedido** (stretch) | `pedidos` | `cliente=usuario.nombre`, `estado`, `total`, `detalle → producto.nombre`, `envios → vendedor.nombre + transportadora`, `pagos → metodo` |

**Relaciones Eloquent clave a definir** (Sprint 1):
- `Producto belongsTo Categoria, MarcaPieza`; `hasMany ProductoImagen, Compatibilidad, Oferta`.
- `Categoria belongsTo Categoria (padre)`; `hasMany Categoria (hijos)`.
- `Oferta belongsTo Producto, Proveedor(vendedor, nullable=1P)`.
- `Compatibilidad belongsTo Producto, ModeloVehiculo`; `ModeloVehiculo belongsTo MarcaVehiculo`.
- `Usuario belongsToMany Rol (usuario_rol)`.
- `Pedido belongsTo Usuario; hasMany DetallePedido, Envio, Pago`.

---

## 6. Estrategia de priorización (MoSCoW) — blindar el demo

> Regla de oro: **terminar siempre con algo demostrable**. Si el tiempo se acaba, se recortan los *Could*, nunca el núcleo.

| Prioridad | Alcance | Sprints | Garantiza |
|---|---|---|---|
| **MUST (núcleo mínimo demoable)** | Infra+DB, modelos, auth, shell frontend, CRUD Productos (con relaciones) | S0–S5 | ≈12/15 de nota continua (Criterios 1 y 2 sólidos) |
| **SHOULD** | CRUD Categorías + Proveedores; búsqueda/paginación; estados vacíos | S6–S7 | 15/15 (cobertura amplia + supuestos) |
| **COULD (stretch)** | Flujo Pedidos→Envíos→Pagos (1P/3P) | S8–S9 | "wow factor" para la defensa |
| **MUST (siempre)** | Hardening, seguridad, tests, estabilización, ensayo | S10–S12 | Demo sin fallos visibles + nota procesual |

**Corte de seguridad**: si a 3 días de `[FECHA_DEFENSA]` no están S8–S9 estables, se **descartan** y se invierte todo en S10–S12. Es preferible 3 CRUD impecables que 4 a medias.

---

## 7. Plan por Sprints

> Cada sprint: **1 ventana de contexto**. Formato: Objetivo · Tareas (con agente/skill) · Archivos · Definition of Done (DoD) · Cómo verificar · Riesgo.
> Convención de commits (ECC): `feat:`, `fix:`, `refactor:`, `test:`, `docs:`. Rama desde `develop`. PR pequeño por sprint.

### 🏗️ Sprint 0 — Cimientos: conectar Laravel a `bagg_autopartes` + CORS
- **Objetivo**: la app "ve" el dominio y el frontend puede llamar a la API sin CORS.
- **Tareas**:
  - Levantar Docker; importar `bagg_autopartes_v1.sql` y `__v2.sql` (orden importa). → *Skill: `docker-development`*
  - `backend/.env`: `DB_DATABASE=bagg_autopartes`; correr migraciones de auth de Laravel dentro de esa BD (`users`, `sessions`, `personal_access_tokens`). → *Agente: `database-reviewer`*
  - Verificar `/api/health` = 200; `php artisan tinker` → `DB::table('productos')->count()` ≥ 5.
  - Frontend: `frontend/.env` con `VITE_API_URL`; proxy en `vite.config.ts` (`server.proxy`) o CORS en backend. → *Agente: `build-error-resolver`*
- **DoD**: health 200 · tinker cuenta productos · `fetch(VITE_API_URL+'/health')` desde el browser sin error CORS.
- **Verificar**: `pnpm dev` arriba; consola del browser limpia.
- **Riesgo**: choque de tablas `users` ↔ `usuarios` (son distintas, OK). Mitigación: confirmar que las migraciones de auth no colisionan con tablas de dominio.

### 🧱 Sprint 1 — Modelos Eloquent + relaciones (sobre tablas existentes, sin migraciones de dominio)
- **Objetivo**: capa de datos navegable desde tinker.
- **Tareas** (*Agentes: `code-architect`, `database-reviewer`; Skill: `database-designer`, `senior-backend`*):
  - Crear modelos: `Producto, Categoria, MarcaPieza, MarcaVehiculo, ModeloVehiculo, Compatibilidad, ProductoImagen, Oferta, Proveedor, Usuario(dominio), Rol` (+ stretch: `Pedido, DetallePedido, Envio, Pago`).
  - Por modelo: `$table`, `$fillable` (whitelist mass-assignment — ECC seguridad), `CREATED_AT/UPDATED_AT` o `$timestamps=false`, relaciones.
  - Smoke en tinker: `Producto::with(['categoria','marcaPieza','compatibilidades.modelo'])->first()`.
- **DoD**: toda relación resuelve sin error SQL; nombres legibles aparecen.
- **Verificar**: `php artisan tinker` con 3–4 consultas con eager loading.
- **Riesgo**: nombres de columnas FK no estándar → definir `foreignKey`/`ownerKey` explícitos.

### 🔐 Sprint 2 — Autenticación Sanctum (backend) + tests
- **Objetivo**: register/login/logout funcionales y protegidos.
- **Tareas** (*Agentes: `security-reviewer` (obligatorio), `tdd-guide`, `code-reviewer`; Skill: `senior-security`, `laravel-security`*):
  - `AuthController` (register, login, logout) sobre tabla `users` de Laravel; flujo SPA cookie (`/sanctum/csrf-cookie`).
  - Rate limit en login (`throttle`); validación con FormRequest.
  - Feature tests (PHPUnit): register OK, login OK/KO, logout, `/api/user` 401 sin sesión.
- **DoD**: register→login→`/api/user` devuelve usuario; logout invalida; tests verdes.
- **Verificar**: Postman/cURL del flujo + `php artisan test`.
- **Riesgo**: config CSRF/stateful domains. Mitigación: `SANCTUM_STATEFUL_DOMAINS` y `withCredentials` alineados.

### 🎨 Sprint 3 — Shell del frontend: router + cliente HTTP + auth context + login UI + layout
- **Objetivo**: cascarón navegable y autenticado, con identidad visual (no "starter").
- **Tareas** (*Agentes: `typescript-reviewer`, `code-reviewer`; Skill: `ui-ux-pro-max`, `design-system`, `senior-frontend`*):
  - Instalar `react-router-dom`, cliente HTTP (axios con `withCredentials`/`baseURL=VITE_API_URL`), `@tanstack/react-query`.
  - `AuthContext`/store (Context o zustand), `ProtectedRoute`, `Login` page, `AppLayout` (header/nav/footer semántico).
  - Limpiar `App.tsx` starter; `<title>` real; scaffolding shadcn (button, input, table, dialog, sonner/toast).
- **DoD**: login navega a dashboard; ruta protegida redirige a `/login` sin sesión; consola limpia.
- **Verificar**: flujo login en browser + Playwright smoke (stretch).
- **Riesgo**: cookies cross-site en dev → usar proxy Vite para mismo origen.

### 📦 Sprint 4 — Productos: backend (controller + requests + resource + tests)
- **Objetivo**: API REST completa de Productos con relaciones, búsqueda y paginación.
- **Tareas** (*Agentes: `code-architect`, `code-reviewer`, `security-reviewer`, `tdd-guide`; Skill: `api-design-reviewer`, `api-test-suite-builder`, `laravel-patterns`*):
  - `ProductoController` (index con `with()` + `search` + paginación; show; store; update; destroy).
  - `StoreProductoRequest`/`UpdateProductoRequest` (validación, reglas, `unique:productos,codigo`).
  - `ProductoResource` (envoltura consistente; incluye `categoria.nombre`, `marca.nombre`, compatibilidades).
  - Rutas `Route::apiResource('productos', ...)` tras `auth:sanctum`.
  - Feature tests: 5 verbos happy-path + fallos de validación.
- **DoD**: los 5 verbos pasan en Postman; tests verdes; JSON muestra nombres, no IDs; paginación funciona.
- **Verificar**: colección Postman + `php artisan test`.

### 🖥️ Sprint 5 — Productos: frontend (index/show/create/edit/delete) — **el corazón del demo**
- **Objetivo**: loop CRUD completo en navegador, pulido, cumpliendo Criterios 1 y 2.
- **Tareas** (*Agentes: `typescript-reviewer`, `code-reviewer`, `a11y-audit` (skill); Skill: `ui-ux-pro-max`, `form-cro`*):
  - `ProductosIndex` (tabla con categoría/marca/precio/stock, buscador, paginación, **estado vacío**, eliminar con diálogo de confirmación + toast).
  - `ProductoShow` (detalle con relaciones como nombres + compatibilidades legibles + imágenes).
  - `ProductoForm` (create/edit con react-hook-form + zod, mensajes inline, **redirección al index** en éxito).
  - TanStack Query (cache, invalidación tras mutaciones, optimistic opcional).
- **DoD**: crear→editar→eliminar sin errores visibles; relaciones por nombre; redirecciones y toasts OK; sin errores en consola.
- **Verificar**: recorrido manual + E2E Playwright del flujo CRUD.
- **Riesgo**: este sprint puede desbordar una ventana → si pasa, partir en S5a (index+show) y S5b (form+delete).

### 📂 Sprint 6 — Categorías: slice vertical (backend+frontend) reusando patrón
- **Objetivo**: 2º CRUD; demuestra **auto-relación** (categoría padre/hijo) — relación visible "elegante".
- **Tareas**: replicar patrón S4+S5 para `Categoria` (mostrar `categoriaPadre.nombre`; selector de padre en el form). *Agentes/Skills igual que S4–S5.*
- **DoD**: CRUD categorías OK; Show/Index muestran categoría padre por nombre.
- **Riesgo**: ciclos en jerarquía → validar que una categoría no sea su propio ancestro.

### 🏭 Sprint 7 — Proveedores (+ bonus Usuarios↔Roles M:N): slice vertical
- **Objetivo**: 3er CRUD; demuestra **belongsTo opcional** y, como bonus, **muchos-a-muchos**.
- **Tareas**: patrón S4+S5 para `Proveedor` (mostrar `usuario.nombre`, `pais`, `tipo`). Bonus: CRUD `Usuario` con asignación de `roles` (checkboxes M:N). *Agentes/Skills igual.*
- **DoD**: CRUD proveedores OK; bonus M:N si hay tiempo.

### 🛒 Sprint 8 — *(STRETCH)* Pedidos: backend (read + crear pedido 1P/3P + estados)
- **Objetivo**: exhibir el flujo de negocio diferenciador (1P propio / 3P marketplace, multi-vendedor → multi-envío).
- **Tareas** (*Agentes: `code-architect`, `security-reviewer`, `tdd-guide`; Skill: `laravel-patterns`*):
  - `PedidoController` (index/show con detalle+envíos+pagos); endpoint "crear pedido" desde carrito/ofertas; transición de estado (`pedido_estado_historial`).
  - Servicio de dominio para armar pedido (respetar triggers de stock 1P).
- **DoD**: crear pedido mixto 1P/3P; ver 2 envíos; cambiar estado registra historial; tests del happy-path.
- **Riesgo**: alto (lógica de negocio). Es **COULD** — recortable.

### 🧾 Sprint 9 — *(STRETCH)* Pedidos: frontend (listado, detalle, cambio de estado, pago)
- **Tareas**: vistas de pedidos (listado con cliente/total/estado; detalle con productos/envíos/pagos; acción de cambiar estado y registrar pago). *Agentes/Skills frontend igual que S5.*
- **DoD**: flujo de pedido visible en pantalla; estados y pagos reflejados.

### 🛡️ Sprint 10 — Hardening, seguridad y consistencia visual
- **Objetivo**: cerrar los "supuestos a confirmar" de la rúbrica.
- **Tareas** (*Agentes: `security-reviewer`, `refactor-cleaner`, `code-reviewer`; Skill: `security-guidance`, `quality-gate`*):
  - Estados vacíos y de carga (skeletons) en todas las listas; **error boundary** global.
  - Seguridad: confirmar todas las rutas tras `auth:sanctum`; rate limit; sin secretos en repo (`git grep` de claves); validar todos los inputs; CORS final.
  - Consistencia Tailwind: tokens, spacing, hover/focus states; quitar restos del starter; `<title>`/favicon.
  - **(Opcional/seguro) Vista Blade puente** `GET /productos` para narrativa de defensa.
- **DoD**: checklist de seguridad ECC ✔; sin warnings de consola; UI coherente.

### 🧪 Sprint 11 — Pruebas (backend + E2E + smoke + validación SQL)
- **Objetivo**: confianza de que el demo no fallará.
- **Tareas** (*Agentes: `tdd-guide`, `e2e-runner`; Skill: `playwright-pro`, `test-coverage`, `api-test-suite-builder`*):
  - Backend: feature tests de todos los controllers (happy + validación); meta ECC 80% enfocada en controllers/requests.
  - Frontend: instalar Playwright; E2E de los flujos críticos (login, CRUD Productos, Categorías, Proveedores).
  - Smoke manual scriptado (checklist del demo); correr las **16 queries de validación** de `__v2.sql` (deben dar 0 filas) como prueba de integridad para la defensa técnica.
- **DoD**: suite verde; E2E de flujos críticos pasa; queries de integridad en 0.

### 🚦 Sprint 12 — Estabilización, ensayo de demo y guiones de defensa
- **Objetivo**: versión estable congelada + equipo listo para defender.
- **Tareas** (*Skill: `ship-gate`, `runbook-generator`, `demo-video` (opcional)*):
  - **Freeze** de features; solo fixes. Tag/rama estable.
  - Reset de BD con seed limpio (`v1+v2`) → datos predecibles para el demo.
  - **Ensayo cronometrado** del libreto (§9) 2–3 veces; medir tiempos; preparar **Plan B** (capturas/video por si falla la red/Docker).
  - Cerrar guiones individuales (§8); repaso cruzado (cada quien defiende también lo del otro a nivel básico).
- **DoD**: demo ejecutado de principio a fin sin fallos ≥2 veces; ambos integrantes responden el set de preguntas de §8.

---

## 8. División de trabajo y defensa individual (2 integrantes · nota procesual 10 pts)

> Propiedad **primaria** + **cross-training obligatorio**: cada integrante lidera su mitad pero debe poder explicar la del otro a nivel básico (la nota procesual es individual y el docente puede preguntar cualquier cosa).

### Integrante A — "Backend & Datos lead"
- **Owns**: S0, S1, S2, backend de S4/S6/S7/S8, S11 backend.
- **Agentes principales**: `database-reviewer`, `code-architect`, `security-reviewer`, `tdd-guide`.
- **Guion de defensa** (debe explicar y demostrar):
  - **ORM/Eloquent**: cómo los modelos mapean tablas; `$fillable`, casts, timestamps en español.
  - **Relaciones**: belongsTo/hasMany/belongsToMany con ejemplo (Producto→Categoría; Usuario↔Roles).
  - **Migraciones vs SQL**: por qué el dominio vive en SQL versionado (`v1`+`v2`) y las migraciones de auth en Laravel; qué hace cada una.
  - **Seeders**: los datos de demo provienen del SQL sembrado; rol de `DatabaseSeeder`.
  - **Controllers & routes**: API Resource Controllers, `apiResource`, middleware `auth:sanctum`.
  - **Sanctum/tokens**: flujo SPA cookie + CSRF; mostrar en Postman.
  - **Use cases**: crear/editar producto; (stretch) armar pedido 1P/3P.

### Integrante B — "Frontend & UX lead"
- **Owns**: S3, frontend de S5/S6/S7/S9, S10 visual, S11 E2E, libreto del demo.
- **Agentes principales**: `typescript-reviewer`, `code-reviewer`, `e2e-runner`; Skills `ui-ux-pro-max`, `playwright-pro`.
- **Guion de defensa**:
  - **Vistas (Blade→React)**: la narrativa de §3 (componentes React = vistas; `.map()` = `@foreach`; JSX = `{{ }}`); opcionalmente la vista Blade puente.
  - **Tailwind/Vite**: tokens de diseño, utilidades, build de Vite, HMR.
  - **Listado y lógica de datos**: cómo Index consume la API, pagina, busca y muestra **relaciones por nombre**.
  - **Validación de formularios**: react-hook-form + zod; mensajes; doble validación (cliente + servidor).
  - **Estados y errores**: loading/empty/error boundary; manejo de toasts.
  - **Consumo de API + auth**: cliente HTTP, `withCredentials`, ProtectedRoute.

### Compartido
- S12 (estabilización, ensayo), docs, libreto, Plan B.

---

## 9. Libreto del demo grupal (nota continua · silencioso, solo se ve la pantalla)

> Orden a prueba de fallos: empezar por lo más sólido, terminar con el "wow". Datos sembrados ⇒ todo tiene contenido real.

1. **Login** → entrar (muestra auth funcionando y ruta protegida).
2. **Productos / Index** → tabla con **categoría y marca por nombre**, precio, stock; usar **buscador** y **paginación**; mostrar **estado vacío** filtrando algo inexistente.
3. **Productos / Show** → detalle con **compatibilidades legibles** ("Toyota Corolla 2010–2018"), imágenes, ofertas 1P/3P con **nombre del vendedor**.
4. **Crear producto** → formulario, **provocar un error de validación** (campo vacío) para mostrar el mensaje, luego completar → **toast de éxito + redirección al index** (el nuevo registro aparece).
5. **Editar** ese producto → guardar → cambios reflejados.
6. **Eliminar** → diálogo de confirmación → desaparece de la lista.
7. **Categorías** → repetir create/edit mostrando **categoría padre por nombre** (auto-relación).
8. **Proveedores** → listado con **usuario/país** por nombre.
9. *(stretch)* **Pedidos** → detalle de pedido mixto 1P/3P con **2 envíos** y pago.
10. *(técnico, si hay sección de preguntas o Postman)* mostrar `/api/health`, un endpoint en Postman con token, y 1–2 **queries de validación** dando 0 filas (integridad).

**Reglas del libreto**: nunca improvisar rutas; nunca abrir algo a medio hacer; si algo falla, pasar al Plan B (capturas/video) sin detenerse.

---

## 10. Plan de pruebas

| Nivel | Herramienta | Qué cubre | Sprint |
|---|---|---|---|
| Unit/Feature backend | PHPUnit | Auth + cada controller (happy + validación); meta ECC 80% en controllers/requests | S2, S4, S11 |
| E2E | Playwright | login, CRUD Productos/Categorías/Proveedores, (stretch) pedido | S11 |
| Integridad de datos | SQL | 16 queries de `__v2.sql` = 0 filas (1P/3P, stock vs kardex, XOR import) | S11 |
| Smoke manual | Checklist | El libreto §9 completo, cronometrado | S12 |
| Lint/Type | ESLint + `tsc -b` + Pint/PHPStan | Sin errores de tipo/estilo antes de cada PR | todos |

Comandos clave: `php artisan test` · `pnpm --dir frontend exec tsc -b` · `pnpm --dir frontend build` · `pnpm --dir frontend lint` · `npx playwright test`.

---

## 11. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Alcance ambicioso con 2 personas | Alta | Demo incompleto | MoSCoW §6: blindar S0–S5 primero; cortar S8–S9 a 3 días de la defensa |
| CORS/cookies Sanctum en dev | Media | Login no funciona | Proxy Vite mismo-origen; `SANCTUM_STATEFUL_DOMAINS`; `withCredentials` |
| Mismatch de columnas FK/timestamps español | Media | Errores SQL en Eloquent | Definir FKs/keys y `CREATED_AT/UPDATED_AT` explícitos (S1) |
| Rúbrica espera Blade literal | Media | Pérdida de puntos individuales | Narrativa §3 + vista Blade puente opcional (S10) |
| Triggers de stock al crear pedidos | Media | Inconsistencias 1P/3P | Respetar reglas (movimientos solo 1P); validar con queries §10 |
| Falla en vivo (red/Docker) | Baja | Demo cae | Plan B: video/capturas + BD reseteada (S12) |
| `.env` real commiteado | Baja | Fuga de credenciales | `git grep` de secretos en S10; `.gitignore` ya cubre `.env` |

---

## 12. Checklist maestro — Definition of Done del MVP

**Núcleo (MUST)**
- [ ] Laravel conectado a `bagg_autopartes`; tinker lista productos
- [ ] Modelos Eloquent con relaciones funcionando
- [ ] Auth Sanctum: register/login/logout + rutas protegidas
- [ ] Shell frontend: router, cliente HTTP, auth context, layout sin "look starter"
- [ ] **CRUD Productos** completo (C/U/D + Index/Show con **relaciones por nombre**)
- [ ] Validación (zod + FormRequest), mensajes éxito/error, redirecciones, estados vacíos
- [ ] Búsqueda + paginación

**Amplitud (SHOULD)**
- [ ] CRUD Categorías (auto-relación) y Proveedores
- [ ] (bonus) Usuarios↔Roles M:N

**Stretch (COULD)**
- [ ] Flujo Pedidos→Envíos→Pagos (1P/3P)

**Calidad (MUST siempre)**
- [ ] Seguridad ECC (rutas protegidas, rate limit, sin secretos, inputs validados)
- [ ] Sin errores visibles en consola/pantalla; error boundary
- [ ] Tests backend verdes + E2E de flujos críticos + queries de integridad en 0
- [ ] Demo ensayado ≥2 veces sin fallos + Plan B listo
- [ ] Ambos integrantes defienden su guion (§8) y el del otro a nivel básico

---

## 13. Apéndices

### 13.1 Mapeo Agente especializado → Sprint (ECC)
| Agente | Sprints |
|---|---|
| `database-reviewer` | S0, S1 |
| `code-architect` | S1, S4, S8 |
| `security-reviewer` | S2, S4, S8, S10 |
| `tdd-guide` | S2, S4, S11 |
| `code-reviewer` | todos (post-código) |
| `typescript-reviewer` | S3, S5, S6, S7, S9 |
| `build-error-resolver` | S0, S3 (errores TS/build) |
| `e2e-runner` | S11 |
| `refactor-cleaner` | S10 |
| `doc-updater` | cierre/PRs |

### 13.2 Mapeo Skill (Alireza's claude-skills) → tarea
- `docker-development` → S0 · `database-designer` / `sql-database-assistant` → S1
- `senior-security` / `security-guidance` → S2, S10 · `api-design-reviewer` / `api-test-suite-builder` → S4
- `ui-ux-pro-max` / `design-system` / `form-cro` → S3, S5–S7 · `a11y-audit` → S5, S10
- `laravel-patterns` (vía ECC php) → S4, S8 · `playwright-pro` / `test-coverage` → S11
- `ship-gate` / `runbook-generator` / `quality-gate` → S10–S12 · `sprint-plan` / `user-story` / `agile-product-owner` → refinamiento de backlog

### 13.3 Flujo ECC por sprint (development-workflow)
`Research & Reuse → planner → tdd-guide (RED→GREEN→REFACTOR) → code-reviewer + security-reviewer → commit conventional → PR pequeño contra develop`.

### 13.4 Comandos de arranque (Sprint 0)
```bash
docker compose up --build           # stack completo
# importar dominio (orden importa): v1 luego v2  (ver README §5)
# backend/.env -> DB_DATABASE=bagg_autopartes
cd backend && php artisan migrate --force && php artisan tinker   # DB::table('productos')->count()
pnpm --dir frontend dev
```

> **Siguiente paso tras aprobar este documento**: ejecutar **Sprint 0**. No se escribe código de negocio hasta confirmar el contenido de este documento.
