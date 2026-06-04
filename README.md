# auto_parts_store

Guia para preparar, montar y levantar el proyecto en equipos de colaboradores,
ya sea para probar el sistema completo con Docker o para trabajar en frontend y
backend de forma local.

## 1. Requisitos

Para levantar todo con Docker:

- Git.
- Docker Desktop o Docker Engine con Docker Compose v2.
- Acceso al repositorio `https://github.com/arbit20/auto_parts_store.git`.

Para trabajar fuera de Docker tambien se recomienda:

- Node.js compatible con pnpm por Corepack.
- pnpm 11.1.3.
- PHP 8.3 o superior.
- Composer 2.x.

Stack actual:

- Frontend: React 19, Vite 8, Tailwind CSS 4, TypeScript.
- Backend: Laravel 13, Sanctum, PHP 8.5 en Docker.
- Base de datos: MariaDB 11.8.
- Administracion DB: phpMyAdmin 5.2.

## 2. Clonar el repositorio

```bash
git clone https://github.com/arbit20/auto_parts_store.git
cd auto_parts_store
git checkout develop
```

Para revisar el PR actual de inicializacion:

```bash
git fetch origin
git checkout feature/bagg-system-bootstrap
```

## 3. Variables de entorno

El proyecto usa dos archivos de entorno:

- `.env` en la raiz: lo usa Docker Compose para puertos y credenciales de los
  contenedores.
- `backend/.env`: lo usa Laravel cuando ejecutas comandos PHP desde el host.

Crear ambos archivos desde sus ejemplos:

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Bash:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Valores importantes por defecto:

```env
FRONTEND_PORT=5173
BACKEND_PORT=8000
DB_FORWARD_PORT=3306
DB_DATABASE=bagg_autopartes
DB_USERNAME=auto_parts_user
DB_PASSWORD=auto_parts_password
MARIADB_ROOT_PASSWORD=root_password
```

Nota importante sobre `DB_HOST`:

- Dentro de Docker, el backend debe usar `DB_HOST=mariadb`.
- Desde el host, Laravel debe usar `DB_HOST=127.0.0.1`.

Por eso `docker-compose.yml` y `backend/.env.example` usan `DB_HOST=mariadb`.
Si ejecutas Artisan desde el host, cambia temporalmente `backend/.env` a
`DB_HOST=127.0.0.1`.

No hagas commit de `.env`, `backend/.env`, `node_modules`, `vendor`, `dist` ni
volumenes locales. Estan ignorados por Git.

## 4. Levantar todo con Docker

Desde la raiz del proyecto:

```bash
docker compose up --build
```

Tambien puedes usar el script del `package.json` raiz:

```bash
pnpm dev
```

Servicios esperados:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health API: http://localhost:8000/api/health
- phpMyAdmin: http://localhost:8081/index.php?route=/
- MariaDB desde el host: `127.0.0.1:3306`

Credenciales utiles para phpMyAdmin:

```text
Servidor: mariadb
Usuario root: root
Password root: root_password

Usuario app: auto_parts_user
Password app: auto_parts_password
Base app: bagg_autopartes
```

Verificar contenedores:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mariadb
```

Apagar servicios:

```bash
docker compose down
```

Apagar y borrar volumenes de base de datos/dependencias:

```bash
docker compose down -v
```

Usa `down -v` solo si quieres reiniciar la base de datos desde cero.

## 5. Base de datos

La base principal del MVP es `bagg_autopartes`.

En un volumen nuevo de MariaDB, Docker importa automaticamente:

1. `bagg_autopartes_v1.sql`
2. `bagg_autopartes__v2.sql`

Despues el contenedor backend ejecuta migraciones Laravel sobre la misma base
para crear las tablas de autenticacion, cache, jobs, sesiones y Sanctum.

Para verificar migraciones Laravel desde el host:

```bash
cd backend
php artisan migrate:status
cd ..
```

Si el comando falla por conexion, revisa que `backend/.env` tenga:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bagg_autopartes
DB_USERNAME=root
DB_PASSWORD=root_password
```

Si ya tenias un volumen creado antes de este MVP y necesitas recargar los SQL
desde cero:

```bash
docker compose down -v
docker compose up --build
```

Tambien puedes cargar la base de dominio `bagg_autopartes` manualmente usando
Docker:

PowerShell:

```powershell
Get-Content .\bagg_autopartes_v1.sql | docker compose exec -T mariadb mariadb -uroot -proot_password
Get-Content .\bagg_autopartes__v2.sql | docker compose exec -T mariadb mariadb -uroot -proot_password
```

Bash:

```bash
docker compose exec -T mariadb mariadb -uroot -proot_password < bagg_autopartes_v1.sql
docker compose exec -T mariadb mariadb -uroot -proot_password < bagg_autopartes__v2.sql
```

Tambien puedes importarlos desde phpMyAdmin:

1. Abrir http://localhost:8081/index.php?route=/
2. Entrar con `root` / `root_password`.
3. Importar primero `bagg_autopartes_v1.sql`.
4. Importar despues `bagg_autopartes__v2.sql`.

El orden importa: `bagg_autopartes__v2.sql` es el parche incremental y debe
aplicarse despues de `bagg_autopartes_v1.sql`.

## 6. Trabajo local sin Docker

Frontend:

```bash
corepack enable
corepack prepare pnpm@11.1.3 --activate
pnpm install
pnpm --dir frontend dev
```

Backend:

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

Si trabajas localmente sin Docker, MariaDB debe estar disponible en
`127.0.0.1:3306`. Puedes usar la MariaDB del compose levantando solo ese
servicio:

```bash
docker compose up -d mariadb phpmyadmin
```

## 7. Comandos de desarrollo

Desde la raiz:

```bash
pnpm frontend:dev
pnpm frontend:build
pnpm frontend:lint
pnpm backend:serve
pnpm backend:test
pnpm docker:up
pnpm docker:down
```

Checks recomendados antes de abrir o actualizar un PR:

```bash
pnpm --dir frontend exec tsc -b --pretty false
pnpm --dir frontend build
pnpm --dir frontend lint
cd backend
php artisan test
cd ..
```

## 8. Endpoints disponibles

Rutas actuales del backend:

```text
GET /                  devuelve estado basico de la app
GET /api/health        devuelve {"status":"ok","service":"Auto Parts Store API"}
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout  requiere auth:sanctum
GET /api/user          requiere auth:sanctum
GET /api/productos     requiere auth:sanctum
POST /api/productos    requiere auth:sanctum
GET /api/productos/{id} requiere auth:sanctum
PUT /api/productos/{id} requiere auth:sanctum
DELETE /api/productos/{id} requiere auth:sanctum
GET /api/categorias    requiere auth:sanctum
POST /api/categorias   requiere auth:sanctum
GET /api/categorias/{id} requiere auth:sanctum
PUT /api/categorias/{id} requiere auth:sanctum
DELETE /api/categorias/{id} requiere auth:sanctum
GET /sanctum/csrf-cookie
GET /up
```

El frontend actual incluye login SPA con Sanctum, rutas protegidas, dashboard y
CRUD completo de productos y categorias.

## 9. Problemas frecuentes

### `php_network_getaddresses: getaddrinfo for mariadb failed`

Estas ejecutando Laravel desde el host con `DB_HOST=mariadb`. Cambia
`backend/.env` a:

```env
DB_HOST=127.0.0.1
DB_USERNAME=root
DB_PASSWORD=root_password
```

Despues limpia config:

```bash
cd backend
php artisan config:clear
cd ..
```

### Puerto ocupado

Edita `.env` en la raiz y cambia alguno de estos valores:

```env
FRONTEND_PORT=5173
BACKEND_PORT=8000
DB_FORWARD_PORT=3306
```

Despues reinicia:

```bash
docker compose down
docker compose up --build
```

### Cambios de `.env` no se reflejan

Recrea los servicios:

```bash
docker compose down
docker compose up --build
```

Para Laravel local:

```bash
cd backend
php artisan config:clear
cd ..
```

### Base de datos corrupta o con datos viejos

Si puedes perder los datos locales:

```bash
docker compose down -v
docker compose up --build
```

Al volver a levantar, MariaDB importara los SQL automaticamente en el volumen
nuevo.

### Dependencias rotas

Frontend:

```bash
pnpm install
```

Backend local:

```bash
cd backend
composer install
cd ..
```

Docker:

```bash
docker compose down
docker compose up --build
```

## 10. Flujo recomendado para colaboradores

1. Crear una rama desde la base full-stack acordada.
2. Levantar el proyecto con Docker.
3. Verificar `GET /api/health`.
4. Hacer cambios pequenos y enfocados.
5. Ejecutar los checks del punto 7.
6. Hacer commits con mensajes cortos en ingles.
7. Abrir PR contra `develop`.

Ejemplo:

```bash
git checkout develop
git pull
git checkout -b feature/my-change

# trabajar...

pnpm --dir frontend build
cd backend
php artisan test
cd ..

git status
git add .
git commit -m "feat: add my change"
git push -u origin feature/my-change
```
