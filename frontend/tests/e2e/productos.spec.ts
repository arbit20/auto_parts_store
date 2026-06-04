import { expect, test } from '@playwright/test'

// Autenticado vía storageState (ver auth.setup.ts); no se re-loguea por test.

test.describe('Productos', () => {
  test('el listado muestra relaciones por nombre', async ({ page }) => {
    await page.goto('/productos')
    await expect(page.getByRole('heading', { name: 'Productos', level: 1 })).toBeVisible()

    // Producto sembrado FRN-001 con su categoria/marca por nombre, no por id.
    const fila = page.getByRole('row', { name: /Pastillas de freno/ })
    await expect(fila).toBeVisible()
    await expect(fila.getByText('Frenos')).toBeVisible()
    await expect(fila.getByText('Bosch')).toBeVisible()
  })

  test('la busqueda filtra el listado', async ({ page }) => {
    await page.goto('/productos')
    await page.getByLabel('Buscar productos').fill('freno')
    await page.getByRole('button', { name: 'Buscar' }).click()
    await expect(page.getByText('Pastillas de freno delanteras')).toBeVisible()
  })
})
