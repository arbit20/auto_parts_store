import { expect, test as setup } from '@playwright/test'
import { login } from './helpers'

const authFile = 'playwright/.auth/user.json'

/**
 * Login UNA sola vez y guardar el estado (cookies de sesión Sanctum + XSRF)
 * para reutilizarlo en todas las specs. Evita repetir login en cada test, lo
 * que dispararía el rate limit `throttle:5,1` del endpoint de login.
 */
setup('autenticar', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
