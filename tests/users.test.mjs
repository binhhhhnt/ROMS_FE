import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { userApi } = await import('../src/features/users/api/userApi.ts')
const { staffUserModalSchema, tableAccountModalSchema, changeTablePasswordSchema } = await import('../src/features/users/schemas/userSchema.ts')
beforeEach(resetHttp)
test('users preserve inactive filter and trim search while listing staff', async () => {
  await userApi.getUsers({ role: 'KITCHEN_STAFF', isActive: false, search: '  bếp  ', page: 0 })
  assert.deepEqual(calls[0].args, ['/api/users', { params: { role: 'KITCHEN_STAFF', isActive: false, search: 'bếp', page: 0, size: 10 } }])
})
test('users create update read and disable using the selected account identifier', async () => {
  const input = { username: 'staff01', fullName: 'Nhân viên', role: 'SERVICE_STAFF' }
  await userApi.createUser(input)
  await userApi.updateUser(7, input)
  await userApi.getUserById(7)
  await userApi.updateUserStatus(7, false)
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['post', '/api/users'], ['put', '/api/users/7'], ['get', '/api/users/7'], ['patch', '/api/users/7/status']])
  assert.deepEqual(calls[3].args[1], { isActive: false })
})
test('users table picker returns only content from active-table query', async () => {
  reply({ content: [{ id: 3, tableCode: 'T03' }], totalElements: 1 })
  const result = await userApi.getTables()
  assert.deepEqual(result, [{ id: 3, tableCode: 'T03' }])
  assert.deepEqual(calls[0].args[1], { params: { size: 100, isActive: true } })
})
test('users staff form rejects table role and invalid email', () => {
  const input = { fullName: 'Nhân viên', email: 'staff@roms.test', role: 'OWNER' }
  assert.equal(staffUserModalSchema.safeParse(input).success, true)
  assert.equal(staffUserModalSchema.safeParse({ ...input, role: 'TABLE_ACCOUNT' }).success, false)
  assert.equal(staffUserModalSchema.safeParse({ ...input, email: 'invalid' }).success, false)
})
test('users tablet form requires an assigned table and matching password confirmation', () => {
  assert.equal(tableAccountModalSchema.safeParse({ fullName: 'Bàn 1', tableId: 1 }).success, true)
  assert.equal(tableAccountModalSchema.safeParse({ fullName: 'Bàn 1', tableId: 0 }).success, false)
  assert.equal(changeTablePasswordSchema.safeParse({ password: '123456', confirmPassword: '654321' }).success, false)
  assert.equal(changeTablePasswordSchema.safeParse({ password: '123456', confirmPassword: '123456' }).success, true)
})
test('users duplicate username conflict is propagated', async () => {
  const error = new Error('Duplicate username')
  rejectWith(error)
  await assert.rejects(userApi.createUser({ username: 'duplicate' }), actual => actual === error)
})
