import { expect, request } from '@playwright/test';

export const apiURL = process.env.ROMS_API_URL || 'http://127.0.0.1:8080';
export const roles = [
  { role: 'OWNER', prefix: 'OW', login: '09', bad: '31', reload: '33', logout: '32', home: '/owner/dashboard' },
  { role: 'SERVICE_STAFF', prefix: 'SS', login: '01', bad: '15', reload: '17', logout: '16', denied: '14', home: '/tables' },
  { role: 'TABLE_ACCOUNT', prefix: 'TA', login: '01', bad: '19', reload: '21', logout: '20', denied: '18', home: '/tablet/welcome' },
  { role: 'KITCHEN_STAFF', prefix: 'KS', login: '01', bad: '14', reload: '16', logout: '15', denied: '13', home: '/kitchen/cooking' },
  { role: 'INVENTORY_STAFF', prefix: 'IS', login: '01', bad: '15', reload: '17', logout: '16', denied: '14', home: '/inventory/ingredients' },
];

export function credentials(role) {
  const username = process.env[`ROMS_${role}_USERNAME`];
  const password = process.env[`ROMS_${role}_PASSWORD`];
  if (!username || !password) {
    throw new Error(`Thiếu ROMS_${role}_USERNAME / ROMS_${role}_PASSWORD. Xem tests/system/README.md.`);
  }
  return { username, password };
}

export async function loginUI(page, role) {
  const account = credentials(role);
  await page.goto('/login');
  await page.locator('#username').fill(account.username);
  await page.locator('#password').fill(account.password);
  const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  expect((await responsePromise).status(), 'Login API phải thành công').toBe(200);
  await expect(page).toHaveURL(new RegExp(`${roles.find(r => r.role === role).home}$`));
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
}

export async function client(account) {
  const ctx = await request.newContext({ baseURL: apiURL });
  try {
    const response = await ctx.post('/api/auth/login', { data: account });
    expect(response.status(), 'Đăng nhập API: kiểm tra URL, tài khoản và hạ tầng').toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toEqual(expect.any(String));
    return { ctx, token: body.data.accessToken };
  } catch (error) {
    await ctx.dispose();
    throw error;
  }
}

export async function api(actor, method, path, data, status = 200, code) {
  const response = await actor.ctx.fetch(path, {
    method, data, headers: { Authorization: `Bearer ${actor.token}` },
  });
  // Never include the body in errors: authentication responses can contain secrets.
  expect(response.status(), `${method} ${path}`).toBe(status);
  if (status === 204) return undefined;
  const body = await response.json();
  expect(body.success, `${method} ${path}: success`).toBe(status < 400);
  if (status >= 400) {
    expect(body.error?.code).toEqual(expect.any(String));
    if (code) expect(body.error.code).toBe(code);
    return body;
  }
  return body.data;
}

export function rows(page) {
  expect(page.content).toEqual(expect.any(Array));
  return page.content;
}
