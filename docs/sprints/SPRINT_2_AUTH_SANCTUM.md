# Sprint 2 - Auth Sanctum

## Objetivo

Implementar autenticacion SPA con Laravel Sanctum y mantener la tabla `users`
como proveedor de login.

## Cambios realizados

- Se agregaron endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/user`
- Se protegieron rutas privadas con `auth:sanctum`.
- Se creo `AuthController`.
- Se crearon Form Requests para login y registro.
- Se agrego rate limit al login.
- Se configuro el modelo `User` con `HasApiTokens`.
- Se ajusto el middleware para que APIs sin sesion devuelvan 401 JSON y no
  intenten redirigir a una ruta web `login`.
- Se agrego seeder idempotente para usuario demo:
  - `test@example.com`
  - `password`
- Se agregaron tests de feature para auth.

## Archivos principales

- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Http/Requests/Auth/LoginRequest.php`
- `backend/app/Http/Requests/Auth/RegisterRequest.php`
- `backend/app/Models/User.php`
- `backend/bootstrap/app.php`
- `backend/database/seeders/DatabaseSeeder.php`
- `backend/routes/api.php`
- `backend/tests/Feature/AuthApiTest.php`

## Verificacion

- `docker compose exec -T backend php artisan test --filter=AuthApiTest`
- `curl.exe -s -i http://localhost:8000/api/user`
- Login en UI con:
  - `test@example.com`
  - `password`

## Resultado esperado

- `/api/user` sin sesion devuelve 401.
- Login correcto devuelve usuario autenticado.
- Logout cierra sesion.
- Los tests de auth pasan.
