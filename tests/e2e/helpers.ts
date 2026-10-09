import { expect, type Page } from '@playwright/test';

export const diarioHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Mi Diario', level: 1 });

export async function goPacienteDemo(page: Page) {
  await page.goto('/');
  await page.getByTestId('login-demo').click();
  await expect(diarioHeading(page)).toBeVisible({ timeout: 20_000 });
}

export async function completarCheckinMinimo(page: Page) {
  await page.getByTestId('diario-checkin-cta').click();
  await expect(page.getByText('Paso 1 de 7')).toBeVisible();
  await page.getByRole('button', { name: 'No' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Yo' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Lumbar' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(diarioHeading(page)).toBeVisible();
}
