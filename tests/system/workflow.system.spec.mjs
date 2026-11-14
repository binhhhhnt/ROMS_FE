import { randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';
import { api, client, credentials, rows } from './helpers.mjs';

// Every test creates independent records through the real backend. No HTTP/DB mocks.
const test = base.extend({
  system: async ({}, use, testInfo) => {
    const actors = [];
    const tag = `ST${randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const password = `St!${randomUUID()}`;
    const login = async account => {
      const actor = await client(account);
      actors.push(actor);
      return actor;
    };
    try {
      const owner = await login(credentials('OWNER'));
      const tableA = await api(owner, 'POST', '/api/tables', { tableCode: `${tag}A`, capacity: 4, area: tag }, 201);
      const tableB = await api(owner, 'POST', '/api/tables', { tableCode: `${tag}B`, capacity: 4, area: tag }, 201);
      const users = [];
      const createActor = async (role, tableId) => {
        const username = `${tag}_${role}`;
        const user = await api(owner, 'POST', '/api/users', {
          username, password, fullName: `${tag} ${role}`, role, ...(tableId ? { tableId } : {}),
        }, 201);
        users.push(user.id);
        const actor = await login({ username, password });
        actor.account = { username, password };
        actor.userId = user.id;
        expect((await api(actor, 'GET', '/api/auth/me')).role).toBe(role);
        return actor;
      };
      const staff = await createActor('SERVICE_STAFF');
      const kitchen = await createActor('KITCHEN_STAFF');
      const inventory = await createActor('INVENTORY_STAFF');
      const tablet = await createActor('TABLE_ACCOUNT', tableA.id);
      const ingredient = await api(inventory, 'POST', '/api/ingredients', { name: `${tag} Bột`, unit: 'kg', minimumStock: 1 }, 201);
      const categoryBody = { name: `${tag} Món thử`, description: tag, displayOrder: 999, isActive: true };
      const category = await api(owner, 'POST', '/api/categories', categoryBody, 201);
      const menuBody = { categoryId: category.id, name: `${tag} Món A`, description: tag, price: 50000, isFeatured: false, isDirectSale: false };
      const menu = await api(owner, 'POST', '/api/menu-items', menuBody, 201);
      const recipe = { items: [{ ingredientId: ingredient.id, quantityRequired: 0.2 }] };
      await api(kitchen, 'PUT', `/api/menu-items/${menu.id}/recipe`, recipe);
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const session = await api(staff, 'POST', `/api/sessions/tables/${tableA.id}/open`, undefined, 201);
      const f = { tag, owner, staff, kitchen, inventory, tablet, ingredient, category, categoryBody, menu, menuBody, recipe, tableA, tableB, session, date, login };
      f.stock = async () => Number((await api(inventory, 'GET', `/api/ingredients/${ingredient.id}`)).currentStock);
      f.movements = async () => rows(await api(inventory, 'GET', `/api/stock-movements?ingredientId=${ingredient.id}&size=100&sort=id,asc`));
      f.purchase = async quantity => api(inventory, 'POST', '/api/purchases', {
        purchaseDate: date, note: tag, items: [{ ingredientId: ingredient.id, quantity, unitPrice: 10000 }],
      }, 201);
      f.order = async (quantity = 2, actor = tablet, sessionId = session.id) => api(actor, 'POST', '/api/orders', {
        sessionId, items: [{ menuItemId: menu.id, quantity, note: `${tag} ít cay` }],
      }, 201);
      f.check = async actualQuantity => api(inventory, 'POST', '/api/inventory-checks', {
        note: tag, items: [{ ingredientId: ingredient.id, actualQuantity, reason: tag }],
      }, 201);
      await testInfo.attach('fixture-ids', {
        body: JSON.stringify({ tag, users, tableA: tableA.id, tableB: tableB.id, ingredient: ingredient.id, category: category.id, menu: menu.id, session: session.id }),
        contentType: 'application/json',
      });
      await use(f);
    } finally {
      // Keep business history for diagnosis. Reset the disposable test DB between runs.
      for (const actor of actors.reverse()) {
        try { await api(actor, 'POST', '/api/auth/logout', undefined, 204); }
        catch { testInfo.annotations.push({ type: 'cleanup', description: 'Logout thất bại; phiên test có thể còn hiệu lực.' }); }
        finally { await actor.ctx.dispose(); }
      }
    }
  },
});

test('IS08 IS09 IS11 IS18–IS20 IS22 | Nhập hàng, sửa chênh lệch, kiểm kê và rollback', async ({ system: f }) => {
  const { inventory, ingredient } = f;
  const snapshot = async () => ({ stock: await f.stock(), movements: await f.movements() });
  await test.step('IS08: 2 × 10000 = 20000, kho tăng 2', async () => {
    expect(await f.stock()).toBe(0);
    f.received = await f.purchase(2);
    expect(Number(f.received.totalAmount)).toBe(20000);
    expect(await f.stock()).toBe(2);
  });
  await test.step('IS09: sửa 2 thành 3 chỉ tăng thêm 1', async () => {
    await api(inventory, 'PATCH', `/api/purchases/${f.received.id}/items/${f.received.items[0].id}`, { quantity: 3, unitPrice: 10000, reason: f.tag });
    expect(await f.stock()).toBe(3);
    const saved = await api(inventory, 'GET', `/api/purchases/${f.received.id}`);
    expect(Number(saved.items[0].quantity)).toBe(3);
    expect(Number(saved.totalAmount)).toBe(30000);
  });
  await test.step('IS18/19: dữ liệu âm/0 bị từ chối, không đổi kho/lịch sử', async () => {
    const before = await snapshot();
    for (const quantity of [0, -1]) await api(inventory, 'POST', '/api/purchases', {
      purchaseDate: f.date, items: [{ ingredientId: ingredient.id, quantity, unitPrice: 10000 }],
    }, 400, 'VALIDATION_ERROR');
    await api(inventory, 'POST', '/api/inventory-checks', { items: [{ ingredientId: ingredient.id, actualQuantity: -1 }] }, 400, 'VALIDATION_ERROR');
    expect(await snapshot()).toEqual(before);
  });
  await test.step('IS11: hệ thống 10, thực tế 8, chênh lệch -2', async () => {
    await f.purchase(7);
    expect(await f.stock()).toBe(10);
    const check = await f.check(8);
    expect(Number(check.items[0].difference)).toBe(-2);
    expect(await f.stock()).toBe(8);
    const saved = await api(inventory, 'GET', `/api/inventory-checks/${check.id}`);
    expect(Number(saved.items[0].actualQuantity)).toBe(8);
  });
  await test.step('IS20: kiểm kê bằng tồn kho giữ chênh lệch 0', async () => {
    const check = await f.check(8);
    expect(Number(check.items[0].difference)).toBe(0);
    expect(await f.stock()).toBe(8);
  });
  await test.step('IS22: sửa phiếu sau tiêu thụ làm âm kho phải rollback', async () => {
    await f.order(39); // consumes 7.8, remaining 0.2
    const before = await snapshot();
    const purchaseBefore = await api(inventory, 'GET', `/api/purchases/${f.received.id}`);
    await api(inventory, 'PATCH', `/api/purchases/${f.received.id}/items/${f.received.items[0].id}`, { quantity: 0.001, unitPrice: 10000, reason: f.tag }, 409);
    expect(await snapshot()).toEqual(before);
    expect(await api(inventory, 'GET', `/api/purchases/${f.received.id}`)).toEqual(purchaseBefore);
  });
});

test('TA10 TA13 TA14 TA23 TA24 SS20 KS18 IS21 | Trừ kho, hủy đơn/món và quyền hủy', async ({ system: f }) => {
  await f.purchase(10);
  const order = await f.order();
  await test.step('TA23: hai suất trừ đúng 0.4 và ghi âm một lần', async () => {
    expect(order.status).toBe('PENDING');
    expect(Number(order.totalAmount)).toBe(100000);
    expect(order.items[0].note).toBe(`${f.tag} ít cay`);
    expect(await f.stock()).toBeCloseTo(9.6, 6);
    const movements = (await f.movements()).filter(m => m.orderItemId === order.items[0].id);
    expect(movements).toHaveLength(1);
    expect(Number(movements[0].quantityChange)).toBeCloseTo(-0.4, 6);
  });
  await test.step('KS18: bếp không được hủy; dữ liệu giữ nguyên', async () => {
    const before = await f.movements();
    await api(f.kitchen, 'POST', `/api/orders/${order.id}/cancel`, {}, 403, 'FORBIDDEN');
    await api(f.kitchen, 'POST', `/api/orders/${order.id}/items/${order.items[0].id}/cancel`, {}, 403, 'FORBIDDEN');
    expect((await api(f.staff, 'GET', `/api/orders/${order.id}`)).status).toBe('PENDING');
    expect(await f.stock()).toBeCloseTo(9.6, 6);
    expect(await f.movements()).toEqual(before);
  });
  await test.step('TA13/24: tablet hủy PENDING, hoàn kho đúng một lần', async () => {
    expect((await api(f.tablet, 'POST', `/api/orders/${order.id}/cancel`, {})).status).toBe('CANCELLED');
    expect(await f.stock()).toBe(10);
    const before = await f.movements();
    await api(f.tablet, 'POST', `/api/orders/${order.id}/cancel`, {}, 409);
    expect(await f.stock()).toBe(10);
    expect(await f.movements()).toEqual(before);
    expect(before.filter(m => m.orderItemId === order.items[0].id).map(m => Number(m.quantityChange))).toEqual([-0.4, 0.4]);
  });
  await test.step('SS20 đã sửa: phục vụ được hủy PENDING', async () => {
    const next = await f.order();
    expect((await api(f.staff, 'POST', `/api/orders/${next.id}/cancel`, { reason: f.tag })).status).toBe('CANCELLED');
    expect(await f.stock()).toBe(10);
  });
  await test.step('TA14: hủy một món không thay đổi món khác', async () => {
    const second = await api(f.owner, 'POST', '/api/menu-items', { ...f.menuBody, name: `${f.tag} Món B` }, 201);
    await api(f.kitchen, 'PUT', `/api/menu-items/${second.id}/recipe`, f.recipe);
    const multi = await api(f.tablet, 'POST', '/api/orders', { sessionId: f.session.id, items: [
      { menuItemId: f.menu.id, quantity: 1 }, { menuItemId: second.id, quantity: 1 },
    ] }, 201);
    const target = multi.items.find(i => i.menuItemId === f.menu.id);
    const other = multi.items.find(i => i.menuItemId === second.id);
    await api(f.tablet, 'POST', `/api/orders/${multi.id}/items/${target.id}/cancel`, {});
    const saved = await api(f.tablet, 'GET', `/api/orders/${multi.id}`);
    expect(saved.items.find(i => i.id === target.id).status).toBe('CANCELLED');
    expect(saved.items.find(i => i.id === other.id)).toEqual(other);
    expect(await f.stock()).toBeCloseTo(9.8, 6);
  });
  await test.step('IS21: tổng biến động bằng tồn cuối', async () => {
    const movements = await f.movements();
    expect(movements.every(m => m.ingredientId === f.ingredient.id)).toBe(true);
    let balance = 0;
    for (const movement of movements) {
      balance += Number(movement.quantityChange);
      expect(Number(movement.balanceAfter)).toBeCloseTo(balance, 6);
    }
    expect(await f.stock()).toBeCloseTo(balance, 6);
  });
});

test('KS03 KS05 KS06 KS17 SS07 SS08 SS19 SS21 TA15 OW35 | Giá lịch sử và luồng bếp–phục vụ', async ({ system: f }) => {
  await f.purchase(10);
  const second = await api(f.owner, 'POST', '/api/menu-items', { ...f.menuBody, name: `${f.tag} Món B` }, 201);
  await api(f.kitchen, 'PUT', `/api/menu-items/${second.id}/recipe`, f.recipe);
  const order = await api(f.tablet, 'POST', '/api/orders', { sessionId: f.session.id, items: [
    { menuItemId: f.menu.id, quantity: 1 }, { menuItemId: second.id, quantity: 1 },
  ] }, 201);
  await test.step('OW35: giá cũ giữ 50000, đơn mới dùng 60000', async () => {
    await api(f.owner, 'PUT', `/api/menu-items/${f.menu.id}`, { ...f.menuBody, price: 60000 });
    const saved = await api(f.staff, 'GET', `/api/orders/${order.id}`);
    expect(Number(saved.items.find(i => i.menuItemId === f.menu.id).unitPrice)).toBe(50000);
    const next = await f.order(1);
    expect(Number(next.items[0].unitPrice)).toBe(60000);
    await api(f.tablet, 'POST', `/api/orders/${next.id}/cancel`, {});
  });
  await test.step('SS08: không đóng được phiên còn đơn PENDING', async () => {
    await api(f.staff, 'POST', `/api/sessions/${f.session.id}/close`, undefined, 409);
    expect((await api(f.staff, 'GET', `/api/sessions/${f.session.id}`)).status).toBe('ACTIVE');
  });
  await test.step('KS03/17: nhận đơn và nhận lại không trừ kho thêm', async () => {
    const before = await f.movements();
    expect((await api(f.kitchen, 'POST', `/api/kitchen/orders/${order.id}/accept`)).status).toBe('COOKING');
    await api(f.kitchen, 'POST', `/api/kitchen/orders/${order.id}/accept`, undefined, 409);
    expect(await f.stock()).toBeCloseTo(9.6, 6);
    expect(await f.movements()).toEqual(before);
  });
  await test.step('TA15: không hủy được đơn COOKING', async () => {
    const before = await f.movements();
    await api(f.tablet, 'POST', `/api/orders/${order.id}/cancel`, {}, 409);
    expect(await f.movements()).toEqual(before);
  });
  for (const item of order.items) await api(f.kitchen, 'PATCH', `/api/kitchen/orders/${order.id}/items/${item.id}/status`, { status: 'COOKING' });
  await test.step('SS19: phục vụ không thể hoàn tất món COOKING', async () => {
    await api(f.staff, 'PATCH', `/api/orders/${order.id}/items/${order.items[0].id}/complete`, undefined, 409);
    expect((await api(f.staff, 'GET', `/api/orders/${order.id}`)).items[0].status).toBe('COOKING');
  });
  for (const item of order.items) await api(f.kitchen, 'PATCH', `/api/kitchen/orders/${order.id}/items/${item.id}/status`, { status: 'READY' });
  await test.step('SS21: chỉ hoàn tất đơn sau món cuối', async () => {
    const [first, last] = order.items;
    expect((await api(f.staff, 'PATCH', `/api/orders/${order.id}/items/${first.id}/complete`)).status).toBe('COMPLETED');
    expect((await api(f.staff, 'GET', `/api/orders/${order.id}`)).status).toBe('COOKING');
    await api(f.staff, 'PATCH', `/api/orders/${order.id}/items/${last.id}/complete`);
    expect((await api(f.staff, 'GET', `/api/orders/${order.id}`)).status).toBe('COMPLETED');
    expect(await f.stock()).toBeCloseTo(9.6, 6);
    expect((await api(f.staff, 'POST', `/api/sessions/${f.session.id}/close`)).status).toBe('CLOSED');
  });
});

test('TA11 TA26 SS18 KS09 KS10 KS19 KS20 | Cách ly bàn, hết hàng và trạng thái món', async ({ system: f }) => {
  await f.purchase(10);
  const b = await api(f.staff, 'POST', `/api/sessions/tables/${f.tableB.id}/open`, undefined, 201);
  const other = await f.order(1, f.staff, b.id);
  await test.step('TA26: tablet A không đọc/hủy/đặt cho bàn B', async () => {
    const before = await f.movements();
    await api(f.tablet, 'GET', `/api/orders/${other.id}`, undefined, 403, 'FORBIDDEN');
    await api(f.tablet, 'POST', `/api/orders/${other.id}/cancel`, {}, 403, 'FORBIDDEN');
    await api(f.tablet, 'POST', '/api/orders', { sessionId: b.id, items: [{ menuItemId: f.menu.id, quantity: 1 }] }, 403, 'FORBIDDEN');
    expect((await api(f.staff, 'GET', `/api/orders/${other.id}`)).status).toBe('PENDING');
    expect(await f.movements()).toEqual(before);
  });
  await test.step('SS18: không mở phiên thứ hai', async () => {
    await api(f.staff, 'POST', `/api/sessions/tables/${f.tableA.id}/open`, undefined, 409);
    const active = rows(await api(f.staff, 'GET', `/api/sessions?tableId=${f.tableA.id}&status=ACTIVE`));
    expect(active.map(s => s.id)).toEqual([f.session.id]);
  });
  await test.step('TA11: thiếu kho không tạo đơn/biến động một phần', async () => {
    const before = await f.movements();
    const orders = await api(f.tablet, 'GET', `/api/orders?sessionId=${f.session.id}`);
    await api(f.tablet, 'POST', '/api/orders', { sessionId: f.session.id, items: [{ menuItemId: f.menu.id, quantity: 1000 }] }, 409, 'INSUFFICIENT_STOCK');
    expect(await f.movements()).toEqual(before);
    expect(await api(f.tablet, 'GET', `/api/orders?sessionId=${f.session.id}`)).toEqual(orders);
  });
  await test.step('KS20: lượng công thức 0/âm bị chặn và giữ công thức cũ', async () => {
    const before = await api(f.kitchen, 'GET', `/api/menu-items/${f.menu.id}/recipe`);
    for (const quantityRequired of [0, -1]) await api(f.kitchen, 'PUT', `/api/menu-items/${f.menu.id}/recipe`, { items: [{ ingredientId: f.ingredient.id, quantityRequired }] }, 400, 'VALIDATION_ERROR');
    expect(await api(f.kitchen, 'GET', `/api/menu-items/${f.menu.id}/recipe`)).toEqual(before);
  });
  await test.step('KS09/10: tạm hết món không cho đặt, mở lại khi đủ kho', async () => {
    const before = await f.movements();
    await api(f.kitchen, 'PATCH', `/api/menu-items/${f.menu.id}/status`, { status: 'TEMPORARILY_UNAVAILABLE' });
    await api(f.tablet, 'POST', '/api/orders', { sessionId: f.session.id, items: [{ menuItemId: f.menu.id, quantity: 1 }] }, 409);
    expect(await f.movements()).toEqual(before);
    await api(f.kitchen, 'PATCH', `/api/menu-items/${f.menu.id}/status`, { status: 'AVAILABLE' });
    expect((await f.order(1)).status).toBe('PENDING');
  });
  await test.step('KS19: bếp không khôi phục món đã DISCONTINUED', async () => {
    await api(f.owner, 'PATCH', `/api/menu-items/${f.menu.id}/status`, { status: 'DISCONTINUED' });
    await api(f.kitchen, 'PATCH', `/api/menu-items/${f.menu.id}/status`, { status: 'AVAILABLE' }, 403, 'FORBIDDEN');
  });
});

test('OW12 OW13 OW14 OW16 OW23 OW24 OW34 IS03 IS04 IS05 KS12 TA27 | Dữ liệu nền và phiên tài khoản', async ({ system: f }) => {
  await test.step('OW12/34 IS03 KS12: kiểm tra dữ liệu đã lưu qua API đọc', async () => {
    expect((await api(f.tablet, 'GET', '/api/auth/me')).tableId).toBe(f.tableA.id);
    expect((await api(f.owner, 'GET', `/api/users/${f.staff.userId}`)).role).toBe('SERVICE_STAFF');
    const ingredient = await api(f.inventory, 'GET', `/api/ingredients/${f.ingredient.id}`);
    expect(ingredient.name).toBe(`${f.tag} Bột`);
    expect(ingredient.unit).toBe('kg');
    expect(Number(ingredient.minimumStock)).toBe(1);
    expect((await api(f.owner, 'GET', `/api/tables/${f.tableA.id}`)).tableCode).toBe(`${f.tag}A`);
    expect((await api(f.owner, 'GET', `/api/categories/${f.category.id}`)).name).toBe(f.categoryBody.name);
    const recipe = await api(f.kitchen, 'GET', `/api/menu-items/${f.menu.id}/recipe`);
    expect(recipe.items).toContainEqual(expect.objectContaining({ ingredientId: f.ingredient.id }));
  });
  await test.step('OW13/24: tên đăng nhập và mã bàn trùng phải bị chặn', async () => {
    await api(f.owner, 'POST', '/api/users', { ...f.staff.account, fullName: f.tag, role: 'SERVICE_STAFF' }, 409, 'DUPLICATE_USERNAME');
    await api(f.owner, 'POST', '/api/tables', { tableCode: f.tableA.tableCode, capacity: 4, area: f.tag }, 409);
    const users = rows(await api(f.owner, 'GET', `/api/users?search=${f.staff.account.username}`));
    expect(users.filter(u => u.username === f.staff.account.username)).toHaveLength(1);
    const tables = rows(await api(f.owner, 'GET', `/api/tables?search=${f.tableA.tableCode}`));
    expect(tables.filter(t => t.tableCode === f.tableA.tableCode)).toHaveLength(1);
  });
  await test.step('IS04/05: chặn nguyên liệu sai và sửa không mất lịch sử', async () => {
    for (const body of [ { name: '', unit: 'kg', minimumStock: 1 }, { name: `${f.tag} invalid`, unit: 'kg', minimumStock: -1 } ]) {
      await api(f.inventory, 'POST', '/api/ingredients', body, 400, 'VALIDATION_ERROR');
    }
    await f.purchase(2);
    const before = await f.movements();
    await api(f.inventory, 'PUT', `/api/ingredients/${f.ingredient.id}`, { name: `${f.tag} updated`, unit: 'kg', minimumStock: 3 });
    const saved = await api(f.inventory, 'GET', `/api/ingredients/${f.ingredient.id}`);
    expect(saved.name).toBe(`${f.tag} updated`);
    expect(Number(saved.minimumStock)).toBe(3);
    expect(await f.stock()).toBe(2);
    expect(await f.movements()).toEqual(before);
  });
  await test.step('TA27: lần đăng nhập mới thu hồi JWT và refresh cũ ngay', async () => {
    const next = await f.login(f.tablet.account);
    await api(f.tablet, 'GET', '/api/auth/me', undefined, 401, 'UNAUTHORIZED');
    expect((await f.tablet.ctx.post('/api/auth/refresh')).status()).toBe(401);
    expect((await api(next, 'GET', '/api/auth/me')).tableId).toBe(f.tableA.id);
  });
  await test.step('OW14: khóa tài khoản chặn login, JWT và refresh cũ', async () => {
    await api(f.owner, 'PATCH', `/api/users/${f.staff.userId}/status`, { isActive: false });
    await api(f.staff, 'GET', '/api/auth/me', undefined, 401, 'UNAUTHORIZED');
    expect((await f.staff.ctx.post('/api/auth/login', { data: f.staff.account })).status()).toBe(401);
    expect((await f.staff.ctx.post('/api/auth/refresh')).status()).toBe(401);
  });
});
