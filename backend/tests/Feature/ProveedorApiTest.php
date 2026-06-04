<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Support\CreatesDomainSchema;
use Tests\TestCase;

class ProveedorApiTest extends TestCase
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

    public function test_index_returns_proveedores_with_pais(): void
    {
        $this->getJson('/api/proveedores')
            ->assertOk()
            ->assertJsonPath('data.0.nombre', 'AutoParts Import SRL')
            ->assertJsonPath('data.0.pais', 'China')
            ->assertJsonPath('data.0.tipo', 'empresa');
    }

    public function test_can_create_proveedor(): void
    {
        $this->postJson('/api/proveedores', [
            'nombre'   => 'Distribuidora Nacional',
            'tipo'     => 'empresa',
            'pais'     => 'Bolivia',
            'contacto' => 'Juan Perez',
            'telefono' => '77712345',
            'email'    => 'info@distribnac.com',
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'Distribuidora Nacional')
            ->assertJsonPath('data.pais', 'Bolivia');

        $this->assertDatabaseHas('proveedores', ['nombre' => 'Distribuidora Nacional']);
    }

    public function test_proveedor_validation_errors_are_returned(): void
    {
        $this->postJson('/api/proveedores', [
            'nombre' => '',
            'tipo'   => 'invalido',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['nombre', 'tipo']);
    }

    public function test_can_update_proveedor(): void
    {
        $id = $this->postJson('/api/proveedores', [
            'nombre' => 'Para Actualizar',
            'tipo'   => 'empresa',
            'pais'   => 'Bolivia',
        ])->json('data.id');

        $this->putJson("/api/proveedores/{$id}", [
            'nombre' => 'AutoParts Updated',
            'tipo'   => 'particular',
            'pais'   => 'Corea del Sur',
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'AutoParts Updated')
            ->assertJsonPath('data.pais', 'Corea del Sur')
            ->assertJsonPath('data.tipo', 'particular');
    }

    public function test_can_delete_proveedor_without_offers(): void
    {
        $id = $this->postJson('/api/proveedores', [
            'nombre' => 'Proveedor Temporal',
            'tipo'   => 'particular',
        ])->json('data.id');

        $this->deleteJson("/api/proveedores/{$id}")->assertOk();
        $this->getJson("/api/proveedores/{$id}")->assertNotFound();
    }

    public function test_cannot_delete_proveedor_with_offers(): void
    {
        $proveedorId = $this->postJson('/api/proveedores', [
            'nombre' => 'Proveedor Con Oferta',
            'tipo'   => 'empresa',
        ])->json('data.id');

        \Illuminate\Support\Facades\DB::table('ofertas')->insert([
            'producto_id'   => 1,
            'vendedor_id'   => $proveedorId,
            'tipo_venta'    => 'tercero',
            'condicion'     => 'nuevo',
            'origen'        => 'nacional',
            'precio_compra' => 50,
            'precio'        => 100,
            'moneda'        => 'BOB',
            'comision_pct'  => 10,
            'stock'         => 5,
            'stock_minimo'  => 1,
            'activo'        => 1,
        ]);

        $this->assertDatabaseHas('ofertas', ['vendedor_id' => $proveedorId]);
        $this->deleteJson("/api/proveedores/{$proveedorId}")->assertStatus(409);
    }
}
