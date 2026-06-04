import { expect, test } from '@playwright/test'

// Autenticado vía storageState (ver auth.setup.ts).

const NOMBRE = 'E2E Usuario MN'
const EMAIL = 'e2e.usuario.mn@bagg.bo'

test.describe('Usuarios y roles (M:N)', () => {
  test('el listado muestra los roles por nombre (relacion M:N)', async ({ page }) => {
    await page.goto('/usuarios')

    // Jorge Ticona tiene dos roles sembrados: demuestra el muchos-a-muchos.
    const fila = page.getByRole('row', { name: /Jorge Ticona/ })
    await expect(fila.getByText('cliente')).toBeVisible()
    await expect(fila.getByText('proveedor')).toBeVisible()
  })

  test('crea un usuario con dos roles y luego lo elimina', async ({ page }) => {
    await page.goto('/usuarios/nuevo')

    await page.getByLabel('Nombre').fill(NOMBRE)
    await page.getByLabel('Email').fill(EMAIL)
    await page.getByLabel('Contrasena', { exact: true }).fill('secret123')
    await page.getByRole('checkbox', { name: 'gerente' }).check()
    await page.getByRole('checkbox', { name: 'operador' }).check()
    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page).toHaveURL(/\/usuarios$/)
    const fila = page.getByRole('row', { name: new RegExp(NOMBRE) })
    await expect(fila).toBeVisible()
    await expect(fila.getByText('gerente')).toBeVisible()
    await expect(fila.getByText('operador')).toBeVisible()

    // Limpieza: eliminar el usuario creado via el dialogo
    await fila.getByRole('button', { name: `Eliminar usuario ${NOMBRE}` }).click()
    const dialogo = page.getByRole('alertdialog', { name: 'Eliminar usuario' })
    await dialogo.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByRole('row', { name: new RegExp(NOMBRE) })).toHaveCount(0)
  })
})
