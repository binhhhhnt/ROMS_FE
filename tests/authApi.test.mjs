import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { authApi } = await import('../src/features/auth/api/authApi.ts')
beforeEach(resetHttp)
test('auth login returns the access token and refresh delegates to the refresh coordinator', async () => {
  reply({ accessToken: 'token', tokenType: 'Bearer' })
  const result = await authApi.login({ username: 'staff', password: 'Secret123' })
  const refreshed = await authApi.refresh()
  assert.equal(result.accessToken, 'token')
  assert.equal(refreshed.accessToken, 'token')
  assert.deepEqual(calls[0].args, ['/api/auth/login', { username: 'staff', password: 'Secret123' }])
  assert.equal(calls[1].method, 'refresh')
})
test('auth reads identity and profile then logs out through the authenticated client', async () => {
  await authApi.getMe()
  await authApi.getProfile()
  await authApi.logout()
  assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [['get', '/api/auth/me'], ['get', '/api/users/me/profile'], ['post', '/api/auth/logout']])
})
test('auth recovery returns server messages and preserves the six-digit OTP', async () => {
  const email = 'staff@roms.test'
  const forgot = await authApi.forgotPassword({ email })
  const verified = await authApi.verifyOtp({ email, otp: '012345' })
  await authApi.resetPassword({ email, otp: '012345', newPassword: 'New123' })
  assert.equal(forgot, 'OK')
  assert.equal(verified, 'OK')
  assert.deepEqual(calls[1].args, ['/api/auth/verify-otp', { email, otp: '012345' }])
  assert.deepEqual(calls[2].args[1], { email, otp: '012345', newPassword: 'New123' })
})
test('auth profile edits and password changes send only supplied fields', async () => {
  await authApi.updateProfile({ fullName: 'Anh', email: 'anh@roms.test' })
  await authApi.changePassword({ currentPassword: 'Old123', newPassword: 'New123' })
  assert.deepEqual(calls[0], { method: 'put', args: ['/api/users/me/profile', { fullName: 'Anh', email: 'anh@roms.test' }] })
  assert.deepEqual(calls[1].args, ['/api/users/me/change-password', { currentPassword: 'Old123', newPassword: 'New123' }])
})
test('auth invalid credentials propagate without inventing an authenticated identity', async () => {
  const error = Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
  rejectWith(error)
  await assert.rejects(authApi.login({ username: 'staff', password: 'wrong' }), actual => actual === error)
})
