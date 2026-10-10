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
  // dolor inicial 5 (≥ 4): se muestran los pasos opcionales de alivios y gatillantes (DIF-03)
  await expect(page.getByText('Paso 1 de 10')).toBeVisible();
  await page.getByRole('button', { name: 'No' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Yo' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Lumbar' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  // pasos opcionales: se omiten y nunca bloquean el guardado
  await page.getByTestId('checkin-relief-skip').click();
  await page.getByTestId('checkin-trigger-skip').click();
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(diarioHeading(page)).toBeVisible();
}
