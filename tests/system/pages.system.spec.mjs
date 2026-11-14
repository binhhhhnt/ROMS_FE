import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { loginUI } from './helpers.mjs';

const catalogue = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
const endpoints = {
  '/owner/dashboard': '/api/dashboard/overview',
  '/owner/users': '/api/users',
  '/owner/categories': '/api/categories',
  '/owner/menu-items': '/api/menu-items',
  '/owner/menu-items/new': '/api/categories',
  '/tables': '/api/tables',
  '/owner/expenses': '/api/expenses',
  '/owner/reports/revenue': '/api/dashboard/trends',
  '/owner/reports/popular-items': '/api/dashboard/best-selling',
  '/sessions/history': '/api/sessions',
  '/staff/orders': '/api/orders',
  '/tablet/menu': '/api/menu-items',
  '/tablet/orders': '/api/orders',
  '/kitchen/cooking': '/api/kitchen/orders',
  '/kitchen/ready': '/api/kitchen/orders',
  '/kitchen/menu-availability': '/api/menu-items',
  '/kitchen/recipes': '/api/menu-items',
  '/inventory/ingredients': '/api/ingredients',
  '/inventory/purchases': '/api/purchases',
  '/inventory/purchases/new': '/api/ingredients',
  '/inventory/checks': '/api/inventory-checks',
  '/inventory/movements': '/api/stock-movements',
};

for (const item of catalogue.filter(c => c.pageCheck)) {
  test(`${item.id} [partial] ${item.description}`, async ({ page }) => {
    await loginUI(page, item.role);
    const path = item.route === '/kitchen/queue' ? '/kitchen/cooking' : item.route;
    const endpoint = endpoints[path];
    const response = endpoint ? page.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().method() === 'GET') : null;
    await page.goto(item.route);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    if (response) {
      const result = await response;
      expect(result.status(), endpoint).toBe(200);
      expect((await result.json()).success, endpoint).toBe(true);
    }
    if (item.heading) await expect(page.getByRole('heading', { name: item.heading, exact: false }).first()).toBeVisible();
    else await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(/Không thể tải|Lỗi tải dữ liệu|Đã xảy ra lỗi/).first()).not.toBeVisible();
  });
}

test('TA09 Giỏ hàng trống trong browser context mới', async ({ page }) => {
  await loginUI(page, 'TABLE_ACCOUNT');
  await page.goto('/tablet/cart');
  await expect(page.getByRole('heading', { name: 'Giỏ hàng của bạn đang trống', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Xem thực đơn ngay' })).toBeVisible();
});
