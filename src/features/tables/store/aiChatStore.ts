import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AiRecommendationItem } from '@/features/tables/api/aiApi'

export interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: string | Date
  recommendations?: AiRecommendationItem[]
}

export interface SessionChatData {
  messages: ChatMessage[]
  partySize: number | ''
  allergies: string
  budgetRange: string
}

export const createInitialChatData = (): SessionChatData => ({
  messages: [
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: 'Xin chào quý khách! Tôi là Trợ lý Ẩm thực AI thông minh của nhà hàng ROMS. Hãy trò chuyện với tôi về khẩu vị, sở thích món ăn, số lượng người hoặc bất kỳ yêu cầu nào (dị ứng, ngân sách...), tôi sẽ gợi ý thực đơn chuẩn xác và đang sẵn sàng phục vụ quý khách!',
      timestamp: new Date().toISOString(),
    },
  ],
  partySize: 4,
  allergies: '',
  budgetRange: '',
})

/**
 * Tạo khóa định danh riêng biệt cho từng bàn và từng phiên phục vụ.
 * - Ví dụ: table_1_session_101, table_2_session_102...
 * - Khi sang phiên phục vụ mới (activeSessionId thay đổi), khóa sẽ đổi và cuộc trò chuyện tự động được làm mới.
 */
export const getSessionKey = (
  tableId?: number | null,
  sessionId?: number | null,
  username?: string
): string => {
  if (tableId) {
    if (sessionId) {
      return `table_${tableId}_session_${sessionId}`
    }
    return `table_${tableId}_idle`
  }
  if (username) {
    return `user_${username}`
  }
  return 'default'
}

interface AiChatStoreState {
  sessions: Record<string, SessionChatData>
  getChatData: (sessionKey: string) => SessionChatData
  addMessage: (sessionKey: string, message: ChatMessage) => void
  updateCriteria: (
    sessionKey: string,
    criteria: Partial<Omit<SessionChatData, 'messages'>>
  ) => void
  resetChat: (sessionKey: string) => void
  cleanupOldTableSessions: (tableId: number, currentSessionId?: number | null) => void
  clearAll: () => void
}

export const useAiChatStore = create<AiChatStoreState>()(
  persist(
    (set, get) => ({
      sessions: {},

      getChatData: (sessionKey: string) => {
        const existing = get().sessions[sessionKey]
        if (existing && existing.messages && existing.messages.length > 0) {
          return existing
        }
        return createInitialChatData()
      },

      addMessage: (sessionKey: string, message: ChatMessage) => {
        set((state) => {
          const current = state.sessions[sessionKey] || createInitialChatData()
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...current,
                messages: [...current.messages, message],
              },
            },
          }
        })
      },

      updateCriteria: (sessionKey: string, criteria) => {
        set((state) => {
          const current = state.sessions[sessionKey] || createInitialChatData()
          return {
            sessions: {
              ...state.sessions,
              [sessionKey]: {
                ...current,
                ...criteria,
              },
            },
          }
        })
      },

      resetChat: (sessionKey: string) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionKey]: {
              ...(state.sessions[sessionKey] || createInitialChatData()),
              messages: [
                {
                  id: `welcome-${Date.now()}`,
                  sender: 'bot',
                  text: 'Cuộc trò chuyện mới đã bắt đầu! Quý khách muốn tìm kiếm món ăn nào hôm nay?',
                  timestamp: new Date().toISOString(),
                },
              ],
            },
          },
        }))
      },

      cleanupOldTableSessions: (tableId: number, currentSessionId?: number | null) => {
        set((state) => {
          const prefix = `table_${tableId}_`
          const currentKey = currentSessionId
            ? `table_${tableId}_session_${currentSessionId}`
            : `table_${tableId}_idle`
          const newSessions = { ...state.sessions }
          let hasChanges = false
          for (const key of Object.keys(newSessions)) {
            if (key.startsWith(prefix) && key !== currentKey) {
              delete newSessions[key]
              hasChanges = true
            }
          }
          return hasChanges ? { sessions: newSessions } : state
        })
      },

      clearAll: () => set({ sessions: {} }),
    }),
    {
      name: 'roms_ai_chat_sessions_v2',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

if (import.meta.env.DEV) {
  // @ts-expect-error dev helper
  window.__aiChatStore = useAiChatStore
}
