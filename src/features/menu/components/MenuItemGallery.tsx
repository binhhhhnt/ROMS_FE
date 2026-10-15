import { useState } from 'react'
import type { MenuItemImage } from '../types/menu.types'
import { orderedMenuImages } from '../utils/menu'
import { MenuImage } from './MenuImage'

export function MenuItemGallery({ images, name }: { images: MenuItemImage[]; name: string }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const ordered = orderedMenuImages(images)
  const selected = ordered.find((image) => image.id === selectedId) ?? ordered[0]
  return (
    <div>
      <MenuImage src={selected?.imageUrl} name={name} className="aspect-[4/3] w-full rounded-2xl border border-border" />
      {ordered.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-2" aria-label="Ảnh món ăn">
        {ordered.map((image, index) => <button key={image.id} type="button" aria-label={`Xem ảnh ${index + 1} của ${name}`} aria-pressed={selected?.id === image.id}
          className={`shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-accent ${selected?.id === image.id ? 'border-accent' : 'border-transparent'}`} onClick={() => setSelectedId(image.id)}>
          <MenuImage src={image.imageUrl} name="" className="h-20 w-20" />
        </button>)}
      </div>}
    </div>
  )
}
