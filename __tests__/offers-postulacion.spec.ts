import { test, expect, type Page } from '@playwright/test';

/**
 * Cambio 3 de la Fase F: chip de estado y seccion "Postulacion" en el gestor de
 * ofertas (tab "CVs adaptados") + deep link ?tab=adaptados&oferta=<slug>. Contra
 * el build demo: aurora-labs (confirmada) y nimbus (descartada con motivo).
 */

const AURORA = '2026-10-05-aurora-labs-reactjs-frontend-developer';
const NIMBUS = '2026-10-05-nimbus-software-senior-frontend-engineer';

async function waitHydrated(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-offers-hydrated') === 'true'
  );
}

test.describe('Chip de estado de la postulacion en las cards', () => {
  test('las cards con application.md muestran el chip con su estado', async ({ page }) => {
    await page.goto('/?tab=adaptados');
    await waitHydrated(page);
    const nimbus = page.locator('.offer-card').filter({ hasText: 'Nimbus Software' });
    await expect(nimbus.locator('.offer-card-post')).toHaveText(/Postulaci.n: descartada/);
    const aurora = page.locator('.offer-card').filter({ hasText: 'Aurora Labs' });
    await expect(aurora.locator('.offer-card-post')).toHaveText(/Postulaci.n: confirmada/);
  });
});

test.describe('Seccion Postulacion en el panel del gestor', () => {
  test('descartada: estado, motivo y sin documentos', async ({ page }) => {
    await page.goto('/?tab=adaptados');
    await waitHydrated(page);
    await page
      .locator('.offer-card')
      .filter({ hasText: 'Nimbus Software' })
      .locator('.offer-card-select')
      .click();
    const post = page.locator('.offer-post');
    await expect(post.locator('.of-badge')).toHaveText('descartada');
    await expect(post).toContainText(
      'La vacante exige reubicacion y guardias on-call obligatorias: veto del usuario.'
    );
    await expect(post).toContainText('Sin documentos registrados en application.md.');
  });

  test('confirmada: confirmacion del ATS y documentos', async ({ page }) => {
    await page.goto('/?tab=adaptados');
    await waitHydrated(page);
    await page
      .locator('.offer-card')
      .filter({ hasText: 'Aurora Labs' })
      .locator('.offer-card-select')
      .click();
    const post = page.locator('.offer-post');
    await expect(post.locator('.of-badge')).toHaveText('confirmada');
    await expect(post.locator('.offer-post-quote')).toContainText(
      'Thanks for applying to Aurora Labs!'
    );
    await expect(
      post.locator('.chip').filter({ hasText: /^Montiel Ariana - CV - EN\.pdf$/ })
    ).toHaveCount(1);
    await expect(
      post.locator('.chip').filter({ hasText: /^Montiel Ariana - Cover Letter - EN\.pdf$/ })
    ).toHaveCount(1);
  });
});

test.describe('Deep link ?tab=adaptados&oferta=<slug>', () => {
  test('selecciona la oferta pedida y muestra su postulacion', async ({ page }) => {
    // aurora-labs es la segunda del listado: si el deep link la selecciona, el
    // parametro manda sobre el default.
    await page.goto(`/?tab=adaptados&oferta=${AURORA}`);
    await waitHydrated(page);
    await expect(page.locator('.offer-card.active')).toContainText('Aurora Labs');
    await expect(page.locator('.split-header h3')).toContainText('Aurora Labs');
    await expect(page.locator('.offer-post .of-badge')).toHaveText('confirmada');
  });

  test('activa la tab CVs adaptados junto con la oferta', async ({ page }) => {
    await page.goto(`/?tab=adaptados&oferta=${NIMBUS}`);
    await waitHydrated(page);
    await expect(page.locator('html')).toHaveAttribute('data-cv-tab', 'adapted');
    await expect(page.locator('.offer-card.active')).toContainText('Nimbus Software');
    await expect(page.locator('.offer-post .of-badge')).toHaveText('descartada');
  });

  test('un slug desconocido cae en la seleccion por defecto, sin romper nada', async ({ page }) => {
    await page.goto('/?tab=adaptados&oferta=slug-que-no-existe');
    await waitHydrated(page);
    await expect(page.locator('.offer-card.active')).toHaveCount(1);
    await expect(page.locator('.offer-post')).toBeVisible();
    await expect(page.locator('.offer-post .of-badge')).toHaveCount(1);
  });
});
