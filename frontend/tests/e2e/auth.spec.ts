import { expect, test } from '@playwright/test'
import { login } from './helpers'

// Todos estos tests parten SIN la sesión compartida (storageState vacío) para
// no invalidarla: el test de logout cierra su propia sesión, no la de los demás.
test.describe('Autenticacion', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('una ruta protegida redirige al login sin sesion', async ({ page }) => {
    await page.goto('/proveedores')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible()
  })

  test('login con credenciales demo entra al dashboard', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: 'BAGG Auto Parts Store' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Proveedores' })).toBeVisible()
  })

  test('logout vuelve al login', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
