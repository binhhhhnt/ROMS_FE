import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export function subscribeQrTopic<T = unknown>(
  qrToken: string,
  destination: string,
  callback: (data: T) => void
): () => void {
  const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  let subscription: StompSubscription | null = null

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
    subscription = client.subscribe(destination, (message: IMessage) => {
      try {
        callback(JSON.parse(message.body) as T)
      } catch {
        callback(message.body as T)
      }
    })
  }

  client.activate()

  return () => {
    try {
      subscription?.unsubscribe()
    } catch {
      // ignore
    }
    void client.deactivate()
  }
}
