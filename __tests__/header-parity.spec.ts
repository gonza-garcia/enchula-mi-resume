import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/ofertas/', '/fuentes/', '/interview/', '/learning/'];

test.describe('Header unificado (Toolbar compartido)', () => {
  for (const path of ROUTES) {
    test(`header completo y estilizado en ${path}`, async ({ page }) => {
      await page.goto(path);
      const brand = page.locator('.toolbar .brand');
      await expect(brand).toBeVisible();
      await expect(brand).toHaveAttribute('href', '/');
      await expect(brand.locator('.brand-mark')).toHaveText('AM');
      await expect(brand.locator('.brand-name')).toContainText('Ariana Montiel');

      await expect(page.locator('.site-nav-link', { hasText: 'Mis perfiles' })).toBeVisible();
      await expect(page.locator('.site-nav-link', { hasText: 'Prep entrevistas' })).toBeVisible();

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

  test('el brand y la nav quedan en la misma posición horizontal en todas las rutas', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    const marks: Array<{ path: string; brandX: number; navX: number }> = [];
    for (const path of ROUTES) {
      await page.goto(path);
      const brand = await page.locator('.toolbar a.brand').boundingBox();
      const nav = await page.locator('.toolbar nav.site-nav').boundingBox();
      expect(brand, `brand en ${path}`).not.toBeNull();
      expect(nav, `nav en ${path}`).not.toBeNull();
      marks.push({ path, brandX: brand!.x, navX: nav!.x });
    }
    const reference = marks[0];
    for (const mark of marks) {
      expect(Math.abs(mark.brandX - reference.brandX), `brand en ${mark.path}`).toBeLessThan(1);
      expect(Math.abs(mark.navX - reference.navX), `nav en ${mark.path}`).toBeLessThan(1);
    }
  });

  test('los controles de idioma y tema viven solo en el sidebar de Mis perfiles', async ({
    page
  }) => {
    await page.goto('/');
    await expect(page.locator('.mp-side .toggle button#btn-en')).toBeVisible();
    await expect(page.locator('.mp-side .theme-panel')).toBeVisible();
  });

  test('brand name and role come from the profile and follow the active positioning', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand-role')).toHaveText('Frontend Developer');
    await page.locator('button[data-positioning="ai"]').click();
    await expect(page.locator('.brand-role')).toHaveText('AI Developer');
    await expect(page.locator('.brand-name')).toHaveText('Ariana Montiel');
  });

  test('nav marca activa la pagina actual', async ({ page }) => {
    const cases: Array<[string, string]> = [
      ['/', 'Mis perfiles'],
      ['/ofertas/', 'Ofertas'],
      ['/fuentes/', 'Fuentes'],
      ['/interview/', 'Prep entrevistas'],
      ['/learning/', 'Plan de estudios']
    ];
    for (const [path, label] of cases) {
      await page.goto(path);
      const active = page.locator('.toolbar nav.site-nav .site-nav-link.active');
      await expect(active).toHaveCount(1);
      await expect(active).toHaveText(label);
    }
  });
});
