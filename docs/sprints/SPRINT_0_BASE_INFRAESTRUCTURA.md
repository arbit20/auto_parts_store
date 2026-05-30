# Sprint 0 - Base e infraestructura

## Objetivo

Levantar la base full-stack real con Docker, Laravel, MariaDB, Vite y datos de
dominio `bagg_autopartes`.

## Cambios realizados

- Se trabajo desde la base full-stack de `origin/feature/bagg-system-bootstrap`.
- Se creo la rama de trabajo `feature/mvp-sprints-0-6`.
- Se configuro `DB_DATABASE=bagg_autopartes` en los ejemplos de entorno.
- Se ajusto Docker Compose para levantar:
  - `frontend`
  - `backend`
  - `mariadb`
  - `phpmyadmin`
- Se montaron los SQL de dominio en MariaDB:
  - `bagg_autopartes_v1.sql`
  - `bagg_autopartes__v2.sql`
- Se ajusto el arranque del backend para ejecutar migraciones y seeders.
- Se agrego soporte `pdo_sqlite` en el Dockerfile para pruebas automatizadas.
- Se dejo phpMyAdmin disponible en `http://localhost:8081`.
- Se actualizo README con la base real del MVP y flujo Docker.

## Archivos principales

- `.env.example`
- `backend/.env.example`
- `backend/Dockerfile`
- `docker-compose.yml`
- `README.md`
- `VERIFICACION_SPRINTS_0_6.txt`

## Verificacion

- `docker compose ps`
- `Invoke-RestMethod http://localhost:8000/api/health`
- `docker compose exec -T backend php artisan tinker --execute "echo DB::table('productos')->count();"`
- `curl.exe -s -i -X OPTIONS http://localhost:8000/api/auth/login -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST"`

## Resultado esperado

- Backend healthy.
- Frontend healthy.
- MariaDB healthy.
- phpMyAdmin levantado.
- `/api/health` responde `status: ok`.
- La tabla `productos` tiene al menos 5 registros.
