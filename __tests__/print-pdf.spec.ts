import { test, expect } from '@playwright/test';

test.describe('Print PDF - no browser headers/footers', () => {
  test('@page CSS keeps browser headers and footers out of the print margin', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });
    const printRules = await page.evaluate(() => {
      const pageRule = Array.from(document.styleSheets).flatMap((sheet) => {
        try { return Array.from(sheet.cssRules || []); } catch { return []; }
      }).find((rule) => rule.cssText.includes('@page'));
      const pageBox = document.querySelector('.page');
      const style = pageBox ? getComputedStyle(pageBox) : null;
      return {
        pageRule: pageRule?.cssText || '',
        boxDecorationBreak: style?.boxDecorationBreak || '',
        webkitBoxDecorationBreak: style?.webkitBoxDecorationBreak || ''
      };
    });

    expect(printRules.pageRule).toMatch(/margin:\s*0(?:px)?/i);
    expect(printRules.boxDecorationBreak).toBe('clone');
    expect(printRules.webkitBoxDecorationBreak).toBe('clone');
  });

  test('print media hides toolbar and sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.toolbar')).toBeVisible();
    const printStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const rules = sheet.cssRules || [];
          for (const rule of rules) {
            if (rule instanceof CSSMediaRule && rule.media.mediaText.includes('print')) {
              for (let i = 0; i < rule.cssRules.length; i++) {
                const innerRule = rule.cssRules[i];
                if (innerRule.cssText && innerRule.cssText.includes('.toolbar')) {
                  return { found: true, text: innerRule.cssText };
                }
              }
            }
          }
        } catch {}
      }
      return { found: false };
    });
    expect(printStyles.found).toBe(true);
    expect(printStyles.text).toContain('display: none');
  });

  test('print media preserves the selected accent on resume headings', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });

    const printTheme = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const heading = document.querySelector('.lang.active h2');
      return {
        accent: root.getPropertyValue('--accent').trim(),
        color: heading ? getComputedStyle(heading).color : '',
        printColorAdjust: root.printColorAdjust
      };
    });

    expect(printTheme.accent).toBe('#1a365d');
    expect(printTheme.color).toBe('rgb(26, 54, 93)');
    expect(printTheme.printColorAdjust).toBe('exact');
  });

  test('print keeps a complete subproject together when it fits', async ({ page }) => {
    await page.goto('/');
    const project = page
      .locator('#cv-panel-base .lang.active .subproject')
      .filter({ hasText: 'Client: Freightline Control (2023-2026) | cargo operations console' });
    await expect(project).toContainText('Modernized Aeronix');

    const breakRules = await project.evaluate((element) => {
      const style = getComputedStyle(element);
      return { breakInside: style.breakInside, pageBreakInside: style.pageBreakInside };
    });

    expect(breakRules.breakInside).toBe('avoid');
    expect(breakRules.pageBreakInside).toBe('avoid');
  });

  test('print renders only the active projection', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });
    // checkVisibility: los articulos del panel de adaptados existen en el DOM aunque
    // su tab este inactiva; solo cuenta lo que de verdad se imprime.
    const visible = await page.evaluate(() =>
      Array.from(document.querySelectorAll('article.lang'))
        .filter((article) => article.checkVisibility())
        .map((article) => `${article.getAttribute('data-positioning')}:${article.getAttribute('data-lang')}`)
    );
    expect(visible).toEqual(['frontend:en']);

    await page.emulateMedia({ media: 'screen' });
    await page.locator('button[data-positioning="ai"]').click();
    await page.click('#btn-es');
    await page.emulateMedia({ media: 'print' });
    const switched = await page.evaluate(() =>
      Array.from(document.querySelectorAll('article.lang'))
        .filter((article) => article.checkVisibility())
        .map((article) => `${article.getAttribute('data-positioning')}:${article.getAttribute('data-lang')}`)
    );
    expect(switched).toEqual(['ai:es']);
  });
});
