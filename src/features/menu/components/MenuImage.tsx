import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'

export function MenuImage({
  src,
  name,
  className = '',
  fit = 'cover',
}: {
  src?: string
  name: string
  className?: string
  fit?: 'cover' | 'contain'
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-surface/50 ${className}`}>
      {src && failedSrc !== src ? (
        <img src={src} alt={name} loading="lazy" decoding="async" className={`h-full w-full ${fitClass}`} onError={() => setFailedSrc(src)} />
      ) : <UtensilsCrossed aria-label="Chưa có ảnh món ăn" className="h-8 w-8 text-accent/60" />}
    </div>
  )
}
