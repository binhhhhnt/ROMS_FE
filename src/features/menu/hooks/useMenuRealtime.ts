import { useEffect } from 'react'
import { subscribeToTopic } from '@/shared/lib/stomp'
import { useRefreshMenu } from './useMenu'

/**
 * Hook to listen to STOMP /topic/menu destination and automatically invalidate
 * menu queries in real time without manual page reload.
 */
export function useMenuRealtime(enabled = true) {
  const refresh = useRefreshMenu()

  useEffect(() => {
    if (!enabled) return

    const unsubscribe = subscribeToTopic('/topic/menu', () => {
      refresh()
    })

    return () => {
      unsubscribe()
    }
  }, [enabled, refresh])
}
