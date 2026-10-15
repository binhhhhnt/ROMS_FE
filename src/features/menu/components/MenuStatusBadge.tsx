import { Badge } from '@/shared/components/ui/badge'
import { menuStatusLabels } from '../utils/menu'
import type { MenuStatus } from '../types/menu.types'

export function MenuStatusBadge({ status }: { status: MenuStatus }) {
  return <Badge variant={status === 'AVAILABLE' ? 'secondary' : status === 'TEMPORARILY_UNAVAILABLE' ? 'pending' : 'outline'}>{menuStatusLabels[status]}</Badge>
}
