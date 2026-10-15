import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/app/store/authStore'

let stompClient: Client | null = null

type MessageCallback<T = unknown> = (data: T) => void

interface RegisteredDestination {
  subscription: StompSubscription | null
  callbacks: Set<MessageCallback<any>>
}

const destinationsMap = new Map<string, RegisteredDestination>()

function isDestinationPermitted(destination: string): boolean {
  const role = useAuthStore.getState().user?.role
  if (!role) return true // If unauthenticated / test mode, allow attempt
  if (role === 'OWNER') return true
  if (destination.startsWith('/topic/kitchen')) return role === 'KITCHEN_STAFF'
  if (destination.startsWith('/topic/tables')) return role === 'SERVICE_STAFF'
  if (/^\/topic\/session\/\d+\/orders$/.test(destination)) {
    return role === 'SERVICE_STAFF' || role === 'TABLE_ACCOUNT'
  }
  if (destination.startsWith('/user/') || destination.startsWith('/queue/notifications')) return true
  return false
}

export function getStompClient(): Client {
  if (stompClient) {
    return stompClient
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL || ''

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${baseURL}/ws`),
    beforeConnect: () => {
      const token = useAuthStore.getState().accessToken
      if (stompClient) {
        stompClient.connectHeaders = {
          Authorization: token ? `Bearer ${token}` : '',
        }
      }
    },
    reconnectDelay: 2000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => {
      if (import.meta.env.DEV) {
        console.debug('[STOMP]', str)
      }
    },
  })

  stompClient.onConnect = (frame) => {
    if (import.meta.env.DEV) {
      console.info('[STOMP] Connected successfully', frame)
    }

    // Subscribe to all registered destinations without overwriting
    destinationsMap.forEach((entry, destination) => {
      if (!isDestinationPermitted(destination)) {
        if (import.meta.env.DEV) {
          console.warn(`[STOMP] Skipping unauthorized destination ${destination} for role ${useAuthStore.getState().user?.role}`)
        }
        return
      }

      if (!entry.subscription && stompClient && stompClient.connected) {
        entry.subscription = stompClient.subscribe(destination, (message: IMessage) => {
          let parsed: unknown
          try {
            parsed = JSON.parse(message.body)
          } catch {
            parsed = message.body
          }
          entry.callbacks.forEach((cb) => {
            try {
              cb(parsed)
            } catch (err) {
              console.error(`[STOMP] Error in message handler for ${destination}:`, err)
            }
          })
        })
      }
    })
  }

  stompClient.onStompError = (frame) => {
    console.error('[STOMP] Broker error:', frame.headers['message'], frame.body)
  }

  stompClient.onWebSocketClose = () => {
    // Clear subscriptions on disconnect so they re-subscribe cleanly on next connect
    destinationsMap.forEach((entry) => {
      entry.subscription = null
    })
  }

  return stompClient
}

export function subscribeToTopic<T = unknown>(
  destination: string,
  onMessage: MessageCallback<T>
): () => void {
  const client = getStompClient()

  let entry = destinationsMap.get(destination)
  if (!entry) {
    entry = {
      subscription: null,
      callbacks: new Set(),
    }
    destinationsMap.set(destination, entry)
  }

  entry.callbacks.add(onMessage as MessageCallback<any>)

  // If already connected and not yet subscribed to this destination, subscribe immediately
  if (client.connected && !entry.subscription) {
    if (!isDestinationPermitted(destination)) {
      if (import.meta.env.DEV) {
        console.warn(`[STOMP] Skipping unauthorized destination ${destination} for role ${useAuthStore.getState().user?.role}`)
      }
    } else {
      entry.subscription = client.subscribe(destination, (message: IMessage) => {
        let parsed: unknown
        try {
          parsed = JSON.parse(message.body)
        } catch {
          parsed = message.body
        }
        entry.callbacks.forEach((cb) => {
          try {
            cb(parsed)
          } catch (err) {
            console.error(`[STOMP] Error in message handler for ${destination}:`, err)
          }
        })
      })
    }
  }

  if (!client.active) {
    client.activate()
  }

  return () => {
    const currentEntry = destinationsMap.get(destination)
    if (currentEntry) {
      currentEntry.callbacks.delete(onMessage as MessageCallback<any>)
      if (currentEntry.callbacks.size === 0) {
        if (currentEntry.subscription) {
          try {
            currentEntry.subscription.unsubscribe()
          } catch (e) {
            console.warn('[STOMP] Unsubscribe error:', e)
          }
        }
        destinationsMap.delete(destination)
      }
    }
  }
}

export function disconnectStomp(): void {
  if (stompClient) {
    destinationsMap.forEach((entry) => {
      if (entry.subscription) {
        try { entry.subscription.unsubscribe() } catch (e) {}
      }
    })
    destinationsMap.clear()
    stompClient.deactivate()
    stompClient = null
  }
}
