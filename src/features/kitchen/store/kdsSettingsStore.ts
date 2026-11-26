import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_KDS_OVERDUE_MINUTES = 15

export type KdsBellMode = 'single' | 'until_ok' | 'off'

interface KdsSettingsState {
  overdueMinutes: number
  bellMode: KdsBellMode
  setOverdueMinutes: (minutes: number) => void
  setBellMode: (mode: KdsBellMode) => void
}

export const useKdsSettingsStore = create<KdsSettingsState>()(
  persist(
    (set) => ({
      overdueMinutes: DEFAULT_KDS_OVERDUE_MINUTES,
      bellMode: 'single',
      setOverdueMinutes: (minutes: number) => {
        const clamped = Number.isFinite(minutes)
          ? Math.max(1, Math.min(180, Math.round(minutes)))
          : DEFAULT_KDS_OVERDUE_MINUTES
        set({ overdueMinutes: clamped })
      },
      setBellMode: (bellMode: KdsBellMode) => set({ bellMode }),
    }),
    {
      name: 'roms-kds-settings',
    }
  )
)
