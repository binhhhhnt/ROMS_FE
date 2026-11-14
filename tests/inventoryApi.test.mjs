import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, replyRaw } from './helpers/httpMock.mjs'
const { ingredientApi } = await import('../src/features/inventory/api/ingredientApi.ts')
const { inventoryCheckApi } = await import('../src/features/inventory/api/inventoryCheckApi.ts')
const { stockMovementApi } = await import('../src/features/inventory/api/stockMovementApi.ts')
const { ingredientSchema } = await import('../src/features/inventory/schemas/ingredientSchema.ts')
beforeEach(resetHttp)
test('inventory ingredient CRUD preserves inactive filter and batch import payload', async () => {
  const input = { name: 'Gạo', unit: 'kg', minimumStock: 5 }
  await ingredientApi.getIngredients({ isActive: false, page: 0, size: 10 })
  await ingredientApi.createIngredient(input)
  await ingredientApi.getIngredientById(7)
  await ingredientApi.updateIngredient(7, input)
  await ingredientApi.deactivateIngredient(7)
  await ingredientApi.importIngredients([input])
  assert.equal(calls[0].args[0], '/api/ingredients?isActive=false&page=0&size=10')
  assert.deepEqual(calls.slice(1).map(c => [c.method, c.args[0]]), [['post', '/api/ingredients'], ['get', '/api/ingredients/7'], ['put', '/api/ingredients/7'], ['patch', '/api/ingredients/7/deactivate'], ['post', '/api/ingredients/import']])
  assert.deepEqual(calls[5].args[1], { ingredients: [input] })
})
test('inventory check creates the measured quantities and retrieves sorted check history', async () => {
  const input = { items: [{ ingredientId: 7, actualQuantity: 5 }] }
  await inventoryCheckApi.createInventoryCheck(input)
  await inventoryCheckApi.getInventoryChecks(0, 10)
  await inventoryCheckApi.getInventoryCheckById(9)
  assert.deepEqual(calls[0], { method: 'post', args: ['/api/inventory-checks', input] })
  assert.equal(calls[1].args[0], '/api/inventory-checks?page=0&size=10&sort=checkedAt,desc')
  assert.equal(calls[2].args[0], '/api/inventory-checks/9')
})
test('stock movement audit list retains ingredient movement type and page zero filters', async () => {
  await stockMovementApi.getStockMovements({ ingredientId: 7, movementType: 'PURCHASE', page: 0, size: 10 })
  assert.equal(calls[0].args[0], '/api/stock-movements?ingredientId=7&movementType=PURCHASE&page=0&size=10')
})
test('inventory Excel endpoints preserve binary downloads and multipart file upload', async () => {
  const blob = new Blob(['xlsx'])
  replyRaw(blob)
  const template = await ingredientApi.downloadTemplate()
  const exported = await ingredientApi.exportExcel()
  await ingredientApi.importExcel(new File(['xlsx'], 'ingredients.xlsx'))
  assert.equal(template, blob)
  assert.equal(exported, blob)
  assert.equal(calls[2].args[0], '/api/ingredients/excel/import')
  assert.equal(calls[2].args[1].get('file').name, 'ingredients.xlsx')
})
test('ingredient form trims name and unit and rejects negative minimum stock', () => {
  const input = { name: ' Gạo ', unit: ' kg ', minimumStock: '5' }
  assert.deepEqual(ingredientSchema.parse(input), { name: 'Gạo', unit: 'kg', minimumStock: '5' })
  assert.equal(ingredientSchema.safeParse({ ...input, minimumStock: '-1' }).success, false)
  assert.equal(ingredientSchema.safeParse({ ...input, name: ' ' }).success, false)
})
