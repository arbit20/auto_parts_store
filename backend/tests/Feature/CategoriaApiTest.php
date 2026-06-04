<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Support\CreatesDomainSchema;
use Tests\TestCase;

class CategoriaApiTest extends TestCase
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

    public function test_index_returns_parent_relation_by_name(): void
    {
        $this->getJson('/api/categorias?search=Filtros')
            ->assertOk()
            ->assertJsonPath('data.0.nombre', 'Filtros')
            ->assertJsonPath('data.0.categoria_padre.nombre', 'Motor');
    }

    public function test_can_create_category(): void
    {
        $this->postJson('/api/categorias', [
            'nombre' => 'Accesorios',
            'descripcion' => 'Accesorios interiores',
            'categoria_padre_id' => null,
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'Accesorios');

        $this->assertDatabaseHas('categorias', [
            'nombre' => 'Accesorios',
        ]);
    }

    public function test_category_parent_cannot_be_itself(): void
    {
        $this->putJson('/api/categorias/1', [
            'categoria_padre_id' => 1,
        ])->assertJsonValidationErrors(['categoria_padre_id']);
    }

    public function test_can_update_category(): void
    {
        $this->putJson('/api/categorias/3', [
            'nombre' => 'Filtros motor',
            'categoria_padre_id' => 1,
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'Filtros motor')
            ->assertJsonPath('data.categoria_padre.nombre', 'Motor');
    }

    public function test_category_with_products_cannot_be_deleted(): void
    {
        $this->deleteJson('/api/categorias/2')->assertStatus(409);
    }

    public function test_can_delete_empty_category(): void
    {
        $response = $this->postJson('/api/categorias', [
            'nombre' => 'Temporal',
            'descripcion' => null,
            'categoria_padre_id' => null,
        ]);

        $id = $response->json('data.id');

        $this->deleteJson("/api/categorias/{$id}")->assertOk();
        $this->assertDatabaseMissing('categorias', ['id' => $id]);
    }
}
