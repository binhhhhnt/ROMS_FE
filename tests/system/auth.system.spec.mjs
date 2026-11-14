import { test, expect } from '@playwright/test';
import { api, client, credentials, loginUI, roles } from './helpers.mjs';

test.describe('@public Biểu mẫu đăng nhập', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/login'); });

  test('OW01 Hiển thị trang đăng nhập', async ({ page }) => {
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Quên mật khẩu?' })).toBeVisible();
  });

  for (const [id, username, password, messages] of [
    ['OW02', '', '', ['Vui lòng nhập tên đăng nhập hoặc email', 'Vui lòng nhập mật khẩu']],
    ['OW03', 'system_test', '123', ['Mật khẩu phải có ít nhất 6 ký tự']],
  ]) {
    test(`${id} Chặn dữ liệu sai trước khi gửi login`, async ({ page }) => {
      const calls = [];
      page.on('request', r => { if (r.url().endsWith('/api/auth/login')) calls.push(r); });
      await page.locator('#username').fill(username);
      await page.locator('#password').fill(password);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      for (const message of messages) await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(page).toHaveURL(/\/login$/);
      expect(calls).toHaveLength(0);
    });
  }

  test('OW04 Ẩn/hiện không thay đổi mật khẩu', async ({ page }) => {
    await page.locator('#password').fill('SystemTest123!');
    await expect(page.locator('#password')).toHaveValue('SystemTest123!');
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await expect(page.locator('#password')).toHaveValue('SystemTest123!');
    await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#password')).toHaveValue('SystemTest123!');
  });

  test('OW05 Mở quên mật khẩu', async ({ page }) => {
    await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

for (const role of roles) {
  test.describe(role.role, () => {
    test(`${role.prefix}${role.login} Đăng nhập đúng workspace`, async ({ page }) => {
      await loginUI(page, role.role);
    });

    test(`${role.prefix}${role.bad} Từ chối sai mật khẩu`, async ({ page }) => {
      await page.goto('/login');
      await page.locator('#username').fill(credentials(role.role).username);
      await page.locator('#password').fill('Incorrect-System-Password-9f45d!');
      const response = page.waitForResponse(r => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      expect((await response).status()).toBe(401);
      await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
      await expect(page).toHaveURL(/\/login$/);
      await page.goto(role.home);
      await expect(page).toHaveURL(/\/login$/);
    });

    test(`${role.prefix}${role.reload} Khôi phục bằng refresh cookie sau reload`, async ({ page }) => {
      await loginUI(page, role.role);
      const refresh = page.waitForResponse(r => r.url().endsWith('/api/auth/refresh'));
      await page.reload();
      expect((await refresh).status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${role.home}$`));
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    });

    test(`${role.prefix}${role.logout} Đăng xuất và không khôi phục được phiên cũ`, async ({ page }) => {
      await loginUI(page, role.role);
      const logout = page.waitForResponse(r => r.url().endsWith('/api/auth/logout') && r.request().method() === 'POST');
      await page.getByRole('button', { name: /Đăng xuất/ }).first().click();
      if (role.role === 'TABLE_ACCOUNT') {
        await page.locator('#table-logout-password').fill(credentials(role.role).password);
        await page.getByRole('button', { name: 'Xác nhận đăng xuất', exact: true }).click();
      }
      expect((await logout).status()).toBe(204);
      await expect(page).toHaveURL(/\/login$/);
      await page.goto(role.home);
      await expect(page).toHaveURL(/\/login$/);
    });

    if (role.denied) test(`${role.prefix}${role.denied} Chặn trang và API owner`, async ({ page }) => {
      await loginUI(page, role.role);
      await page.goto('/owner/users');
      await expect(page).toHaveURL(/\/access-denied$/);
      const actor = await client(credentials(role.role));
      try { await api(actor, 'GET', '/api/users', undefined, 403, 'FORBIDDEN'); }
      finally { await actor.ctx.dispose(); }
    });
  });
}
