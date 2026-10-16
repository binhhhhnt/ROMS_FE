import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { menuApi } from '../api/menuApi'
import { getMenuErrorMessage, menuImageFileError, orderedMenuImages } from '../utils/menu'
import type { MenuItemImage } from '../types/menu.types'
import { MenuImage } from './MenuImage'
import { MenuConfirmationDialog } from './MenuConfirmationDialog'

function SelectedImagePreview({ file }: { file: File }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <img ref={ref} alt={`Ảnh được chọn: ${file.name}`} className="h-32 w-32 rounded-lg object-cover" />
}

export function MenuImageManager({ menuItemId, images, onChanged }: {
  menuItemId: number; images: MenuItemImage[]; onChanged: () => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const saving = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [order, setOrder] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<MenuItemImage | null>(null)

  const upload = async () => {
    if (!file || saving.current) return
    const fileError = menuImageFileError(file)
    const displayOrder = Number(order)
    if (fileError || !/^-?\d+$/.test(order) || !Number.isInteger(displayOrder) || displayOrder < -2147483648 || displayOrder > 2147483647) {
      setError(fileError ?? 'Thứ tự ảnh phải là số nguyên trong phạm vi cho phép.')
      return
    }
    saving.current = true
    setBusy(true)
    setError(null)
    try {
      await menuApi.uploadImage(menuItemId, file, displayOrder)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await onChanged()
      toast.success('Đã tải ảnh món ăn.')
    } catch (failure) {
      setError(getMenuErrorMessage(failure))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="menu-images-title">
      <h2 id="menu-images-title" className="text-lg font-bold text-primary">Ảnh món ăn</h2>
      <p className="mt-2 text-sm text-muted">Ảnh được hiển thị theo thứ tự tăng dần. Chấp nhận JPEG, PNG, WebP; tối đa 5 MB mỗi ảnh.</p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {orderedMenuImages(images).map((image) => (
          <div key={image.id} className="overflow-hidden rounded-lg border border-border">
            <MenuImage src={image.imageUrl} name="Ảnh món ăn đã tải lên" className="aspect-square" />
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="text-xs text-muted">Thứ tự: {image.displayOrder}</span>
              <Button size="icon" variant="ghost" aria-label={`Xóa ảnh có thứ tự ${image.displayOrder}`} disabled={busy} onClick={() => setDeleting(image)}><Trash2 className="h-4 w-4 text-status-cancelled" /></Button>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && <p className="mt-5 rounded-lg bg-background p-4 text-sm text-muted">Món chưa có ảnh.</p>}
      <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-border pt-5">
        <div className="min-w-0 flex-1">
          <label htmlFor="menu-image-file" className="mb-2 block text-sm font-semibold">Chọn ảnh</label>
          <input ref={inputRef} id="menu-image-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-primary"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null
              const invalid = selected ? menuImageFileError(selected) : null
              setError(invalid)
              setFile(invalid ? null : selected)
            }} />
        </div>
        <div className="w-36"><label htmlFor="menu-image-order" className="mb-2 block text-sm font-semibold">Thứ tự ảnh</label><Input id="menu-image-order" type="number" step="1" value={order} onChange={(event) => setOrder(event.target.value)} disabled={busy} /></div>
        <Button onClick={() => void upload()} disabled={!file} isLoading={busy}><ImagePlus className="h-4 w-4" />Tải ảnh</Button>
      </div>
      {file && <div className="mt-4 flex items-center gap-3"><SelectedImagePreview file={file} /><p className="break-all text-sm text-muted">{file.name}</p></div>}
      {error && <p role="alert" className="mt-4 text-sm text-status-cancelled">{error} Thông tin món đã lưu vẫn được giữ nguyên.</p>}
      {deleting && <MenuConfirmationDialog title="Xóa ảnh món ăn?" description="Ảnh sẽ được gỡ khỏi món ăn sau khi máy chủ xác nhận." confirmLabel="Xóa ảnh" destructive
        onClose={() => setDeleting(null)} onConfirm={async () => {
          await menuApi.deleteImage(menuItemId, deleting.id)
          await onChanged()
          toast.success('Đã xóa ảnh món ăn.')
        }} />}
    </section>
  )
}
