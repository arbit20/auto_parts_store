<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Support\CreatesDomainSchema;
use Tests\TestCase;

class ProductoApiTest extends TestCase
{
    use CreatesDomainSchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createDomainSchema();
        $this->seedDomainCatalog();
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_index_returns_products_with_visible_relations(): void
    {
        $this->getJson('/api/productos')
            ->assertOk()
            ->assertJsonPath('data.0.codigo', 'FRN-001')
            ->assertJsonPath('data.0.categoria.nombre', 'Frenos')
            ->assertJsonPath('data.0.marca_pieza.nombre', 'Bosch')
            ->assertJsonPath('data.0.compatibilidades.0.etiqueta', 'Toyota Corolla 2010-2018')
            ->assertJsonPath('data.0.ofertas.0.vendedor.nombre', 'Bagg');
    }

    public function test_can_create_product(): void
    {
        $this->postJson('/api/productos', [
            'codigo' => 'NEW-001',
            'nombre' => 'Producto de demo',
            'descripcion' => 'Creado desde test',
            'categoria_id' => 2,
            'marca_pieza_id' => 1,
            'peso_kg' => 2.5,
            'activo' => true,
        ])->assertCreated()
            ->assertJsonPath('data.codigo', 'NEW-001');

        $this->assertDatabaseHas('productos', [
            'codigo' => 'NEW-001',
            'nombre' => 'Producto de demo',
        ]);
    }

    public function test_product_validation_errors_are_returned(): void
    {
        $this->postJson('/api/productos', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['codigo', 'nombre', 'categoria_id']);
    }

    public function test_can_update_product(): void
    {
        $this->putJson('/api/productos/1', [
            'nombre' => 'Pastillas premium',
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'Pastillas premium');

        $this->assertDatabaseHas('productos', [
            'id' => 1,
            'nombre' => 'Pastillas premium',
        ]);
    }

    public function test_search_filters_products(): void
    {
        DB::table('productos')->insert([
            'id' => 2,
            'codigo' => 'FLT-002',
            'nombre' => 'Filtro de aceite',
            'descripcion' => 'Filtro de aceite estandar',
            'categoria_id' => 3,
            'marca_pieza_id' => 1,
            'peso_kg' => 0.3,
            'activo' => true,
            'creado_en' => now(),
        ]);

        $this->getJson('/api/productos?search=Filtro')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.codigo', 'FLT-002');
    }

    public function test_can_delete_product_with_offers(): void
    {
        $this->deleteJson('/api/productos/1')->assertOk();

        $this->assertDatabaseMissing('productos', ['id' => 1]);
        $this->assertDatabaseMissing('ofertas', ['producto_id' => 1]);
    }
}
