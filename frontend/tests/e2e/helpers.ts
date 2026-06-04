import { expect, type Page } from '@playwright/test'

/** Inicia sesión con el usuario demo sembrado por Laravel y espera el dashboard. */
export async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
}
