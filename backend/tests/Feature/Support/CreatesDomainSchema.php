<?php

namespace Tests\Feature\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

trait CreatesDomainSchema
{
    protected function createDomainSchema(): void
    {
        if (Schema::hasTable('productos')) {
            return;
        }

        Schema::create('roles', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nombre', 50)->unique();
            $table->string('descripcion', 150)->nullable();
        });

        Schema::create('usuarios', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nombre', 100);
            $table->string('apellido', 100)->nullable();
            $table->string('email', 150)->unique();
            $table->string('password_hash');
            $table->string('telefono', 30)->nullable();
            $table->string('ci_nit', 30)->nullable();
            $table->string('estado')->default('activo');
            $table->timestamp('creado_en')->nullable();
        });

        Schema::create('usuario_rol', function (Blueprint $table): void {
            $table->integer('usuario_id');
            $table->integer('rol_id');
            $table->primary(['usuario_id', 'rol_id']);
        });

        Schema::create('categorias', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nombre', 100);
            $table->string('descripcion', 255)->nullable();
            $table->integer('categoria_padre_id')->nullable();
        });

        Schema::create('marcas_pieza', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nombre', 80)->unique();
        });

        Schema::create('marcas_vehiculo', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('nombre', 80)->unique();
            $table->string('pais_origen', 80)->nullable();
        });

        Schema::create('modelos_vehiculo', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('marca_vehiculo_id');
            $table->string('nombre', 100);
            $table->smallInteger('anio_inicio')->nullable();
            $table->smallInteger('anio_fin')->nullable();
        });

        Schema::create('productos', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('codigo', 50)->unique();
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->integer('categoria_id');
            $table->integer('marca_pieza_id')->nullable();
            $table->decimal('peso_kg', 8, 3)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('creado_en')->nullable();
        });

        Schema::create('producto_imagenes', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('producto_id');
            $table->string('url', 255);
            $table->boolean('es_principal')->default(false);
        });

        Schema::create('compatibilidades', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('producto_id');
            $table->integer('modelo_vehiculo_id');
            $table->smallInteger('anio_desde')->nullable();
            $table->smallInteger('anio_hasta')->nullable();
        });

        Schema::create('proveedores', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('usuario_id')->nullable();
            $table->string('nombre', 150);
            $table->string('tipo')->default('empresa');
            $table->string('pais', 80)->nullable();
            $table->string('contacto', 100)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->timestamp('creado_en')->nullable();
        });

        Schema::create('ofertas', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('producto_id');
            $table->integer('vendedor_id')->nullable();
            $table->string('tipo_venta');
            $table->string('condicion')->default('nuevo');
            $table->string('origen')->default('nacional');
            $table->decimal('precio_compra', 12, 2)->default(0);
            $table->decimal('precio', 12, 2);
            $table->string('moneda')->default('BOB');
            $table->decimal('comision_pct', 5, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->integer('stock_minimo')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamp('creado_en')->nullable();
        });
    }

    protected function seedDomainCatalog(): void
    {
        DB::table('categorias')->insert([
            ['id' => 1, 'nombre' => 'Motor', 'descripcion' => 'Componentes del motor', 'categoria_padre_id' => null],
            ['id' => 2, 'nombre' => 'Frenos', 'descripcion' => 'Sistema de frenado', 'categoria_padre_id' => null],
            ['id' => 3, 'nombre' => 'Filtros', 'descripcion' => 'Filtros varios', 'categoria_padre_id' => 1],
        ]);

        DB::table('marcas_pieza')->insert([
            ['id' => 1, 'nombre' => 'Bosch'],
        ]);

        DB::table('marcas_vehiculo')->insert([
            ['id' => 1, 'nombre' => 'Toyota', 'pais_origen' => 'Japon'],
        ]);

        DB::table('modelos_vehiculo')->insert([
            ['id' => 1, 'marca_vehiculo_id' => 1, 'nombre' => 'Corolla', 'anio_inicio' => 2010, 'anio_fin' => 2020],
        ]);

        DB::table('productos')->insert([
            [
                'id' => 1,
                'codigo' => 'FRN-001',
                'nombre' => 'Pastillas de freno delanteras',
                'descripcion' => 'Juego de pastillas ceramicas',
                'categoria_id' => 2,
                'marca_pieza_id' => 1,
                'peso_kg' => 1.2,
                'activo' => true,
                'creado_en' => now(),
            ],
        ]);

        DB::table('producto_imagenes')->insert([
            ['id' => 1, 'producto_id' => 1, 'url' => '/img/productos/frn-001.jpg', 'es_principal' => true],
        ]);

        DB::table('compatibilidades')->insert([
            ['id' => 1, 'producto_id' => 1, 'modelo_vehiculo_id' => 1, 'anio_desde' => 2010, 'anio_hasta' => 2018],
        ]);

        DB::table('proveedores')->insert([
            ['id' => 1, 'usuario_id' => null, 'nombre' => 'AutoParts Import SRL', 'tipo' => 'empresa', 'pais' => 'China'],
        ]);

        DB::table('ofertas')->insert([
            [
                'id' => 1,
                'producto_id' => 1,
                'vendedor_id' => null,
                'tipo_venta' => 'propio',
                'condicion' => 'nuevo',
                'origen' => 'importado',
                'precio_compra' => 120,
                'precio' => 220,
                'moneda' => 'BOB',
                'comision_pct' => 0,
                'stock' => 25,
                'stock_minimo' => 5,
                'activo' => true,
                'creado_en' => now(),
            ],
        ]);
    }
}
