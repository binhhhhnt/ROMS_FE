import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'

export function MenuImage({ src, name, className = '' }: { src?: string; name: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-surface/50 ${className}`}>
      {src && failedSrc !== src ? (
        <img src={src} alt={name} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : <UtensilsCrossed aria-label="Chưa có ảnh món ăn" className="h-8 w-8 text-accent/60" />}
    </div>
  )
}
