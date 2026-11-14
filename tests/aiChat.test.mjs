import './helpers/register.mjs'
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { calls, resetHttp, reply, rejectWith } from './helpers/httpMock.mjs'
const { useAiChatStore, getSessionKey, createInitialChatData } = await import('../src/features/tables/store/aiChatStore.ts')
const { aiApi } = await import('../src/features/tables/api/aiApi.ts')
beforeEach(() => { resetHttp(); useAiChatStore.getState().clearAll() })
test('AI session keys isolate table sessions idle tables staff and anonymous users', () => {
  assert.equal(getSessionKey(1, 9), 'table_1_session_9')
  assert.equal(getSessionKey(1, null), 'table_1_idle')
  assert.equal(getSessionKey(null, null, 'staff'), 'user_staff')
  assert.equal(getSessionKey(), 'default')
})
test('AI initial state uses separate messages and defaults for each new chat', () => {
  const first = createInitialChatData()
  const second = createInitialChatData()
  first.messages.push({ id: 'extra' })
  assert.equal(second.messages.length, 1)
  assert.equal(second.partySize, 4)
})
test('AI chat messages and dietary criteria remain isolated between tables', () => {
  useAiChatStore.getState().addMessage('table_1_session_9', { id: 'm1', sender: 'user', text: 'Không đậu phộng' })
  useAiChatStore.getState().updateCriteria('table_1_session_9', { allergies: 'đậu phộng', partySize: 2 })
  assert.equal(useAiChatStore.getState().getChatData('table_1_session_9').allergies, 'đậu phộng')
  assert.equal(useAiChatStore.getState().getChatData('table_2_session_10').allergies, '')
  assert.equal(useAiChatStore.getState().getChatData('table_2_session_10').messages.length, 1)
})
test('AI cleanup removes older sessions only for the selected table', () => {
  for (const key of ['table_1_idle', 'table_1_session_8', 'table_1_session_9', 'table_2_session_10']) useAiChatStore.getState().updateCriteria(key, { partySize: 2 })
  useAiChatStore.getState().cleanupOldTableSessions(1, 9)
  assert.deepEqual(Object.keys(useAiChatStore.getState().sessions).sort(), ['table_1_session_9', 'table_2_session_10'])
})
test('AI reset replaces conversation history while preserving current dietary criteria', () => {
  useAiChatStore.getState().updateCriteria('table_1_session_9', { allergies: 'sữa' })
  useAiChatStore.getState().addMessage('table_1_session_9', { id: 'm1', text: 'Test' })
  useAiChatStore.getState().resetChat('table_1_session_9')
  const result = useAiChatStore.getState().getChatData('table_1_session_9')
  assert.equal(result.messages.length, 1)
  assert.equal(result.messages[0].sender, 'bot')
  assert.equal(result.allergies, 'sữa')
})
test('AI recommendations preserve allergies budget and party size and unwrap the answer', async () => {
  const input = { allergies: 'đậu phộng', budgetRange: '200000', partySize: 2, message: 'Gợi ý bữa tối' }
  reply({ message: 'Gợi ý', recommendations: [] })
  const answer = await aiApi.getRecommendations(input)
  assert.deepEqual(calls[0].args, ['/api/ai/recommendations', input])
  assert.deepEqual(answer, { message: 'Gợi ý', recommendations: [] })
})
test('AI provider errors propagate instead of being presented as recommendations', async () => {
  const error = new Error('AI unavailable')
  rejectWith(error)
  await assert.rejects(aiApi.getRecommendations({ message: 'Gợi ý' }), actual => actual === error)
})
