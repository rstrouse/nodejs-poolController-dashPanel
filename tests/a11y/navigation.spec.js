const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function expectNoCriticalA11yViolations(page, scopeSelector) {
  let builder = new AxeBuilder({ page });
  if (scopeSelector) builder = builder.include(scopeSelector);
  const results = await builder.analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical, `A11y violations: ${JSON.stringify(critical, null, 2)}`).toEqual([]);
}

test.describe('Accessibility Navigation Contract', () => {
  test('settings and backups tab are keyboard/aria navigable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nav-id="settings-open"]')).toBeVisible();

    const settingsBtn = page.getByRole('button', { name: 'Open Settings' });
    await settingsBtn.focus();
    await settingsBtn.press('Enter');

    const backupsTab = page.locator('[data-nav-id="tab-tabbackup"]').first();
    await expect(backupsTab).toBeVisible();
    await backupsTab.focus();
    await backupsTab.press('Enter');

    // Backups content should be reachable after selecting the tab.
    await expect(page.getByText(/Automatic Backups/i).first()).toBeVisible({ timeout: 15000 });

    await expectNoCriticalA11yViolations(page, 'div.picAppSettings');
  });

  test('message manager tabs and actions expose stable navigation hooks', async ({ page }) => {
    await page.goto('/messageManager.html');

    await expect(page.locator('[data-nav-id="mmgr-clear-messages"]')).toBeVisible();
    await expect(page.locator('[data-nav-id="mmgr-filter-display"]')).toBeVisible();
    await expect(page.locator('[data-nav-id="mmgr-choose-files"]')).toBeVisible();

    const entityFlowTab = page.locator('[data-nav-id="tab-tabentityflow"]').first();
    await expect(entityFlowTab).toBeVisible();
    await entityFlowTab.click();

    // Live region exists for status announcements.
    await expect(page.locator('.mmgr-live-region')).toHaveAttribute('aria-live', 'polite');

    await expectNoCriticalA11yViolations(page, '.mmgrTabHeader');
  });
});
