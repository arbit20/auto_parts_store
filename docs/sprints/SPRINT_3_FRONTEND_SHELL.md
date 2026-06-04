# Sprint 3 - Frontend shell

## Objetivo

Reemplazar la pantalla inicial de Vite por una aplicacion React con router,
autenticacion y layout protegido.

## Cambios realizados

- Se agregaron dependencias:
  - `react-router-dom`
  - `@tanstack/react-query`
- Se creo cliente HTTP centralizado con cookies y CSRF.
- Se creo contexto de autenticacion.
- Se creo ruta protegida.
- Se creo layout principal con navegacion.
- Se creo pantalla de login.
- Se creo dashboard inicial autenticado.
- Se configuro Vite proxy para desarrollo local y Docker.
- Se corrigio el proxy Docker para usar `http://backend:8000` y evitar errores
  502 desde el contenedor frontend.
- Se reemplazo el CSS starter por estilos de la aplicacion MVP.

## Archivos principales

- `frontend/src/App.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/auth/AuthContext.tsx`
- `frontend/src/auth/ProtectedRoute.tsx`
- `frontend/src/components/AppLayout.tsx`
- `frontend/src/components/Toast.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/index.css`
- `frontend/vite.config.ts`
- `docker-compose.yml`
- `frontend/package.json`
- `pnpm-lock.yaml`

## Verificacion

- Abrir `http://localhost:5173`.
- Sin login, `/productos` redirige a `/login`.
- Login con `test@example.com/password`.
- Recargar la pagina y verificar que el shell no rompe.

## Resultado esperado

La app React tiene login funcional, layout, rutas protegidas y cliente HTTP con
manejo uniforme de errores.
