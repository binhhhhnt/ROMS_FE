import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

type MessageCallback<T = unknown> = (data: T) => void

interface RegisteredDestination {
  subscription: StompSubscription | null
  callbacks: Set<MessageCallback<any>>
}

let qrClient: Client | null = null
let activeQrToken: string | null = null
const destinationsMap = new Map<string, RegisteredDestination>()

function resetQrClient() {
  destinationsMap.forEach((entry) => {
    try {
      entry.subscription?.unsubscribe()
    } catch {
      // ignore
    }
    entry.subscription = null
  })
  if (qrClient) {
    void qrClient.deactivate()
    qrClient = null
  }
  activeQrToken = null
}

function getOrCreateQrClient(qrToken: string): Client {
  if (qrClient && activeQrToken === qrToken) {
    return qrClient
  }

  if (qrClient && activeQrToken !== qrToken) {
    resetQrClient()
  }

  const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  activeQrToken = qrToken

  const client = new Client({
    webSocketFactory: () => new SockJS(`${baseURL}/ws`),
    connectHeaders: {
      qrToken,
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  })

  client.onConnect = () => {
    destinationsMap.forEach((entry, destination) => {
      if (entry.callbacks.size > 0 && !entry.subscription && client.connected) {
        entry.subscription = client.subscribe(destination, (message: IMessage) => {
          let parsed: unknown
          try {
            parsed = JSON.parse(message.body)
          } catch {
            parsed = message.body
          }
          entry.callbacks.forEach((cb) => {
            try {
              cb(parsed as any)
            } catch (err) {
              console.error(`[QR STOMP] Error in message handler for ${destination}:`, err)
            }
          })
        })
      }
    })
  }

  client.onWebSocketClose = () => {
    destinationsMap.forEach((entry) => {
      entry.subscription = null
    })
  }

  qrClient = client
  return client
}

export function subscribeQrTopic<T = unknown>(
  qrToken: string,
  destination: string,
  callback: (data: T) => void
): () => void {
  const client = getOrCreateQrClient(qrToken)

  let entry = destinationsMap.get(destination)
  if (!entry) {
    entry = {
      subscription: null,
      callbacks: new Set(),
    }
    destinationsMap.set(destination, entry)
  }

  entry.callbacks.add(onMessageWrapper(callback))

  if (client.connected && !entry.subscription) {
    entry.subscription = client.subscribe(destination, (message: IMessage) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(message.body)
      } catch {
        parsed = message.body
      }
      entry?.callbacks.forEach((cb) => {
        try {
          cb(parsed as any)
        } catch (err) {
          console.error(`[QR STOMP] Error in message handler for ${destination}:`, err)
        }
      })
    })
  }

  if (!client.active) {
    client.activate()
  }

  return () => {
    const currentEntry = destinationsMap.get(destination)
    if (currentEntry) {
      currentEntry.callbacks.delete(callback as MessageCallback<any>)
      if (currentEntry.callbacks.size === 0) {
        try {
          currentEntry.subscription?.unsubscribe()
        } catch {
          // ignore
        }
        destinationsMap.delete(destination)
      }
    }

    if (destinationsMap.size === 0 && qrClient) {
      void qrClient.deactivate()
      qrClient = null
      activeQrToken = null
    }
  }
}

function onMessageWrapper<T>(callback: (data: T) => void): MessageCallback<any> {
  return callback as MessageCallback<any>
}
