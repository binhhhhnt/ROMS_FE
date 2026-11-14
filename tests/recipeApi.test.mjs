import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { recipeApi } = await import('../src/features/recipes/api/recipeApi.ts')
beforeEach(resetHttp)
test('recipes read a dish recipe with server ingredient costs', async () => {
  reply({ menuItemId: 3, totalCost: 25000, items: [] })
  const result = await recipeApi.getRecipe(3)
  assert.equal(result.totalCost, 25000)
  assert.equal(calls[0].args[0], '/api/menu-items/3/recipe')
})
test('recipes replace the complete ingredient list and preserve fractional quantities', async () => {
  const input = { items: [{ ingredientId: 7, quantityRequired: 0.125 }] }
  await recipeApi.replaceRecipe(3, input)
  await recipeApi.addRecipeItem(3, input.items[0])
  assert.deepEqual(calls[0], { method: 'put', args: ['/api/menu-items/3/recipe', input] })
  assert.deepEqual(calls[1].args, ['/api/menu-items/3/recipe/items', input.items[0]])
})
test('recipes correct or delete a specific ingredient without replacing other items', async () => {
  await recipeApi.updateRecipeItem(3, 7, 0.25)
  await recipeApi.deleteRecipeItem(3, 7)
  assert.deepEqual(calls[0], { method: 'patch', args: ['/api/menu-items/3/recipe/items/7', { quantityRequired: 0.25 }] })
  assert.deepEqual(calls[1], { method: 'delete', args: ['/api/menu-items/3/recipe/items/7'] })
})
test('recipes menu picker retains page zero and category filtering', async () => {
  await recipeApi.getMenuItems({ categoryId: 2, page: 0, size: 10 })
  await recipeApi.getCategories()
  assert.equal(calls[0].args[0], '/api/menu-items?categoryId=2&page=0&size=10')
  assert.equal(calls[1].args[0], '/api/categories?size=100')
})
test('recipes propagate inactive ingredient conflict', async () => {
  const error = new Error('Inactive ingredient')
  rejectWith(error)
  await assert.rejects(recipeApi.addRecipeItem(3, { ingredientId: 7, quantityRequired: 1 }), actual => actual === error)
})
