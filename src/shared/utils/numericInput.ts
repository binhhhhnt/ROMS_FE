import type React from 'react'

export type NumericInputMode = 'integer' | 'decimal'

const ALLOWED_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
])

/**
 * Removes invalid characters from a numeric string according to mode.
 * - `integer`: keeps digits `0-9` only.
 * - `decimal`: keeps digits `0-9` and at most one `.` character.
 */
export function sanitizeNumericString(
  raw: string,
  mode: NumericInputMode
): string {
  if (mode === 'integer') {
    return raw.replace(/\D+/g, '')
  }

  const cleaned = raw.replace(/[^0-9.]/g, '')
  const dotIndex = cleaned.indexOf('.')
  if (dotIndex === -1) return cleaned
  return (
    cleaned.slice(0, dotIndex + 1) +
    cleaned.slice(dotIndex + 1).replace(/\./g, '')
  )
}

/**
 * Infers numeric guard mode from `<input>` attributes when `type="number"`.
 */
export function inferNumericMode(
  type?: string,
  step?: string | number
): NumericInputMode | undefined {
  if (type !== 'number') return undefined
  if (step === 'any') return 'decimal'
  if (step !== undefined && String(step).includes('.')) return 'decimal'
  return 'integer'
}

function setNativeInputValue(input: HTMLInputElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set
  if (valueSetter) {
    valueSetter.call(input, value)
  } else {
    input.value = value
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * Blocks negative signs, scientific notation (`e`/`E`), `+`, and non-numeric keys.
 * Also blocks `.` and `,` in `integer` mode, and duplicate `.` in `decimal` mode.
 */
export function handleNumericKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  mode: NumericInputMode,
  userOnKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
): void {
  userOnKeyDown?.(e)
  if (e.defaultPrevented) return

  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (ALLOWED_CONTROL_KEYS.has(e.key)) return

  // Allow IME composition keys
  if (e.key === 'Process' || e.key === 'Dead') return

  if (mode === 'integer') {
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
    }
    return
  }

  if (e.key === '.') {
    if (e.currentTarget.type !== 'number' && e.currentTarget.value.includes('.')) {
      e.preventDefault()
    }
    return
  }

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault()
  }
}

/**
 * Sanitizes pasted text for numeric inputs and blocks fully non-numeric pastes.
 */
export function handleNumericPaste(
  e: React.ClipboardEvent<HTMLInputElement>,
  mode: NumericInputMode,
  userOnPaste?: React.ClipboardEventHandler<HTMLInputElement>
): void {
  userOnPaste?.(e)
  if (e.defaultPrevented) return

  const pasted = e.clipboardData.getData('text')
  const sanitized = sanitizeNumericString(pasted, mode)

  if (sanitized === pasted) return

  e.preventDefault()
  if (sanitized === '') return

  const input = e.currentTarget
  if (input.type === 'number') {
    const nextVal = sanitizeNumericString(sanitized, mode)
    setNativeInputValue(input, nextVal)
    return
  }

  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? input.value.length
  const merged =
    input.value.slice(0, start) + sanitized + input.value.slice(end)
  setNativeInputValue(input, sanitizeNumericString(merged, mode))
}
