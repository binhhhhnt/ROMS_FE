import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loginSchema } from '../src/features/auth/schemas/loginSchema.ts'
import { forgotPasswordSchema } from '../src/features/auth/schemas/forgotPasswordSchema.ts'
import { resetPasswordSchema } from '../src/features/auth/schemas/resetPasswordSchema.ts'
import { changePasswordSchema } from '../src/features/auth/schemas/changePasswordSchema.ts'
import { updateProfileSchema } from '../src/features/auth/schemas/updateProfileSchema.ts'

test('login accepts a username and a password at the six-character boundary', () => {
  const input = { username: 'staff01', password: '123456' }
  assert.deepEqual(loginSchema.parse(input), input)
})

test('login rejects empty username and passwords shorter than six characters', () => {
  assert.equal(loginSchema.safeParse({ username: '', password: '123456' }).success, false)
  assert.equal(loginSchema.safeParse({ username: 'staff01', password: '12345' }).success, false)
})

test('forgot password accepts a valid email and rejects malformed or empty email', () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: 'staff@roms.test' }).success, true)
  assert.equal(forgotPasswordSchema.safeParse({ email: 'invalid-email' }).success, false)
  assert.equal(forgotPasswordSchema.safeParse({ email: '' }).success, false)
})

test('reset password accepts a six-digit OTP with leading zero', () => {
  const input = { email: 'staff@roms.test', otp: '012345', newPassword: 'New123', confirmPassword: 'New123' }
  assert.deepEqual(resetPasswordSchema.parse(input), input)
})

test('reset password rejects OTP values with wrong length or non-digit characters', () => {
  const input = { email: 'staff@roms.test', newPassword: 'New123', confirmPassword: 'New123' }
  for (const otp of ['12345', '1234567', '12a456', ' 123456']) {
    assert.equal(resetPasswordSchema.safeParse({ ...input, otp }).success, false, otp)
  }
})

test('reset password reports mismatched confirmation on confirmPassword field', () => {
  const result = resetPasswordSchema.safeParse({ email: 'staff@roms.test', otp: '123456', newPassword: 'New123', confirmPassword: 'Other1' })
  assert.equal(result.success, false)
  assert.ok(result.error.issues.some(issue => issue.path.join('.') === 'confirmPassword'))
})

test('reset password accepts one hundred characters and rejects one hundred and one', () => {
  const input = { email: 'staff@roms.test', otp: '123456' }
  assert.equal(resetPasswordSchema.safeParse({ ...input, newPassword: 'a'.repeat(100), confirmPassword: 'a'.repeat(100) }).success, true)
  assert.equal(resetPasswordSchema.safeParse({ ...input, newPassword: 'a'.repeat(101), confirmPassword: 'a'.repeat(101) }).success, false)
})

test('change password accepts different current and new passwords', () => {
  const input = { currentPassword: 'Old123', newPassword: 'New123', confirmPassword: 'New123' }
  assert.deepEqual(changePasswordSchema.parse(input), input)
})

test('change password rejects reuse of the current password', () => {
  const result = changePasswordSchema.safeParse({ currentPassword: 'Same123', newPassword: 'Same123', confirmPassword: 'Same123' })
  assert.equal(result.success, false)
  assert.ok(result.error.issues.some(issue => issue.path.join('.') === 'newPassword'))
})

test('change password rejects missing current password and mismatched confirmation', () => {
  assert.equal(changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'New123', confirmPassword: 'New123' }).success, false)
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'Old123', newPassword: 'New123', confirmPassword: 'Other1' }).success, false)
})

test('profile accepts Vietnamese full name and valid email', () => {
  const input = { fullName: 'Nguyễn Ngọc Anh', email: 'anh@roms.test' }
  assert.deepEqual(updateProfileSchema.parse(input), input)
})

test('profile rejects empty full name and malformed email', () => {
  assert.equal(updateProfileSchema.safeParse({ fullName: '', email: 'anh@roms.test' }).success, false)
  assert.equal(updateProfileSchema.safeParse({ fullName: 'Anh', email: 'invalid' }).success, false)
})

test('profile accepts a name of 255 characters and rejects 256', () => {
  assert.equal(updateProfileSchema.safeParse({ fullName: 'a'.repeat(255), email: 'anh@roms.test' }).success, true)
  assert.equal(updateProfileSchema.safeParse({ fullName: 'a'.repeat(256), email: 'anh@roms.test' }).success, false)
})
