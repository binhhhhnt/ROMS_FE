// This is the only HTTP client exposed by the unit-test loader. No network calls.
export const calls = []
let response, failure
export function resetHttp() { calls.length = 0; response = { data: { data: { id: 42 }, message: 'OK' } }; failure = null }
export function reply(data) { response = { data: { data, message: 'OK' } } }
export function replyRaw(data) { response = { data } }
export function rejectWith(error) { failure = error }
async function request(method, args) {
  calls.push({ method, args })
  if (failure) throw failure
  return response
}
export const apiClient = Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method => [method, (...args) => request(method, args)]))
export async function performTokenRefresh() { return (await request('refresh', [])).data.data }
export function getApiErrorMessage(error) { return error?.message || 'API error' }
resetHttp()
