import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { Packer } from 'docx';
import { clientBlock, projectYears } from '../src/lib/resume-sections';
import { buildResumeDocx } from '../src/scripts/docx-export';
import { loadProfile } from '../src/lib/profile';
import { projectAllPositionings } from '../src/lib/profile-projection';
import { docxText, docxDocumentXml } from './helpers/docx-text';

/**
 * Formato ATS-safe, revision v4 (ADR-0039): estas specs afirman el contrato de
 * render del CV base y del DOCX.
 *
 * Entre la H1 y la H3 la app no exporta nada (Fase H, sin "Descargar"
 * provisorio), asi que el contrato ATS v4 del DOCX se afirma sin UI: se arma el
 * documento con buildResumeDocx (funcion pura) y se empaca con el Packer sobre el
 * perfil demo, y lo que se mira es la capa de texto igual que antes.
 */

const EN = 'article.lang[data-lang="en"][data-positioning="frontend"]';
const ES = 'article.lang[data-lang="es"][data-positioning="frontend"]';

const CLIENT_LINE_EN = '\u2022 Client: Freightline Control (2023-2026) | cargo operations console';
const CLIENT_LINE_ES = '\u2022 Cliente: Freightline Control (2023-2026) | consola de operaciones de carga';

const LONG_DATE_RANGE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+-\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/;

// Mismo perfil demo que usa el build de las specs (PROFILE_SOURCE=example).
const { profile } = loadProfile(path.resolve('src', 'content'), { forceExample: true });
const projections = projectAllPositionings(profile);

function docxOf(locale: 'en' | 'es'): Promise<Buffer> {
  return Packer.toBuffer(buildResumeDocx(projections.frontend[locale], locale));
}

test.describe('Formato ATS v4 — linea de cliente (clientBlock)', () => {
  test('"Marca cliente - descriptor" separa cliente y descriptor, con los anos tras el cliente', () => {
    expect(clientBlock('Aeronix - cargo operations console', 'Jan 2023', 'Aug 2026', 'en')).toBe(
      'Client: Aeronix (2023-2026) | cargo operations console'
    );
    expect(clientBlock('Aeronix - consola de operaciones de carga', 'Ene 2023', 'Ago 2026', 'es')).toBe(
      'Cliente: Aeronix (2023-2026) | consola de operaciones de carga'
    );
  });

  test('sin separador el nombre va completo, con los anos en parentesis', () => {
    expect(clientBlock('Online store checkout', 'Jan 2019', 'Mar 2021', 'en')).toBe(
      'Client: Online store checkout (2019-2021)'
    );
    expect(clientBlock('Checkout de tienda online', 'Ene 2019', 'Mar 2021', 'es')).toBe(
      'Cliente: Checkout de tienda online (2019-2021)'
    );
  });

  test('projectYears compacta a anos y absorbe extremos abiertos', () => {
    expect(projectYears('Jan 2023', 'Aug 2026')).toBe('2023-2026');
    expect(projectYears('Jan 2023', 'Jan 2023')).toBe('2023');
    expect(projectYears('Jan 2023', 'Present')).toBe('2023');
  });
});

test.describe('Formato ATS v4 — CV base', () => {
  test('el empleo va en tres lineas: rol, empresa y fechas del empleo', async ({ page }) => {
    await page.goto('/');
    const head = page.locator(`${EN} .job`).first().locator('.job-head');
    await expect(head.locator('.job-role')).toHaveText('Frontend Developer');
    await expect(head.locator('.job-company')).toHaveText('Aeronix Logistics');
    await expect(head.locator('.job-dates')).toHaveText('Apr 2021 - Aug 2026');
    await expect(head.locator('*')).toHaveCount(3);
  });

  test('la linea de cliente lleva etiqueta, anos en parentesis y descriptor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(`${EN} .proj-line`).first()).toHaveText(CLIENT_LINE_EN);
    await expect(page.locator(`${EN} .proj-line`).nth(1)).toHaveText(
      '\u2022 Client: Customer portal (2021-2022) | self-service'
    );
    // Sin separador " - " el nombre va completo (proyecto interno sin cliente).
    await expect(page.locator(`${EN} .proj-line`).nth(2)).toHaveText(
      '\u2022 Client: Online store checkout (2019-2021)'
    );
  });

  test('la linea de cliente se rotula en es con "Cliente:"', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-es');
    await expect(page.locator(`${ES} .proj-line`).first()).toHaveText(CLIENT_LINE_ES);
  });

  test('los bullets son texto literal: "•" en cliente y "-" en logros', async ({ page }) => {
    await page.goto('/');
    const items = page.locator(`${EN} .job .bullets li`);
    const count = await items.count();
    expect(count).toBeGreaterThan(3);
    for (let i = 0; i < count; i += 1) {
      const text = (await items.nth(i).textContent()) ?? '';
      expect(text.startsWith('\u2022 ') || text.startsWith('- ')).toBe(true);
    }
    await expect(items.nth(0)).toHaveText(CLIENT_LINE_EN);
    await expect(items.nth(1)).toContainText('- Modernized Aeronix');
  });

  test('ningun proyecto muestra un rango de fechas suelto', async ({ page }) => {
    await page.goto('/');
    const subprojects = page.locator(`${EN} .job .subproject`);
    const count = await subprojects.count();
    for (let i = 0; i < count; i += 1) {
      expect((await subprojects.nth(i).textContent()) ?? '').not.toMatch(LONG_DATE_RANGE);
    }
    await expect(subprojects.first()).toContainText('(2023-2026)');
  });

  test('el contacto va en texto plano, sin links', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator(`${EN} .contactline`);
    await expect(contact.locator('a')).toHaveCount(0);
    await expect(contact).toContainText('ariana.montiel@example.com');
    await expect(contact).not.toContainText('mailto:');
    await expect(contact).not.toContainText('http');
  });
});

test.describe('Formato ATS v4 — CV adaptado (oferta demo Aurora Labs, /ofertas)', () => {
  // Decision 8-nov (H1g): el CV adaptado se renderiza en /ofertas con el mismo
  // markup ATS v4 que el CV base. El visor muestra el locale del documento (en
  // para el demo); el contrato de "Cliente:" en es lo siguen cubriendo los unit
  // tests de clientBlock y los del DOCX.
  const AURORA = '2026-10-05-aurora-labs-reactjs-frontend-developer';

  async function openAdaptedCv(page: Page) {
    await page.goto(`/ofertas/?oferta=${AURORA}`);
    await page.click('#of-view-tab-cv');
    // .of-pane acota al visor: las copias de impresion del dialogo "Descargar"
    // (Tanda H3c) traen el mismo markup fuera del panel.
    await expect(page.locator('.of-pane .of-cv')).toBeVisible();
    return page.locator('.of-pane .of-cv');
  }

  test('muestra el mismo formato de linea de cliente y bullets literales', async ({ page }) => {
    const cv = await openAdaptedCv(page);
    await expect(cv.locator('.proj-line').first()).toHaveText(CLIENT_LINE_EN);
    await expect(cv.locator('.bullets li').first()).toHaveText(CLIENT_LINE_EN);
    await expect(cv.locator('.bullet-item').first()).toContainText('- ');
  });

  test('el empleo va en tres lineas y el proyecto sin fechas sueltas', async ({ page }) => {
    const cv = await openAdaptedCv(page);
    const head = cv.locator('.job-head').first();
    await expect(head.locator('.job-role')).toHaveText('Frontend Developer');
    await expect(head.locator('.job-company')).toHaveText('Aeronix Logistics');
    await expect(head.locator('.job-dates')).toHaveText('Apr 2021 - Aug 2026');
    await expect(head.locator('*')).toHaveCount(3);

    const subprojects = cv.locator('.subproject');
    const count = await subprojects.count();
    for (let i = 0; i < count; i += 1) {
      expect((await subprojects.nth(i).textContent()) ?? '').not.toMatch(LONG_DATE_RANGE);
    }
    await expect(subprojects.first()).toContainText('(2023-2026)');
  });

  test('el contacto va en texto plano, sin links', async ({ page }) => {
    const cv = await openAdaptedCv(page);
    const contact = cv.locator('.contactline');
    await expect(contact.locator('a')).toHaveCount(0);
    await expect(contact).toContainText('ariana.montiel@example.com');
    await expect(contact).not.toContainText('mailto:');
    await expect(contact).not.toContainText('http');
  });
});

test.describe('Formato ATS v4 — DOCX (buildResumeDocx + Packer, sin UI)', () => {
  test('la capa de texto trae la linea de cliente y bullets literales', async () => {
    const lines = docxText(await docxOf('en')).split('\n');
    expect(lines).toContain(CLIENT_LINE_EN);
    expect(lines).toContain('\u2022 Client: Customer portal (2021-2022) | self-service');
    expect(lines.some((line) => line.startsWith('- Modernized Aeronix'))).toBe(true);
  });

  test('el empleo va en tres lineas y sin rangos de fecha por proyecto', async () => {
    const text = docxText(await docxOf('en'));
    const lines = text.split('\n');
    expect(lines).toContain('Frontend Developer');
    expect(lines).toContain('Aeronix Logistics');
    expect(lines).toContain('Apr 2021 - Aug 2026');
    expect(text).toContain('(2023-2026)');
    // Rangos de proyecto que difieren del rango de su empleo: no deben aparecer
    // como fechas sueltas. (El rango del proyecto "Online store checkout" es
    // igual al de su empleo, asi que no sirve como assertion negativa.)
    expect(text).not.toContain('Jan 2023 - Aug 2026');
    expect(text).not.toContain('Apr 2021 - Dec 2022');
  });

  test('el contacto es texto plano, sin anotaciones de link', async () => {
    const docx = await docxOf('en');
    const xml = docxDocumentXml(docx);
    expect(xml).not.toContain('hyperlink');
    expect(xml).not.toContain('mailto:');
    expect(docxText(docx)).toContain('ariana.montiel@example.com');
  });

  test('la version en es rotula la linea con "Cliente:"', async () => {
    expect(docxText(await docxOf('es')).split('\n')).toContain(CLIENT_LINE_ES);
  });
});
