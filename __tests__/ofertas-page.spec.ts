import { test, expect, type Page } from '@playwright/test';

/**
 * Vista "Ofertas" (Fase F, variante D) contra el build demo: aurora-labs
 * (confirmada, score 85, perfiles frontend) y nimbus (vetada con motivo, score
 * 78, perfiles frontend + ai). Orden del feed: postuladas primero, fecha desc,
 * y dentro del mismo dia el slug desc -> [nimbus, aurora].
 */

const AURORA = '2026-10-05-aurora-labs-reactjs-frontend-developer';
const NIMBUS = '2026-10-05-nimbus-software-senior-frontend-engineer';

async function gotoOfertas(page: Page) {
  await page.goto('/ofertas/');
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-ofertas-hydrated') === 'true'
  );
}

function sidebarItem(page: Page, label: string) {
  return page.locator('.of-side .of-item').filter({ hasText: label });
}

test.describe('Ofertas: variante D como producto', () => {
  test('sidebar de filtros con counts del contrato, perfiles y top matches', async ({ page }) => {
    await gotoOfertas(page);
    const counts: Array<[string, string]> = [
      ['Todas', '2'],
      ['Capturadas', '0'],
      ['Postuladas', '2'],
      ['Confirmada', '1'],
      ['Vetada', '1'],
      ['Frontend Developer', '2'],
      ['AI Developer', '1'],
      ['Top matches', '1']
    ];
    for (const [label, count] of counts) {
      await expect(sidebarItem(page, label).locator('.of-count')).toHaveText(count);
    }
  });

  test('cards compactas: score, rol-empresa, estado/fecha/ATS, chips y 1 linea de motivo', async ({
    page
  }) => {
    await gotoOfertas(page);
    const cards = page.locator('.of-card');
    await expect(cards).toHaveCount(2);

    const nimbus = cards.nth(0);
    await expect(nimbus).toContainText('Senior Frontend Engineer');
    await expect(nimbus).toContainText('Nimbus Software');
    await expect(nimbus.locator('.of-score')).toHaveText('78');
    await expect(nimbus.locator('.of-badge')).toHaveText('vetada');
    await expect(nimbus.locator('.of-clamp')).toContainText('veto del usuario');
    await expect(nimbus.locator('.chip').filter({ hasText: /^remote$/ })).toHaveCount(1);
    await expect(nimbus.locator('.chip').filter({ hasText: /^AI Developer$/ })).toHaveCount(1);

    const aurora = cards.nth(1);
    await expect(aurora).toContainText('ReactJS Frontend Developer');
    await expect(aurora).toContainText('Aurora Labs');
    await expect(aurora.locator('.of-score')).toHaveText('85');
    await expect(aurora.locator('.of-badge')).toHaveText('confirmada');
    await expect(aurora).toContainText('2026-10-05 - ApplyFlow');
    await expect(aurora.locator('.chip').filter({ hasText: /^Frontend Developer$/ })).toHaveCount(1);
  });

  test('clic en una card carga el visor con su oferta original', async ({ page }) => {
    await gotoOfertas(page);
    await expect(page.locator('.of-pane')).toContainText('real-time analytics');
    await page.locator('.of-card').nth(1).click();
    await expect(page.locator('.of-pane')).toContainText('slot-booking');
    await expect(page.locator('.of-card').nth(1)).toHaveClass(/sel/);
  });

  test('el segmented del visor tiene las 4 vistas', async ({ page }) => {
    await gotoOfertas(page);
    const tabs = page.locator('.of-segmented [role="tab"]');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveText('Oferta original');
    await expect(tabs.nth(1)).toHaveText('CV adaptado');
    await expect(tabs.nth(2)).toHaveText('Cover letter');
    await expect(tabs.nth(3)).toHaveText(/Postulaci/);
  });

  test('vista CV adaptado muestra el CV de la carpeta', async ({ page }) => {
    await gotoOfertas(page);
    await page.locator('.of-segmented [role="tab"]').nth(1).click();
    await expect(page.locator('.of-cv .of-cv-name')).toHaveText('Ariana Montiel');
    await expect(page.locator('.of-cv')).toContainText('real-time analytics');
  });

  test('vista Cover letter: texto si existe y estado vacio si no', async ({ page }) => {
    await gotoOfertas(page);
    await page.locator('.of-segmented [role="tab"]').nth(2).click();
    await expect(page.locator('.of-prose')).toContainText('Hi Nimbus team');
    await page.locator('.of-card').nth(1).click();
    await expect(page.locator('.of-pane')).toContainText('Sin cover-letter.md en la carpeta de la oferta.');
  });

  test('vista Postulacion de una vetada: estado, motivo y sin documentos', async ({ page }) => {
    await gotoOfertas(page);
    await page.locator('.of-segmented [role="tab"]').nth(3).click();
    await expect(page.locator('.of-pane .of-badge')).toHaveText('vetada');
    await expect(page.locator('.of-pane')).toContainText(
      'La vacante exige reubicacion y guardias on-call obligatorias: veto del usuario.'
    );
    await expect(page.locator('.of-pane')).toContainText(
      'Sin documentos registrados en application.md.'
    );
  });

  test('vista Postulacion de una confirmada: confirmacion del ATS y documentos', async ({ page }) => {
    await gotoOfertas(page);
    await page.locator('.of-card').nth(1).click();
    await page.locator('.of-segmented [role="tab"]').nth(3).click();
    await expect(page.locator('.of-pane .of-badge')).toHaveText('confirmada');
    await expect(page.locator('.of-pane')).toContainText('ApplyFlow');
    await expect(page.locator('.of-quote')).toContainText('Thanks for applying to Aurora Labs!');
    await expect(
      page.locator('.of-pane .chip').filter({ hasText: /^Montiel Ariana - CV - EN\.pdf$/ })
    ).toHaveCount(1);
    await expect(
      page.locator('.of-pane .chip').filter({ hasText: /^Montiel Ariana - Cover Letter - EN\.pdf$/ })
    ).toHaveCount(1);
  });

  test('menu de tres puntos: Cargar repaso apunta al deep link de Prep entrevistas', async ({
    page
  }) => {
    await gotoOfertas(page);
    await page.locator('.of-card').nth(0).click();
    await page.locator('button[aria-label="Más acciones"]').click();
    await expect(page.locator('.of-menu-item', { hasText: 'Cargar repaso' })).toHaveAttribute(
      'href',
      `/interview/?repaso=${NIMBUS}`
    );
    await page.keyboard.press('Escape');

    await page.locator('.of-card').nth(1).click();
    await page.locator('button[aria-label="Más acciones"]').click();
    const repaso = page.locator('.of-menu-item', { hasText: 'Cargar repaso' });
    await expect(repaso).toHaveAttribute('href', `/interview/?repaso=${AURORA}`);
    await expect(repaso).not.toHaveClass(/disabled/);
  });

  test('menu de tres puntos: Descargar baja el archivo de la vista activa', async ({ page }) => {
    await gotoOfertas(page);
    await page.locator('.of-card').nth(1).click();
    await page.locator('button[aria-label="Más acciones"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.of-menu-item', { hasText: 'Descargar' }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('offer.md');

    await page.locator('.of-segmented [role="tab"]').nth(3).click();
    await page.locator('button[aria-label="Más acciones"]').click();
    const downloadApp = page.waitForEvent('download');
    await page.locator('.of-menu-item', { hasText: 'Descargar' }).click();
    expect((await downloadApp).suggestedFilename()).toBe('application.md');
  });

  test('filtro Estado: Capturadas vacia, Confirmada acota, Limpiar filtros restaura', async ({
    page
  }) => {
    await gotoOfertas(page);
    await sidebarItem(page, 'Capturadas').click();
    await expect(page.locator('.of-feed')).toContainText('No hay ofertas con estos filtros.');
    await page.locator('.btn', { hasText: 'Limpiar filtros' }).click();
    await expect(page.locator('.of-card')).toHaveCount(2);

    await sidebarItem(page, 'Confirmada').click();
    await expect(page.locator('.of-card')).toHaveCount(1);
    await expect(page.locator('.of-card')).toContainText('Aurora Labs');
  });

  test('filtro Perfil: multi-perfil con toggle (una oferta puede estar en varios)', async ({
    page
  }) => {
    await gotoOfertas(page);
    await sidebarItem(page, 'AI Developer').click();
    await expect(page.locator('.of-card')).toHaveCount(1);
    await expect(page.locator('.of-card')).toContainText('Nimbus Software');
    await sidebarItem(page, 'AI Developer').click();
    await expect(page.locator('.of-card')).toHaveCount(2);

    await sidebarItem(page, 'Frontend Developer').click();
    await expect(page.locator('.of-card')).toHaveCount(2);
    await expect(sidebarItem(page, 'Frontend Developer')).toHaveAttribute('aria-pressed', 'true');
  });

  test('filtro Fuente: acota por la fuente de captura (Fase G)', async ({ page }) => {
    await gotoOfertas(page);
    await sidebarItem(page, 'Demo Job Board').click();
    await expect(page.locator('.of-card')).toHaveCount(1);
    await expect(page.locator('.of-card')).toContainText('Aurora Labs');
    await sidebarItem(page, 'Demo Job Board').click();
    await expect(page.locator('.of-card')).toHaveCount(2);

    await sidebarItem(page, 'Demo Curated Spreadsheet').click();
    await expect(page.locator('.of-card')).toHaveCount(1);
    await expect(page.locator('.of-card')).toContainText('Nimbus Software');
  });

  test('seccion Barridos: historial con numeros, detalle de vacantes y particularidades', async ({
    page
  }) => {
    await gotoOfertas(page);
    const sweeps = page.locator('.of-sweeps');
    await expect(sweeps.locator('> summary')).toContainText('Barridos');
    await expect(sweeps.locator('> summary')).toContainText('1 registrado - ultimo 2026-10-05');
    await sweeps.locator('> summary').click();
    await expect(sweeps.locator('.of-sweep')).toHaveCount(1);
    await expect(sweeps).toContainText('descartadas: 1');
    await expect(sweeps).toContainText('Ficticia Corp - Staff Frontend Engineer');
    await expect(sweeps).toContainText('Nivel Staff sin experiencia suficiente');
    await sweeps.locator('.of-sweep-notes > summary').click();
    await expect(sweeps.locator('.of-sweep-notes')).toContainText('feed JSON del board demora');
  });

  test('filtro Top matches (>= 80) deja solo el score alto', async ({ page }) => {
    await gotoOfertas(page);
    await sidebarItem(page, 'Top matches').click();
    await expect(page.locator('.of-card')).toHaveCount(1);
    await expect(page.locator('.of-card')).toContainText('Aurora Labs');
  });

  test('+ Agregar perfil abre el puente de prompts a build-profile', async ({ page }) => {
    await gotoOfertas(page);
    await sidebarItem(page, 'Agregar perfil').click();
    const dialog = page.locator('[role="dialog"]', { hasText: 'Agregar perfil' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('textarea')).toHaveValue(
      /skills\/job-seeking\/build-profile\/SKILL\.md/
    );
    await expect(dialog.locator('button', { hasText: 'Copiar' })).toBeVisible();
    await dialog.locator('button[aria-label="Cerrar"]').click();
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('Ofertas: demo y data derivada del disco', () => {
  test('en build generico solo entran ofertas demo (aurora-labs y nimbus)', async ({ page }) => {
    await gotoOfertas(page);
    await expect(page.locator('.of-card')).toHaveCount(2);
    await expect(page.locator('.of-card').nth(0)).toContainText('Nimbus Software');
    await expect(page.locator('.of-card').nth(1)).toContainText('Aurora Labs');
  });

  test('las cards no ofrecen acciones de envio: el Submit lo aprieta el usuario', async ({
    page
  }) => {
    await gotoOfertas(page);
    await expect(page.locator('.of-card .btn')).toHaveCount(0);
    await expect(page.locator('.of-feed')).not.toContainText('Pedir al agente');
    await expect(page.locator('.of-viewer')).not.toContainText('Pedir al agente');
  });
});
