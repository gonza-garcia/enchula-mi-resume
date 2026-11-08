import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

/**
 * Dialogo reutilizable "Descargar" (Fase H) en "Mis perfiles": el set del CV
 * activo (PDF · DOCX · JSON) con nombres neutros (ADR-0036) y PDF por
 * impresion del navegador. La superficie de /ofertas llega con la Tanda H3c.
 */

test.describe('Dialogo "Descargar" (Fase H) — Mis perfiles', () => {
  test('el sidebar ofrece Descargar y abre el dialogo', async ({ page }) => {
    await page.goto('/');
    const openBtn = page.locator('[data-download-open]');
    await expect(openBtn).toHaveText('Descargar');
    await openBtn.click();
    await expect(page.locator('[data-download-dialog]')).toBeVisible();
    await expect(page.locator('[data-download-dialog] [role="dialog"]')).toBeVisible();
    await expect(page.locator('#download-dialog-title')).toHaveText('Descargar');
  });

  test('el set es el CV con PDF, DOCX y JSON, con el nombre neutro de tooltip', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-download-open]');
    await expect(page.locator('.download-doc-label')).toHaveText(['CV']);
    const formats = page.locator('.download-format');
    await expect(formats).toHaveCount(3);
    await expect(formats.nth(0)).toHaveText('PDF');
    await expect(formats.nth(1)).toHaveText('DOCX');
    await expect(formats.nth(2)).toHaveText('JSON');
    await expect(page.locator('.download-format[data-format="pdf"]')).toHaveAttribute(
      'title',
      'Montiel Ariana - CV - EN.pdf'
    );
    await expect(page.locator('.download-format[data-format="docx"]')).toHaveAttribute(
      'title',
      'Montiel Ariana - CV - EN.docx'
    );
    await expect(page.locator('.download-format[data-format="json"]')).toHaveAttribute(
      'title',
      'Montiel Ariana - CV - EN.json'
    );
  });

  test('JSON baja con nombre neutro y el CV activo', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-download-open]');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('.download-format[data-format="json"]')
    ]);
    expect(download.suggestedFilename()).toBe('Montiel Ariana - CV - EN.json');
    const filePath = await download.path();
    const body = JSON.parse(fs.readFileSync(filePath!, 'utf-8'));
    expect(body.name).toBe('Ariana Montiel');
    expect(Array.isArray(body.experience)).toBe(true);
  });

  test('DOCX baja con nombre neutro', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-download-open]');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('.download-format[data-format="docx"]')
    ]);
    expect(download.suggestedFilename()).toBe('Montiel Ariana - CV - EN.docx');
  });

  test('PDF imprime con el titulo neutro del ADR-0036 y lo restaura', async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => {
        const w = window as unknown as { __printedTitle?: string; __printDoc?: string };
        w.__printedTitle = document.title;
        w.__printDoc = document.body.dataset.printDoc ?? '';
      };
    });
    await page.goto('/');
    const originalTitle = await page.title();
    await page.click('[data-download-open]');
    await page.click('.download-format[data-format="pdf"]');
    const printed = await page.evaluate(() => {
      const w = window as unknown as { __printedTitle?: string; __printDoc?: string };
      return { title: w.__printedTitle, doc: w.__printDoc };
    });
    expect(printed.title).toBe('Montiel Ariana - CV - EN');
    expect(printed.doc).toBe('cv');
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    expect(await page.title()).toBe(originalTitle);
    expect(await page.evaluate(() => document.body.dataset.printDoc)).toBeUndefined();
  });

  test('el idioma activo cambia el nombre sugerido (LOCALE del ADR-0036)', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-es');
    await page.click('[data-download-open]');
    await expect(page.locator('.download-format[data-format="json"]')).toHaveAttribute(
      'title',
      'Montiel Ariana - CV - ES.json'
    );
  });

  test('Esc y la x cierran el dialogo, y el foco vuelve al boton', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-download-open]');
    await expect(page.locator('[data-download-dialog]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-download-dialog]')).toBeHidden();
    await expect(page.locator('[data-download-open]')).toBeFocused();
    await page.click('[data-download-open]');
    await page.click('[data-download-close]');
    await expect(page.locator('[data-download-dialog]')).toBeHidden();
    await expect(page.locator('[data-download-open]')).toBeFocused();
  });
});

test.describe('Dialogo "Descargar" (Fase H) — /ofertas', () => {
  const NIMBUS = '2026-10-05-nimbus-software-senior-frontend-engineer';
  const AURORA = '2026-10-05-aurora-labs-reactjs-frontend-developer';

  async function abrirDialogo(page: Page, slug: string, vista?: number): Promise<void> {
    await page.goto(`/ofertas/?oferta=${slug}`);
    if (vista !== undefined) await page.locator('.of-segmented [role="tab"]').nth(vista).click();
    await page.locator('button[aria-label="Más acciones"]').click();
    await page.locator('.of-menu-item', { hasText: 'Descargar' }).click();
  }

  test('el set de la oferta: oferta, match report, CV, cover y postulacion con sus formatos', async ({
    page
  }) => {
    await abrirDialogo(page, NIMBUS);
    await expect(page.locator('.download-doc-label')).toHaveText([
      'Oferta',
      'Match report',
      'CV',
      'Cover letter',
      'Postulación'
    ]);
    await expect(page.locator('.download-format')).toHaveCount(10);
    await expect(page.locator('.download-doc').nth(0).locator('.download-format')).toHaveText([
      'PDF',
      'TXT'
    ]);
    await expect(page.locator('.download-doc').nth(1).locator('.download-format')).toHaveText(['MD']);
    await expect(page.locator('.download-doc').nth(2).locator('.download-format')).toHaveText([
      'PDF',
      'DOCX',
      'JSON'
    ]);
    await expect(page.locator('.download-doc').nth(3).locator('.download-format')).toHaveText([
      'PDF',
      'MD'
    ]);
    await expect(page.locator('.download-doc').nth(4).locator('.download-format')).toHaveText([
      'MD',
      'TXT'
    ]);
  });

  test('los nombres: literales para el registro y neutros para CV y cover (ADR-0036)', async ({
    page
  }) => {
    await abrirDialogo(page, NIMBUS);
    await expect(page.locator('.download-format[data-doc="oferta"][data-format="pdf"]')).toHaveAttribute(
      'title',
      'offer.pdf'
    );
    await expect(
      page.locator('.download-format[data-doc="report"][data-format="md"]')
    ).toHaveAttribute('title', 'match-report.md');
    await expect(
      page.locator('.download-format[data-doc="cv"][data-format="docx"]')
    ).toHaveAttribute('title', 'Montiel Ariana - CV - EN.docx');
    await expect(
      page.locator('.download-format[data-doc="cover"][data-format="md"]')
    ).toHaveAttribute('title', 'Montiel Ariana - Cover Letter - EN.md');
    await expect(
      page.locator('.download-format[data-doc="postulacion"][data-format="txt"]')
    ).toHaveAttribute('title', 'application.txt');
  });

  test('la vista activa del visor queda marcada en el dialogo', async ({ page }) => {
    await abrirDialogo(page, NIMBUS, 3);
    await expect(page.locator('.download-doc.is-active .download-doc-label')).toHaveText('Cover letter');
  });

  test('entradas sin archivo: deshabilitadas, con el hint del visor', async ({ page }) => {
    await abrirDialogo(page, AURORA);
    const cover = page.locator('.download-doc').nth(3);
    await expect(cover.locator('.download-format').first()).toBeDisabled();
    await expect(cover.locator('.download-hint')).toHaveText(
      'Sin cover-letter.md en la carpeta de la oferta.'
    );
    await expect(page.locator('.download-doc').nth(1).locator('.download-format')).toBeEnabled();
    await expect(page.locator('.download-doc').nth(4).locator('.download-format').first()).toBeEnabled();
  });

  test('la oferta sale como TXT sin frontmatter y la postulacion como MD verbatim', async ({ page }) => {
    await abrirDialogo(page, NIMBUS);
    const [offerTxt] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.download-doc').nth(0).locator('[data-format="txt"]').click()
    ]);
    expect(offerTxt.suggestedFilename()).toBe('offer.txt');
    const offerBody = fs.readFileSync((await offerTxt.path())!, 'utf-8');
    expect(offerBody.startsWith('---')).toBe(false);
    expect(offerBody.trim().length).toBeGreaterThan(0);

    const [appMd] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.download-doc').nth(4).locator('[data-format="md"]').click()
    ]);
    expect(appMd.suggestedFilename()).toBe('application.md');
    const appBody = fs.readFileSync((await appMd.path())!, 'utf-8');
    expect(appBody.startsWith('---')).toBe(true);
    expect(appBody).toContain('estado:');
  });

  test('el JSON del CV adaptado sale con nombre neutro y el documento del visor', async ({ page }) => {
    await abrirDialogo(page, NIMBUS);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.download-format[data-doc="cv"][data-format="json"]').click()
    ]);
    expect(download.suggestedFilename()).toBe('Montiel Ariana - CV - EN.json');
    const body = JSON.parse(fs.readFileSync((await download.path())!, 'utf-8'));
    expect(body.name).toBe('Ariana Montiel');
    expect(Array.isArray(body.experience)).toBe(true);
  });

  test('el PDF del CV imprime solo el documento elegido (print scope)', async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => {
        const w = window as unknown as { __printedTitle?: string; __printDoc?: string };
        w.__printedTitle = document.title;
        w.__printDoc = document.body.dataset.printDoc ?? '';
      };
    });
    await abrirDialogo(page, NIMBUS);
    await page.locator('.download-format[data-doc="cv"][data-format="pdf"]').click();
    const printed = await page.evaluate(() => {
      const w = window as unknown as { __printedTitle?: string; __printDoc?: string };
      return { title: w.__printedTitle, doc: w.__printDoc };
    });
    expect(printed.title).toBe('Montiel Ariana - CV - EN');
    expect(printed.doc).toBe('cv');

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-print-copy="cv"]')).toBeVisible();
    await expect(page.locator('[data-print-copy="oferta"]')).toBeHidden();
    await expect(page.locator('.of-side')).toBeHidden();
    await expect(page.locator('.of-feed')).toBeHidden();
    await expect(page.locator('.of-viewer')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await expect(page.locator('[data-print-copy="cv"]')).toBeHidden();
  });
});
