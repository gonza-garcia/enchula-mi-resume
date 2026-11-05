import { test, expect } from '@playwright/test';

/**
 * Pagina "Fuentes" (Fase G, ADR-0043) contra el build demo: dos fuentes
 * ficticias (demo-job-board y demo-curated-sheet), su playbook, sus ofertas
 * historicas vinculadas (aurora y nimbus) y sus stats contra el barrido demo.
 */

const AURORA = '2026-10-05-aurora-labs-reactjs-frontend-developer';

test.describe('Fuentes (Fase G)', () => {
  test('lista las fuentes demo con tipo, estado y playbook', async ({ page }) => {
    await page.goto('/fuentes/');
    await expect(page.getByRole('heading', { name: 'Fuentes', level: 1 })).toBeVisible();

    const board = page.locator('.fuente-card', { hasText: 'Demo Job Board' });
    await expect(board.locator('.chip', { hasText: 'job-board' })).toHaveCount(1);
    await expect(board.locator('.chip', { hasText: 'activa' })).toHaveCount(1);
    const playbook = board.locator('.fuente-playbook');
    await expect(playbook).toContainText('Buscar:');
    await expect(playbook).toContainText('Herramientas:');
    await expect(playbook).toContainText('Quirks:');
    await expect(playbook).toContainText('feed JSON');

    const sheet = page.locator('.fuente-card', { hasText: 'Demo Curated Spreadsheet' });
    await expect(sheet.locator('.chip', { hasText: 'spreadsheet' })).toHaveCount(1);
    await expect(sheet.locator('.fuente-playbook')).toContainText('Export CSV');
  });

  test('stats por fuente: ultimo barrido, capturadas y descartadas', async ({ page }) => {
    await page.goto('/fuentes/');
    const board = page.locator('.fuente-card', { hasText: 'Demo Job Board' });
    const stats = board.locator('.fuente-stats');
    await expect(stats).toContainText('2026-10-05');
    await expect(stats).toContainText('Ofertas capturadas');
    await expect(stats).toContainText('Vacantes descartadas');
  });

  test('el historial por fuente enlaza a la oferta en Mis perfiles', async ({ page }) => {
    await page.goto('/fuentes/');
    const board = page.locator('.fuente-card', { hasText: 'Demo Job Board' });
    const link = board.locator('.fuente-historial a', { hasText: 'Aurora Labs' });
    await expect(link).toHaveAttribute('href', `/?tab=adaptados&oferta=${AURORA}`);

    const sheet = page.locator('.fuente-card', { hasText: 'Demo Curated Spreadsheet' });
    await expect(sheet.locator('.fuente-historial')).toContainText('Nimbus Software');
    await expect(sheet.locator('.fuente-historial')).toContainText('postulación: descartada');
  });

  test('la navbar muestra los 5 destinos con Fuentes activo', async ({ page }) => {
    await page.goto('/fuentes/');
    const links = page.locator('nav.site-nav .site-nav-link');
    await expect(links).toHaveCount(5);
    await expect(page.locator('nav.site-nav .site-nav-link.active')).toHaveText('Fuentes');
  });
});
