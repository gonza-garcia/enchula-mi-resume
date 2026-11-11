import { test, expect } from '@playwright/test';
import fs from 'node:fs';

/** Espera a que la isla React esté hidratada y acepte interacción. */
async function waitHydrated(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-interview-hydrated') === 'true'
  );
}

test.describe('Interview prep page /interview/', () => {
  test('main CV exposes the interview prep navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav.site-nav a[href="/interview/"]')).toHaveText('Prep entrevistas');
  });

  test('renders the question bank with a detail panel in normal scroll', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await expect(page.getByRole('heading', { name: 'Prep entrevistas' })).toBeVisible();
    await expect(page.locator('.question-card')).toHaveCount(383);
    await expect(page.locator('.detail-panel')).toBeVisible();
    // La respuesta se muestra siempre: no hay toggle que abra ni cierre nada.
    await expect(page.locator('.answer-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver respuesta' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ocultar respuesta' })).toHaveCount(0);
  });

  test('empty facet selection shows no results until something is checked', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page.getByRole('checkbox', { name: 'Todas las áreas' }).click();
    await expect(page.locator('.question-card')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No encontramos preguntas con esos filtros.' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Agentes y MCP' }).check();
    await expect(page.locator('.question-card')).toHaveCount(14);
  });

  test('global search opens with Ctrl+K, ranks results and jumps with its actions', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    // El atajo vive en la isla hidratada: reintentar cubre el ms de hidratación.
    await expect(async () => {
      await page.keyboard.press('Control+k');
      await expect(page.getByRole('combobox', { name: 'Búsqueda global' })).toBeVisible({ timeout: 400 });
    }).toPass();
    const input = page.getByRole('combobox', { name: 'Búsqueda global' });

    await input.fill('prompting');
    await expect(page.getByText(/Coinciden en el área/)).toBeVisible();

    // Seleccionar un resultado navega a la pregunta (sin toggle de respuesta).
    const firstRow = page.locator('.search-result-row').first();
    const title = ((await firstRow.locator('.search-result-title').textContent()) ?? '').trim();
    await firstRow.locator('.search-result-main').click();
    await expect(page.getByRole('combobox', { name: 'Búsqueda global' })).toBeHidden();
    await expect(page.locator('.detail-panel h2')).toHaveText(title);
    await expect(page.locator('.answer-panel')).toBeVisible();
  });

  test('filters cards by search and shows the answer without any toggle', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    const search = page.getByRole('searchbox', { name: 'Filtro de preguntas' });
    await search.fill('stale results');
    await expect(page.locator('.question-card')).toHaveCount(2);
    await expect(page.locator('.question-card').first()).toContainText(/stale/i);

    await expect(page.locator('.answer-panel')).toBeVisible();
  });

  test('supports every sort order and area filter', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    const firstCard = page.locator('.question-card').first();
    await expect(firstCard.locator('.level-pill')).toContainText('Junior');

    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('level-desc');
    await expect(firstCard.locator('.level-pill')).toContainText('Architect');

    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('area');
    await expect(firstCard.locator('.card-area')).toContainText('Accesibilidad');

    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('frequency');
    await expect(firstCard.locator('.level-pill')).toContainText('Junior');

    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('random');
    const beforeShuffle = await firstCard.textContent();
    await page.getByRole('button', { name: 'Re-mezclar' }).click();
    await expect(firstCard).not.toHaveText(beforeShuffle ?? '');

    await page.getByRole('checkbox', { name: 'Agentes y MCP' }).uncheck();
    await expect(page.locator('.question-card')).toHaveCount(369);
    await page.getByRole('checkbox', { name: 'Agentes y MCP' }).check();
    await expect(page.locator('.question-card')).toHaveCount(383);

    const secondCard = page.locator('.question-card').nth(1);
    const secondTitle = ((await secondCard.locator('.card-question').textContent()) ?? '').trim();
    await secondCard.dispatchEvent('click');
    await expect(secondCard).toHaveClass(/active/);
    await expect(page.locator('.detail-panel h2')).toHaveText(secondTitle);
    await expect(page.locator('.answer-panel')).toBeVisible();
  });

  test('renders the global sources section', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await expect(page.getByRole('heading', { name: 'Fuentes globales' })).toBeVisible();
    await expect(page.locator('.sources-grid a').first()).toBeVisible();
  });

  test('supports curiosidades and code toggles', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    const total = await page.locator('.question-card').count();
    await page.getByRole('checkbox', { name: 'Con curiosidades' }).check();
    const curiosityCount = await page.locator('.question-card').count();
    expect(curiosityCount).toBeGreaterThan(0);
    expect(curiosityCount).toBeLessThan(total);

    await page.getByRole('checkbox', { name: 'Tiene código' }).check();
    const codeCount = await page.locator('.question-card').count();
    expect(codeCount).toBeGreaterThan(0);
    expect(codeCount).toBeLessThanOrEqual(curiosityCount);
  });

  test('opens an area quiz and an accessible code scenario', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page
      .locator('.quiz-area-item')
      .filter({ hasText: 'Agentes y MCP' })
      .locator('.quiz-area-button')
      .dispatchEvent('click');
    await expect(page.locator('.quiz-panel')).toBeVisible();
    const mcqCount = await page.locator('.mcq').count();
    expect(mcqCount).toBeGreaterThanOrEqual(10);
    expect(mcqCount).toBeLessThanOrEqual(12);
    await page.locator('.mcq input[type="radio"]').first().dispatchEvent('click');
    await expect(page.locator('.mcq-feedback').first()).toBeVisible();
    await page.locator('.scenario').first().locator('summary').dispatchEvent('click');
    await expect(page.locator('.scenario-answer').first()).toBeVisible();
    // Shell de código accesible (ADR-0046): grupo con aria-label, gutter y pre
    // enfocable para scroll con teclado.
    const shell = page.locator('.scenario .code-shell').first();
    await expect(shell).toHaveAttribute('role', 'group');
    await expect(shell.locator('.code-gutter')).toHaveAttribute('aria-hidden', 'true');
    await expect(shell.locator('pre[tabindex="0"]').first()).toBeVisible();
  });

  test('switches the content language to Spanish and persists it', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page.getByRole('searchbox', { name: 'Filtro de preguntas' }).fill('event-loop-model');
    await expect(page.locator('.question-card')).toHaveCount(1);
    await page.locator('.question-card').first().dispatchEvent('click');
    await expect(page.locator('.detail-panel h2')).toContainText('What is the JavaScript event loop');
    await expect(page.locator('.curiosity-item h3').first()).toContainText('setTimeout');

    await page.getByRole('button', { name: 'ES', exact: true }).click();
    await expect(page.locator('.detail-panel h2')).toContainText('¿Qué es el event loop');
    await expect(page.locator('.curiosity-item h3').filter({ hasText: 'congela la pestaña' })).toHaveCount(1);

    await page.reload();
    await waitHydrated(page);
    await expect(page.locator('.detail-panel h2')).toContainText('¿Qué es el event loop');
  });

  test('persists the selected level color style independently', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page.getByRole('button', { name: 'Fría' }).click();
    await expect(page.locator('.interview-app')).toHaveClass(/level-style-cool/);
    await page.reload();
    await expect(page.locator('.interview-app')).toHaveClass(/level-style-cool/);
  });

  test('persists the view state (filters, sort and selection) across routes', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page.getByRole('checkbox', { name: 'Agentes y MCP' }).uncheck();
    await expect(page.locator('.question-card')).toHaveCount(369);
    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('area');
    await page.locator('.question-card').nth(3).dispatchEvent('click');
    const selectedId = await page.locator('.detail-panel').getAttribute('data-question-id');
    expect(selectedId).toBeTruthy();

    // Astro es MPA: salir y volver remonta la isla desde cero.
    await page.locator('nav.site-nav a[href="/ofertas/"]').click();
    await expect(page).toHaveURL(/\/ofertas\/?$/);
    await page.locator('nav.site-nav a[href="/interview/"]').click();
    await waitHydrated(page);

    await expect(page.getByRole('checkbox', { name: 'Agentes y MCP' })).not.toBeChecked();
    await expect(page.locator('.question-card')).toHaveCount(369);
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('area');
    await expect(page.locator('.detail-panel')).toHaveAttribute('data-question-id', selectedId ?? '');
    await expect(page.locator('.answer-panel')).toBeVisible();
  });

  test('restores only stored state that still exists in the bank', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'interview-ui-state',
        JSON.stringify({
          version: 1,
          filters: {
            areas: ['agents-mcp', 'area-que-no-existe'],
            levels: ['junior', 'semi-senior', 'senior', 'staff-lead', 'architect'],
            roles: ['frontend', 'backend', 'fullstack'],
            frequencies: ['muy-preguntada', 'clave-menos-frecuente', 'clave-muy-poco-frecuente'],
            search: '',
            onlyCuriosidades: false,
            onlyCode: false
          },
          sort: 'frequency',
          randomSeed: 3,
          selectedId: 'pregunta-que-no-existe',
          onlyReview: false
        })
      );
    });
    await page.goto('/interview/');
    await waitHydrated(page);

    // El área que ya no existe se descarta y la válida se conserva (intersección).
    await expect(page.locator('.question-card')).toHaveCount(14);
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('frequency');
    const selectedId = await page.locator('.detail-panel').getAttribute('data-question-id');
    expect(selectedId).toBeTruthy();
    expect(selectedId).not.toBe('pregunta-que-no-existe');
  });

  test('Limpiar resetea la vista y persiste el estado limpio', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    await page.getByRole('searchbox', { name: 'Filtro de preguntas' }).fill('zzz sin resultados');
    await expect(page.locator('.question-card')).toHaveCount(0);

    await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
    await expect(page.locator('.question-card')).toHaveCount(383);
    await expect(page.getByRole('searchbox', { name: 'Filtro de preguntas' })).toHaveValue('');

    await page.reload();
    await waitHydrated(page);
    await expect(page.locator('.question-card')).toHaveCount(383);
    await expect(page.getByRole('searchbox', { name: 'Filtro de preguntas' })).toHaveValue('');
  });

  test('persists learning state and notes and can clear them', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    const detail = page.locator('.detail-panel');
    await detail.getByRole('button', { name: 'Sé' }).click();
    await detail.getByRole('button', { name: 'Mis notas' }).click();
    await detail.getByRole('textbox', { name: 'Mis notas' }).fill('Repasar event loop y coerción.');

    await page.reload();
    const reloaded = page.locator('.detail-panel');
    await expect(reloaded.getByRole('button', { name: 'Sé' })).toHaveAttribute('aria-pressed', 'true');
    await expect(reloaded.getByRole('textbox', { name: 'Mis notas' })).toHaveValue('Repasar event loop y coerción.');

    await page.locator('.question-card').nth(1).dispatchEvent('click');
    await expect(page.locator('.detail-panel').getByRole('button', { name: 'Sin marcar' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Limpiar progreso' }).click();
    await expect(page.locator('.detail-panel').getByRole('button', { name: 'Sin marcar' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.detail-panel').getByRole('button', { name: 'Mis notas' }).click();
    await expect(page.locator('.detail-panel').getByRole('textbox', { name: 'Mis notas' })).toHaveValue('');
  });

  test('exports and imports progress with validation', async ({ page }) => {
    await page.goto('/interview/');
    await waitHydrated(page);
    const detail = page.locator('.detail-panel');
    await detail.getByRole('button', { name: 'Repasar' }).click();
    const questionId = await detail.getAttribute('data-question-id');
    expect(questionId).toBeTruthy();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar progreso' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('interview-progress.json');
    const downloaded = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(downloaded.version).toBe(1);
    expect(downloaded.entries[questionId as string].status).toBe('repasar');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":2,"entries":{}}')
    });
    await expect(page.locator('.progress-feedback')).toContainText('inválido');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'good.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ version: 1, entries: { [questionId as string]: { status: 'se', note: 'importado' } } })
      )
    });
    await expect(page.locator('.progress-feedback')).toContainText('importado');
    await expect(detail.getByRole('button', { name: 'Sé' })).toHaveAttribute('aria-pressed', 'true');
    await expect(detail.getByRole('textbox', { name: 'Mis notas' })).toHaveValue('importado');
  });
});
