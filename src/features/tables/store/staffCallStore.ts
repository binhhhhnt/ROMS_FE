import { create } from 'zustand'

export interface StaffCallRequest {
  requestId: string
  tableId: number
  tableCode: string
  requestedAt: string
}

interface StaffCallStore {
  pendingCalls: StaffCallRequest[]
  addCall: (call: StaffCallRequest) => void
  removeCall: (requestId: string) => void
  clearAll: () => void
}

export const useStaffCallStore = create<StaffCallStore>((set) => ({
  pendingCalls: [],
  addCall: (call) =>
    set((state) => {
      // Tránh trùng lặp requestId nếu STOMP nhận lại
      if (state.pendingCalls.some((c) => c.requestId === call.requestId)) {
        return state
      }
      return {
        pendingCalls: [call, ...state.pendingCalls],
      }
    }),
  removeCall: (requestId) =>
    set((state) => ({
      pendingCalls: state.pendingCalls.filter((c) => c.requestId !== requestId),
    })),
  clearAll: () => set({ pendingCalls: [] }),
}))

