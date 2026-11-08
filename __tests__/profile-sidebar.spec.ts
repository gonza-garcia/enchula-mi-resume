import { test, expect } from '@playwright/test';

test.describe('Sidebar de Mis perfiles', () => {
  test('una entrada por perfil, con titulo y resumen', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.mp-profile-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator('.mp-profile-title')).toHaveText('Frontend Developer');
    await expect(items.nth(1).locator('.mp-profile-title')).toHaveText('AI Developer');
    await expect(items.nth(0).locator('.mp-profile-summary')).not.toBeEmpty();
  });

  test('el perfil activo queda marcado y sigue al CV', async ({ page }) => {
    await page.goto('/');
    const frontend = page.locator('button[data-positioning="frontend"]');
    const ai = page.locator('button[data-positioning="ai"]');
    await expect(frontend).toHaveAttribute('aria-pressed', 'true');
    await expect(ai).toHaveAttribute('aria-pressed', 'false');

    await ai.click();
    await expect(ai).toHaveAttribute('aria-pressed', 'true');
    await expect(frontend).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#cv-panel-base article.lang.active')).toHaveAttribute('data-positioning', 'ai');
  });

  test('la seleccion del perfil sobrevive a la recarga', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[data-positioning="ai"]').click();
    await page.reload();
    await expect(page.locator('button[data-positioning="ai"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#cv-panel-base article.lang.active')).toHaveAttribute('data-positioning', 'ai');
  });

  test('el sidebar lleva idioma y tema junto al selector', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mp-side .toggle button#btn-en')).toBeVisible();
    await expect(page.locator('.mp-side .toggle button#btn-es')).toBeVisible();
    await expect(page.locator('.mp-side .theme-panel')).toBeVisible();
  });

  test('el sidebar no se imprime', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });
    const display = await page.locator('.mp-side').evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('none');
  });
});
