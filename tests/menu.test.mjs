import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { menuApi } = await import('../src/features/menu/api/menuApi.ts')
const { categoryApi } = await import('../src/features/menu/api/categoryApi.ts')
const { menuItemSchema } = await import('../src/features/menu/schemas/menuItemSchema.ts')
const { categorySchema } = await import('../src/features/menu/schemas/categorySchema.ts')
const { positiveMenuId, orderedMenuImages, menuImageFileError, isMenuStatus, getMenuErrorMessage } = await import('../src/features/menu/utils/menu.ts')
beforeEach(resetHttp)
test('menu list and detail preserve abort signals filters and requested serving quantity', async () => {
  const signal = new AbortController().signal
  await menuApi.list({ page: 0, size: 10, categoryId: 2 }, signal)
  await menuApi.detail(3, 4, signal)
  assert.deepEqual(calls[0].args[1], { params: { page: 0, size: 10, categoryId: 2 }, signal })
  assert.deepEqual(calls[1].args, ['/api/menu-items/3', { params: { quantity: 4 }, signal }])
})
test('menu create update status and delete operate on the selected dish', async () => {
  const input = { name: 'Phở', price: 65000, categoryId: 2 }
  await menuApi.create(input)
  await menuApi.update(3, input)
  await menuApi.updateStatus(3, 'DISCONTINUED')
  await menuApi.remove(3)
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['post', '/api/menu-items'], ['put', '/api/menu-items/3'], ['patch', '/api/menu-items/3/status'], ['delete', '/api/menu-items/3']])
  assert.deepEqual(calls[2].args[1], { status: 'DISCONTINUED' })
})
test('menu image upload retains file and order while allowing multipart boundary generation', async () => {
  const file = new File(['png'], 'dish.png', { type: 'image/png' })
  await menuApi.uploadImage(3, file, 2)
  await menuApi.deleteImage(3, 9)
  assert.equal(calls[0].args[1].get('file').name, 'dish.png')
  assert.deepEqual(calls[0].args[2], { params: { displayOrder: 2 }, headers: { 'Content-Type': undefined } })
  assert.deepEqual(calls[1], { method: 'delete', args: ['/api/menu-items/3/images/9'] })
})
test('category toggle preserves display order and changes only active state', async () => {
  await categoryApi.toggleCategoryStatus({ id: 2, name: 'Món chính', description: null, displayOrder: 5, isActive: true })
  assert.deepEqual(calls[0], { method: 'put', args: ['/api/categories/2', { name: 'Món chính', description: '', displayOrder: 5, isActive: false }] })
})
test('category picker sorts by display order and supports legacy CRUD methods', async () => {
  const input = { name: 'Món chính', description: '', displayOrder: 1, isActive: true }
  await categoryApi.list(0, 20)
  await categoryApi.getCategories({ page: 0, size: 10 })
  await categoryApi.getCategory(2)
  await categoryApi.createCategory(input)
  await categoryApi.updateCategory(2, input)
  await categoryApi.remove(2)
  assert.equal(calls[0].args[1].params.sort, 'displayOrder,asc')
  assert.equal(calls[1].args[0], '/api/categories?page=0&size=10')
  assert.deepEqual(calls.slice(2).map(c => [c.method, c.args[0]]), [['get', '/api/categories/2'], ['post', '/api/categories'], ['put', '/api/categories/2'], ['delete', '/api/categories/2']])
})
test('menu form trims dish name and validates decimal price and tax identifiers', () => {
  const input = { name: ' Phở ', categoryId: 2, description: '', price: '65000.50', isFeatured: false, isDirectSale: false }
  assert.equal(menuItemSchema.parse(input).name, 'Phở')
  assert.equal(menuItemSchema.safeParse({ ...input, price: '-1' }).success, false)
  assert.equal(menuItemSchema.safeParse({ ...input, price: '1.001' }).success, false)
  assert.equal(menuItemSchema.safeParse({ ...input, taxCategoryId: 0 }).success, false)
})
test('category form accepts integer boundaries and rejects fractional display order', () => {
  const input = { name: 'Danh mục', description: '', isActive: true }
  assert.equal(categorySchema.safeParse({ ...input, displayOrder: 2147483647 }).success, true)
  assert.equal(categorySchema.safeParse({ ...input, displayOrder: -2147483648 }).success, true)
  assert.equal(categorySchema.safeParse({ ...input, displayOrder: 2147483648 }).success, false)
  assert.equal(categorySchema.safeParse({ ...input, displayOrder: 1.5 }).success, false)
})
test('menu identifier parsing rejects zero unsafe integers signs and malformed routes', () => {
  assert.equal(positiveMenuId('003'), 3)
  for (const value of ['0', '-1', '1.5', '9007199254740992', 'abc', null]) assert.equal(positiveMenuId(value), null)
  assert.equal(isMenuStatus('AVAILABLE'), true)
  assert.equal(isMenuStatus('UNKNOWN'), false)
})
test('menu images sort by order then identifier without mutating the input', () => {
  const images = [{ id: 3, displayOrder: 1 }, { id: 2, displayOrder: 0 }, { id: 1, displayOrder: 0 }]
  const result = orderedMenuImages(images)
  assert.deepEqual(result.map(i => i.id), [1, 2, 3])
  assert.deepEqual(images.map(i => i.id), [3, 2, 1])
})
test('menu image validation enforces allowed MIME types and five-megabyte boundary', () => {
  assert.equal(menuImageFileError({ type: 'image/png', size: 5 * 1024 * 1024 }), null)
  assert.ok(menuImageFileError({ type: 'image/svg+xml', size: 100 }))
  assert.ok(menuImageFileError({ type: 'image/png', size: 0 }))
  assert.ok(menuImageFileError({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }))
})
test('menu distinguishes forbidden not-found conflict and network messages', () => {
  assert.match(getMenuErrorMessage({ isAxiosError: true, response: { status: 403 } }), /không có quyền/)
  assert.match(getMenuErrorMessage({ isAxiosError: true, response: { status: 404 } }), /không còn tồn tại/)
  assert.match(getMenuErrorMessage({ isAxiosError: true, response: { status: 409 } }), /đã thay đổi/)
  assert.match(getMenuErrorMessage(new Error('offline')), /kết nối/)
})
test('menu propagates catalog modification conflicts', async () => {
  const error = new Error('Catalog changed')
  rejectWith(error)
  await assert.rejects(menuApi.updateStatus(3, 'AVAILABLE'), actual => actual === error)
})
