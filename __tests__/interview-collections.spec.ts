import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/** Espera a que la isla React esté hidratada y acepte interacción. */
async function waitHydrated(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-interview-hydrated') === 'true'
  );
}

const COLLECTION_SLUG = 'event-loop-y-asincronia';

interface CollectionFixture {
  slug: string;
  title: { en: string; es: string };
  items: { id: string; note: { en: string; es: string } | null; questionIds: string[] }[];
}

const collection: CollectionFixture = JSON.parse(
  fs.readFileSync(path.resolve('src', 'content', 'collections', `${COLLECTION_SLUG}.json`), 'utf8')
);
const collectionQuestionIds = Array.from(
  new Set(collection.items.flatMap((item) => item.questionIds))
);

test.describe('Colecciones de práctica en /interview (Fase J)', () => {
  test('el listado se filtra a los ids de la colección y el panel muestra ejercicios y notas', async ({
    page
  }) => {
    await page.goto('/interview/');
    await waitHydrated(page);

    const allCount = Number(await page.locator('.results-count strong').textContent());
    expect(allCount).toBeGreaterThan(collectionQuestionIds.length);

    await page.getByRole('button', { name: collection.title.en }).click();

    // Conteos: el listado queda acotado a las preguntas de la colección.
    await expect(page.locator('.question-card')).toHaveCount(collectionQuestionIds.length);
    await expect(page.locator('.results-count strong')).toHaveText(
      String(collectionQuestionIds.length)
    );

    // Panel tipo repaso con los ejercicios, sus notas y sus chips.
    const panel = page.locator('.review-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(collection.title.en);
    await expect(panel).toContainText(`${collection.items.length} ejercicios`);
    await expect(panel).toContainText(`${collectionQuestionIds.length} preguntas`);
    await expect(panel.locator('.review-item')).toHaveCount(collection.items.length);
    await expect(panel.locator('.review-item').first()).toContainText(
      collection.items[0].note?.en ?? collection.items[0].id
    );
    await expect(panel.locator('.review-chip')).toHaveCount(collectionQuestionIds.length);
  });

  test('el deep link ?coleccion=<slug> carga la colección', async ({ page }) => {
    await page.goto(`/interview/?coleccion=${COLLECTION_SLUG}`);
    await waitHydrated(page);
    await expect(page.locator('.review-panel')).toBeVisible();
    await expect(page.locator('.review-panel')).toContainText(collection.title.en);
    await expect(page.locator('.question-card')).toHaveCount(collectionQuestionIds.length);
  });

  test('un chip abre la pregunta y su estado de práctica se ve en el chip', async ({ page }) => {
    await page.goto(`/interview/?coleccion=${COLLECTION_SLUG}`);
    await waitHydrated(page);

    const panel = page.locator('.review-panel');
    const firstQuestionId = collection.items[0].questionIds[0];
    await panel.locator('.review-chip').first().click();
    await expect(page.locator('.detail-panel')).toHaveAttribute('data-question-id', firstQuestionId);

    // Sin sistema de marcas nuevo: el chip refleja el progreso por pregunta.
    await expect(panel.locator('.review-chip').first().locator('.chip-status-sin-marcar')).toHaveCount(
      1
    );
    await page.locator('.status-picker').getByRole('button', { name: 'Sé' }).click();
    await expect(panel.locator('.review-chip').first().locator('.chip-status-se')).toHaveCount(1);
  });

  test('salir de la colección restaura el listado y la selección persiste entre visitas', async ({
    page
  }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page.getByRole('button', { name: collection.title.en }).click();
    await expect(page.locator('.review-panel')).toBeVisible();

    await page.getByRole('button', { name: 'Salir de la colección' }).click();
    await expect(page.locator('.review-panel')).toHaveCount(0);
    await expect(page.locator('.question-card')).not.toHaveCount(collectionQuestionIds.length);

    // Volver a elegirla persiste en interview-ui-state: al remontar la isla sigue.
    await page.getByRole('button', { name: collection.title.en }).click();
    await expect(page.locator('.review-panel')).toBeVisible();
    await page.goto('/interview/');
    await waitHydrated(page);
    await expect(page.locator('.review-panel')).toBeVisible();
    await expect(page.locator('.question-card')).toHaveCount(collectionQuestionIds.length);

    // El botón activo también la deselecciona.
    await page.getByRole('button', { name: collection.title.en }).click();
    await expect(page.locator('.review-panel')).toHaveCount(0);
  });
});
