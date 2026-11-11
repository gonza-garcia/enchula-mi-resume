import { test, expect } from '@playwright/test';

test.describe('Enlaces entre /learning y /interview', () => {
  test('cada fase del plan con area enlaza al quiz de /interview', async ({ page }) => {
    await page.goto('/learning/');
    const phase = page.locator('#fase-1-backend-cloud');
    const link = phase.locator('.learning-phase-quiz-link a');
    await expect(link).toHaveText('Practicar el quiz de esta fase en /interview');
    await expect(link).toHaveAttribute('href', '/interview/?quiz=python-backend-cloud');

    const fase6 = page.locator('#fase-6-especializacion');
    await expect(fase6.locator('.learning-phase-quiz-link')).toHaveCount(0);
  });

  test('el link del plan abre el quiz del area en /interview', async ({ page }) => {
    await page.goto('/learning/');
    await page.locator('#fase-3-rag .learning-phase-quiz-link a').click();
    await expect(page).toHaveURL(/\/interview\/\?quiz=rag-retrieval$/);
    await expect(page.locator('.quiz-panel')).toBeVisible();
    await expect(page.locator('.quiz-panel .quiz-intro h3')).toContainText('RAG');
  });

  test('en /interview las areas con fase muestran las skills del plan y enlazan al plan', async ({
    page
  }) => {
    await page.goto('/interview/');
    const item = page.locator('.quiz-area-item').filter({ hasText: 'Agentes y MCP' });
    await expect(item.locator('.quiz-area-plan')).toContainText('Fase del plan');
    await expect(item.locator('.quiz-area-plan')).toContainText('MCP');
    const link = item.locator('.quiz-area-plan a');
    await expect(link).toHaveText('Ver en el plan');
    await expect(link).toHaveAttribute('href', '/learning/#fase-4-agentes-mcp');
  });

  test('las areas sin fase del plan quedan sin enlace', async ({ page }) => {
    await page.goto('/interview/');
    const item = page
      .locator('.quiz-area-item')
      .filter({ has: page.locator('.quiz-area-button', { hasText: 'DSA frontend' }) });
    await expect(item.locator('.quiz-area-plan')).toHaveCount(0);
    await expect(page.locator('.quiz-area-plan')).toHaveCount(5);
  });

  test('el link de vuelta al plan lleva a la fase correcta', async ({ page }) => {
    await page.goto('/interview/');
    await page.locator('.quiz-area-item').filter({ hasText: 'Evals y producción' })
      .locator('.quiz-area-plan a')
      .click();
    await expect(page).toHaveURL(/\/learning\/#fase-5-evals-produccion$/);
    await expect(page.locator('#fase-5-evals-produccion')).toBeVisible();
  });
});
