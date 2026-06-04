import { expect, test } from '@playwright/test'

// Autenticado vía storageState (ver auth.setup.ts).

const NOMBRE = 'E2E Proveedor Temporal'

test.describe('Proveedores CRUD', () => {
  test('crea, busca y elimina un proveedor con el dialogo accesible', async ({ page }) => {
    // CREATE
    await page.goto('/proveedores/nuevo')
    await page.getByLabel('Nombre').fill(NOMBRE)
    await page.getByLabel('Pais').fill('Bolivia')
    await page.getByRole('button', { name: 'Guardar' }).click()

    // Redirige al index y el nuevo registro aparece
    await expect(page).toHaveURL(/\/proveedores$/)
    const fila = page.getByRole('row', { name: new RegExp(NOMBRE) })
    await expect(fila).toBeVisible()

    // DELETE via ConfirmDialog (alertdialog accesible, no window.confirm)
    await fila.getByRole('button', { name: `Eliminar proveedor ${NOMBRE}` }).click()
    const dialogo = page.getByRole('alertdialog', { name: 'Eliminar proveedor' })
    await expect(dialogo).toBeVisible()
    await expect(dialogo.getByText(NOMBRE)).toBeVisible()
    await dialogo.getByRole('button', { name: 'Eliminar' }).click()

    // El registro desaparece del listado
    await expect(page.getByRole('row', { name: new RegExp(NOMBRE) })).toHaveCount(0)
  })

  test('valida el nombre obligatorio', async ({ page }) => {
    await page.goto('/proveedores/nuevo')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible()
    await expect(page).toHaveURL(/\/proveedores\/nuevo$/)
  })
})
