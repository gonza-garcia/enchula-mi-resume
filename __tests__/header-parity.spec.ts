import { test, expect } from '@playwright/test';

test.describe('Header unificado (Toolbar compartido)', () => {
  const pages = ['/'];

  for (const path of pages) {
    test(`header completo y estilizado en ${path}`, async ({ page }) => {
      await page.goto(path);
      const brand = page.locator('.brand');
      await expect(brand).toBeVisible();
      await expect(brand).toHaveAttribute('href', '/');
      await expect(brand.locator('.brand-mark')).toHaveText('AM');
      await expect(brand.locator('.brand-name')).toContainText('Ariana Montiel');

      await expect(page.locator('.site-nav-link', { hasText: 'Mis perfiles' })).toBeVisible();
      await expect(page.locator('.site-nav-link', { hasText: 'Prep entrevistas' })).toBeVisible();

      await expect(page.locator('.mp-side .toggle button#btn-en')).toBeVisible();
      await expect(page.locator('.mp-side .theme-panel')).toBeVisible();

      // El tip del header quedó fuera (Fase H): el header no explica el flujo de
      // export. Si reaparece un `.contactline` dentro del toolbar, es el tip.
      await expect(page.locator('.toolbar .contactline')).toHaveCount(0);

      const style = await page.locator('.toolbar').evaluate((el) => {
        const s = getComputedStyle(el);
        return { position: s.position, display: s.display, minHeight: s.minHeight };
      });
      expect(style.position).toBe('sticky');
      expect(style.display).toBe('flex');
      expect(parseFloat(style.minHeight)).toBeGreaterThanOrEqual(60);
    });
  }

  test('brand name and role come from the profile and follow the active positioning', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand-role')).toHaveText('Frontend Developer');
    await page.locator('button[data-positioning="ai"]').click();
    await expect(page.locator('.brand-role')).toHaveText('AI Developer');
    await expect(page.locator('.brand-name')).toHaveText('Ariana Montiel');
  });

  test('nav marca activa la pagina actual', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.site-nav-link', { hasText: 'Mis perfiles' })).toHaveClass(/active/);
    await expect(page.locator('.site-nav-link', { hasText: 'Prep entrevistas' })).not.toHaveClass(/active/);
  });
});
