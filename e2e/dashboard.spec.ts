import { test, expect } from '@playwright/test';

test('homepage loads with title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('AI Feeds');
});

test('category filter is rendered', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'PLUGIN' })).toBeVisible();
});
