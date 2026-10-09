import { test, expect } from '@playwright/test';
import { completarCheckinMinimo, goPacienteDemo } from './helpers';

test.describe('Paciente — smoke (Expo web)', () => {
  test('TC-MOV-001: login demo muestra Mi Diario', async ({ page }) => {
    await goPacienteDemo(page);
    await expect(page.getByText('BETA · datos de demostración')).toBeVisible();
    await expect(page.getByTestId('diario-checkin-cta')).toBeVisible();
  });

  test('TC-MOV-002: navegación inferior (4 tabs)', async ({ page }) => {
    await goPacienteDemo(page);
    await page.getByRole('tab', { name: /AlivIA/i }).click();
    await expect(page.getByRole('heading', { name: 'AlivIA', level: 1 })).toBeVisible();
    await page.getByRole('tab', { name: /Comunidad/i }).click();
    await expect(page.getByRole('heading', { name: 'Comunidad', level: 1 })).toBeVisible();
    await page.getByRole('tab', { name: /Perfil/i }).click();
    await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible();
    await page.getByRole('tab', { name: /Diario/i }).click();
    await expect(page.getByRole('heading', { name: 'Mi Diario', level: 1 })).toBeVisible();
  });

  test('TC-MOV-003: check-in por pasos y guardar', async ({ page }) => {
    await goPacienteDemo(page);
    await completarCheckinMinimo(page);
    await expect(page.getByText('Registros de hoy')).toBeVisible();
  });

  test('TC-MOV-004: logout desde perfil', async ({ page }) => {
    await goPacienteDemo(page);
    await page.getByRole('tab', { name: 'Perfil' }).click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByTestId('login-demo')).toBeVisible();
  });
});
