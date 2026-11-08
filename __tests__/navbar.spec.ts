import { test, expect } from '@playwright/test';

const DESTINATIONS = [
  { label: 'Mis perfiles', href: '/' },
  { label: 'Ofertas', href: '/ofertas/' },
  { label: 'Fuentes', href: '/fuentes/' },
  { label: 'Prep entrevistas', href: '/interview/' },
  { label: 'Plan de estudios', href: '/learning/' }
];

const PAGES = ['/', '/ofertas/', '/fuentes/', '/interview/', '/learning/'];

test.describe('Navbar consistente (5 destinos)', () => {
  for (const path of PAGES) {
    test(`muestra los 5 destinos y el brand en ${path}`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator('nav.site-nav .site-nav-link');
      await expect(links).toHaveCount(5);
      for (const destino of DESTINATIONS) {
        await expect(
          page.locator('nav.site-nav .site-nav-link', { hasText: destino.label })
        ).toHaveAttribute('href', destino.href);
      }
      await expect(page.locator('a.brand')).toHaveAttribute('href', '/');
    });
  }

  test('cada pagina marca su destino como activo', async ({ page }) => {
    const cases: Array<[string, string]> = [
      ['/', 'Mis perfiles'],
      ['/ofertas/', 'Ofertas'],
      ['/fuentes/', 'Fuentes'],
      ['/interview/', 'Prep entrevistas'],
      ['/learning/', 'Plan de estudios']
    ];
    for (const [path, label] of cases) {
      await page.goto(path);
      const active = page.locator('nav.site-nav .site-nav-link.active');
      await expect(active).toHaveCount(1);
      await expect(active).toHaveText(label);
      await expect(active).toHaveAttribute('aria-current', 'page');
    }
  });

  test('los destinos son links con subrayado, nunca pills (regla de UI de la Fase F)', async ({
    page
  }) => {
    await page.goto('/ofertas/');
    const active = page.locator('nav.site-nav .site-nav-link.active');
    const style = await active.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        decoration: s.textDecorationLine,
        decoColor: s.textDecorationColor,
        radius: s.borderRadius,
        weight: s.fontWeight
      };
    });
    expect(style.decoration).toContain('underline');
    expect(style.decoColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.decoColor).not.toBe('transparent');
    expect(parseFloat(style.radius)).toBe(0);
    expect(parseFloat(style.weight)).toBeGreaterThanOrEqual(600);
  });

  test('el sidebar de controles (perfiles, idioma, tema) solo vive en Mis perfiles', async ({
    page
  }) => {
    await page.goto('/');
    await expect(page.locator('.mp-side')).toHaveCount(1);
    await expect(page.locator('.mp-profile-item')).toHaveCount(2);
    await expect(page.locator('.mp-side .toggle button#btn-en')).toHaveCount(1);
    await expect(page.locator('.mp-side .theme-panel')).toHaveCount(1);

    for (const path of ['/ofertas/', '/interview/', '/learning/']) {
      await page.goto(path);
      await expect(page.locator('.mp-side')).toHaveCount(0);
      await expect(page.locator('.theme-panel')).toHaveCount(0);
    }
  });

  test('H3d: en pantallas anchas la barra se alinea a la columna de contenido de cada pagina', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const cases: Array<[string, string]> = [
      ['/', '.mp-shell'],
      ['/ofertas/', '.of-shell'],
      ['/fuentes/', '.fuentes'],
      ['/interview/', '.interview-layout'],
      ['/learning/', '.learning-app']
    ];
    for (const [path, selector] of cases) {
      await page.goto(path);
      const brand = await page.locator('a.brand').boundingBox();
      const contentLeft = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return rect.left + parseFloat(getComputedStyle(el).paddingLeft);
      }, selector);
      expect(brand, `brand en ${path}`).not.toBeNull();
      expect(contentLeft, `contenido en ${path}`).not.toBeNull();
      expect(
        Math.abs(brand!.x - contentLeft!),
        `el brand y el contenido arrancan a la misma altura en ${path}`
      ).toBeLessThan(1);
    }
  });
});
