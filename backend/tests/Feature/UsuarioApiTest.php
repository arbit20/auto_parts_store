<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Support\CreatesDomainSchema;
use Tests\TestCase;

class UsuarioApiTest extends TestCase
{
    use CreatesDomainSchema;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createDomainSchema();
        DB::table('roles')->insert([
            ['id' => 1, 'nombre' => 'administrador', 'descripcion' => 'Acceso total'],
            ['id' => 2, 'nombre' => 'cliente', 'descripcion' => 'Compra repuestos'],
            ['id' => 3, 'nombre' => 'proveedor', 'descripcion' => 'Vende ofertas'],
        ]);
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_roles_index_returns_seeded_roles(): void
    {
        $this->getJson('/api/roles')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.nombre', 'administrador');
    }

    public function test_can_create_usuario_with_roles(): void
    {
        $response = $this->postJson('/api/usuarios', [
            'nombre'   => 'Maria',
            'apellido' => 'Lopez',
            'email'    => 'maria@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
            'roles'    => [1, 2],
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'Maria')
            ->assertJsonPath('data.roles.0.nombre', 'administrador')
            ->assertJsonPath('data.roles.1.nombre', 'cliente');

        $id = $response->json('data.id');

        $this->assertDatabaseHas('usuario_rol', ['usuario_id' => $id, 'rol_id' => 1]);
        $this->assertDatabaseHas('usuario_rol', ['usuario_id' => $id, 'rol_id' => 2]);
    }

    public function test_password_is_hashed_not_stored_plaintext(): void
    {
        $id = $this->postJson('/api/usuarios', [
            'nombre'   => 'Hash Test',
            'email'    => 'hash@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
        ])->json('data.id');

        $stored = DB::table('usuarios')->where('id', $id)->value('password_hash');

        $this->assertNotSame('secret123', $stored);
        $this->assertTrue(Hash::check('secret123', $stored));
    }

    public function test_usuario_response_never_exposes_password_hash(): void
    {
        $id = $this->postJson('/api/usuarios', [
            'nombre'   => 'No Leak',
            'email'    => 'noleak@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
        ])->json('data.id');

        $this->getJson("/api/usuarios/{$id}")
            ->assertOk()
            ->assertJsonMissingPath('data.password_hash')
            ->assertJsonMissingPath('data.password');
    }

    public function test_validation_errors_are_returned(): void
    {
        $this->postJson('/api/usuarios', [
            'nombre'   => '',
            'email'    => 'no-es-email',
            'estado'   => 'desconocido',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['nombre', 'email', 'password', 'estado']);
    }

    public function test_email_must_be_unique(): void
    {
        $this->postJson('/api/usuarios', [
            'nombre'   => 'Primero',
            'email'    => 'dup@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
        ])->assertCreated();

        $this->postJson('/api/usuarios', [
            'nombre'   => 'Segundo',
            'email'    => 'dup@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_can_update_usuario_and_resync_roles(): void
    {
        $id = $this->postJson('/api/usuarios', [
            'nombre'   => 'Cambiable',
            'email'    => 'cambiable@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
            'roles'    => [1],
        ])->json('data.id');

        $this->putJson("/api/usuarios/{$id}", [
            'nombre' => 'Cambiado',
            'estado' => 'inactivo',
            'roles'  => [2, 3],
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'Cambiado')
            ->assertJsonPath('data.estado', 'inactivo')
            ->assertJsonPath('data.roles.0.nombre', 'cliente')
            ->assertJsonPath('data.roles.1.nombre', 'proveedor');

        $this->assertDatabaseMissing('usuario_rol', ['usuario_id' => $id, 'rol_id' => 1]);
        $this->assertDatabaseHas('usuario_rol', ['usuario_id' => $id, 'rol_id' => 2]);
        $this->assertDatabaseHas('usuario_rol', ['usuario_id' => $id, 'rol_id' => 3]);
    }

    public function test_can_delete_usuario(): void
    {
        $id = $this->postJson('/api/usuarios', [
            'nombre'   => 'Temporal',
            'email'    => 'temporal@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
            'roles'    => [1],
        ])->json('data.id');

        $this->deleteJson("/api/usuarios/{$id}")->assertOk();
        $this->getJson("/api/usuarios/{$id}")->assertNotFound();
        $this->assertDatabaseMissing('usuario_rol', ['usuario_id' => $id]);
    }

    public function test_cannot_delete_usuario_with_proveedor(): void
    {
        $id = $this->postJson('/api/usuarios', [
            'nombre'   => 'Con Proveedor',
            'email'    => 'conprov@bagg.bo',
            'password' => 'secret123',
            'estado'   => 'activo',
        ])->json('data.id');

        DB::table('proveedores')->insert([
            'usuario_id' => $id,
            'nombre'     => 'Proveedor del usuario',
            'tipo'       => 'empresa',
        ]);

        $this->deleteJson("/api/usuarios/{$id}")->assertStatus(409);
        $this->assertDatabaseHas('usuarios', ['id' => $id]);
    }

    public function test_ci_nit_hidden_in_index_present_in_show(): void
    {
        $id = $this->postJson('/api/usuarios', [
            'nombre'   => 'Con Documento',
            'email'    => 'doc@bagg.bo',
            'password' => 'secret123',
            'ci_nit'   => '9988776 LP',
            'estado'   => 'activo',
        ])->json('data.id');

        // En el listado el ci_nit no debe exponerse (PII)
        $index = $this->getJson('/api/usuarios?search=doc@bagg.bo')->assertOk();
        $index->assertJsonMissingPath('data.0.ci_nit');

        // En el detalle si, porque lo necesita el formulario de edicion
        $this->getJson("/api/usuarios/{$id}")
            ->assertOk()
            ->assertJsonPath('data.ci_nit', '9988776 LP');
    }
}
