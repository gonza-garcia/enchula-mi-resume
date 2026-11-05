import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('Header unificado (Toolbar compartido)', () => {
  const pages = ['/', '/?tab=adaptados'];

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

      await expect(page.locator('.toolbar .toggle button#btn-en')).toBeVisible();
      await expect(page.locator('#btn-export')).toBeVisible();
      await expect(page.locator('[data-export="pdf"]')).toHaveCount(1);
      await expect(page.locator('[data-export="json"]')).toHaveCount(1);
      await expect(page.locator('[data-export="linkedin"]')).toHaveCount(1);
      await expect(page.locator('.theme-panel')).toBeVisible();

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
    await page.goto('/?tab=adaptados');
    await expect(page.locator('.site-nav-link', { hasText: 'Mis perfiles' })).toHaveClass(/active/);
    await expect(page.locator('.site-nav-link', { hasText: 'Prep entrevistas' })).not.toHaveClass(/active/);
  });

  test('toggle de idioma del header controla el CV adaptado en la tab de adaptados', async ({ page }) => {
    await page.goto('/?tab=adaptados');
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-offers-hydrated') === 'true'
    );
    await page.locator('.offer-card').filter({ hasText: 'Nimbus Software' }).click();
    await expect(page.locator('.split-right article.lang.active')).toHaveAttribute('data-lang', 'en');
    await page.locator('.toolbar #btn-es').click();
    await expect(page.locator('.split-right article.lang.active')).toHaveAttribute('data-lang', 'es');
    await expect(page.locator('.split-header .toggle')).toHaveCount(0);
    await page.locator('.toolbar #btn-en').click();
  });

  test('export JSON en la tab de adaptados descarga el adapted-resume de la oferta seleccionada', async ({ page }) => {
    await page.goto('/?tab=adaptados');
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-offers-hydrated') === 'true'
    );
    await page.locator('.offer-card').filter({ hasText: 'Nimbus Software' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-export').click();
    await page.locator('[data-export="json"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('2026-10-05-nimbus-software-senior-frontend-engineer-adapted-resume.json');
  });

  test('modal de LinkedIn en la tab de adaptados usa el CV adaptado seleccionado', async ({ page }) => {
    await page.goto('/?tab=adaptados');
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-offers-hydrated') === 'true'
    );
    await page.locator('.offer-card').filter({ hasText: 'Nimbus Software' }).click();
    const exported = await page.evaluate(() => window.__adaptedExportResume);
    expect(exported).toBeTruthy();
    expect(exported.en.summary).toContain('real-time analytics');
  });

  test('export JSON en / descarga la proyeccion activa del perfil', async ({ page }) => {
    await page.goto('/');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-export').click();
    await page.locator('[data-export="json"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('resume.json');
    const projection = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'));
    expect(projection.name).toBe('Ariana Montiel');
    expect(projection.title).toBe('Frontend Developer');
  });
});
