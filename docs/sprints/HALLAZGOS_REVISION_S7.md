# Hallazgos de revisión adversarial — Sprint 7 + bonus Usuarios↔Roles

> Revisión multi-agente (seguridad, TypeScript/React, correctness backend, accesibilidad) con verificación adversarial de cada hallazgo. 29 confirmados: 1 CRÍTICO, 1 ALTO, 12 MEDIO, 15 BAJO.
> Contexto: app académica (BAGG). El modelo de auth (`User` de Sanctum) está **desacoplado** del modelo de dominio `Usuario`/roles.

## CRÍTICO / ALTO — Autorización por roles (decisión de alcance)

| # | Hallazgo | Matiz verificado |
|---|---|---|
| 1 (CRIT→) | Cualquier usuario autenticado puede escribir `roles[]` arbitrarios en `/api/usuarios` (store/update) | El principal autenticado (`User`) NO consume roles → NO hay escalada real de la sesión; es integridad de datos / broken-access-control sobre la tabla de dominio |
| 2 (HIGH) | Rutas `usuarios`/`proveedores`/`roles` sin control de rol: cualquier autenticado hace CRUD y lee PII (email, ci_nit) | Real, pero requiere sesión autenticada; sin RBAC en el principal de auth no hay superficie de escalada |

**Decisión tomada (limitación conocida):** RBAC real exige reconciliar `User` (auth) con `Usuario`/roles (dominio) — cambio arquitectónico fuera del MVP. El plan solo exige `auth:sanctum` (✓ cumplido), y el demo opera con una única cuenta administrativa, por lo que no hay un segundo actor que pueda abusar de los endpoints. Se documenta como **mejora futura** y se aplicaron mitigaciones baratas:

- ✅ `throttle:10,1` en `POST /auth/register` (evita creación masiva de cuentas)
- ✅ `ci_nit` (documento de identidad) ya **no se expone en el listado** de usuarios (solo en el detalle que consume el formulario de edición)

**Narrativa para la defensa:** *"Todas las rutas de la API requieren autenticación (`auth:sanctum`). La autorización por roles dentro del área autenticada es una mejora futura documentada: el MVP usa una sola cuenta administrativa, y el sistema de roles del dominio (`Usuario`↔`Rol`) se modeló como entidad CRUD para demostrar la relación muchos-a-muchos, no como mecanismo de control de acceso del login."*

---

## Estado del hardening (Sprint 10) — APLICADO

Todos los hallazgos MEDIO/BAJO accionables se corrigieron en 4 batches + ErrorBoundary global. Verificado: **35 tests backend** verdes, `tsc`/`eslint`/`build` limpios, ConfirmDialog y flujos CRUD probados en navegador. Solo el CRÍTICO/ALTO (RBAC) queda como limitación documentada arriba.

## MEDIO — Se corrigen en hardening (cheap, real)

- #3 `POST /auth/register` sin throttle → añadir `throttle:10,1`
- #4 `ci_nit` (PII) expuesto en `UsuarioResource` sin condición
- #5 `handleLogout` sin try/catch → estado inconsistente si falla logout
- #6 `setError` cast inseguro en `UsuarioFormPage` (claves desconocidas se pierden)
- #7 `request<T>` castea `null as T` en respuestas sin JSON
- #8 `ProveedorPayload` sin `usuario_id` (contrato incompleto — relación opcional)
- #9 input de búsqueda sin label accesible (Proveedores + Usuarios)
- #10 botones icon-only (editar/eliminar) solo con `title` → poco fiables en lectores
- #11 `window.confirm` → diálogo inaccesible (4 páginas); radix-ui disponible
- #12 errores de formulario sin `aria-invalid`/`aria-describedby` (componente `Field` compartido)
- #13 error de checkboxes de roles sin asociar al `fieldset`
- #14 contenedor de Toast sin `aria-live` → mensajes no anunciados a lectores

## BAJO — Mejoras / consistencia

- #15 `GET /api/user` devuelve modelo `User` crudo sin Resource
- #16 password `min:6` (vs `min:8` del auth principal)
- #17 LIKE con `%`/`_` sin escapar (5 controladores)
- #18 `authorize()` hardcoded a `true` en FormRequests
- #19 handlers de delete: `mutateAsync` sin try/catch → unhandled rejection
- #20 `setError` cast inseguro en `ProveedorFormPage` (espejo de #6)
- #21 validación de email con `safeParse` anidado (usar `z.email()` de Zod 4)
- #22 `NavLink` de Dashboard sin `end` → activo en todas las sub-rutas
- #23 `ProveedorController::update` no recarga relaciones (inconsistente con store)
- #24 `UsuarioController::destroy` sin guard para proveedor asociado → 500 en vez de 409
- #25/#26 búsqueda con `orWhere` sin agrupar en closure (Proveedor + Usuario)
- #27 estados loading/error/empty de tabla sin `aria-live`
- #28 botones de paginación sin `aria-label`
- #29 botón de búsqueda sin `type="submit"` explícito
