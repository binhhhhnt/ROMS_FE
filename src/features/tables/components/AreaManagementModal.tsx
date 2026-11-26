import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Pencil, Check, Power, MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { tableApi } from '@/features/tables/api/tableApi'
import type { AreaItem } from '@/features/tables/types/table.types'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'

interface AreaManagementModalProps {
  isOpen: boolean
  onClose: () => void
  areas: AreaItem[]
}

export function AreaManagementModal({ isOpen, onClose, areas }: AreaManagementModalProps) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const invalidateAreaData = () => {
    queryClient.invalidateQueries({ queryKey: ['tableAreas'] })
    queryClient.invalidateQueries({ queryKey: ['tablesOverview'] })
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => tableApi.createArea(name),
    onSuccess: (created) => {
      toast.success(`Đã thêm khu vực "${created.name}"`)
      setNewName('')
      invalidateAreaData()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => tableApi.updateArea(id, name),
    onSuccess: (updated) => {
      toast.success(`Đã đổi tên khu vực thành "${updated.name}"`)
      setEditingId(null)
      setEditingName('')
      invalidateAreaData()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      tableApi.updateAreaStatus(id, isActive),
    onSuccess: (updated) => {
      toast.success(
        updated.isActive
          ? `Đã kích hoạt lại khu vực "${updated.name}"`
          : `Đã tạm ẩn khu vực "${updated.name}"`
      )
      invalidateAreaData()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  if (!isOpen) return null

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập tên khu vực')
      return
    }
    createMutation.mutate(trimmed)
  }

  const handleSaveEdit = (id: number) => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      toast.error('Tên khu vực không được để trống')
      return
    }
    updateMutation.mutate({ id, name: trimmed })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Quản lý khu vực (Area)</h2>
              <span className="text-[11px] text-muted">
                Thêm, đổi tên hoặc tạm ẩn khu vực không còn bàn hoạt động
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create new area */}
        <form onSubmit={handleCreate} className="p-4 border-b border-border bg-surface/20 flex gap-2">
          <Input
            placeholder="Nhập tên khu vực mới (ví dụ: Tầng 2, Sân vườn)..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={100}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={createMutation.isPending}
            className="h-10 px-3.5 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </Button>
        </form>

        {/* Area list */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-border">
          {areas.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">Chưa có khu vực nào.</p>
          ) : (
            areas.map((area) => {
              const isEditing = editingId === area.id
              return (
                <div key={area.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          maxLength={100}
                          className="h-8 text-xs"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="h-8 px-2.5"
                          isLoading={updateMutation.isPending}
                          onClick={() => handleSaveEdit(area.id)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setEditingId(null)
                            setEditingName('')
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text truncate">{area.name}</span>
                        <Badge variant={area.isActive ? 'ready' : 'outline'} className="text-[10px]">
                          {area.isActive ? 'Hoạt động' : 'Đã ẩn'}
                        </Badge>
                        <span className="text-[11px] text-muted">
                          ({area.activeTableCount} bàn đang mở)
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => {
                          setEditingId(area.id)
                          setEditingName(area.name)
                        }}
                        title="Đổi tên khu vực"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant={area.isActive ? 'outline' : 'primary'}
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        isLoading={toggleStatusMutation.isPending}
                        onClick={() =>
                          toggleStatusMutation.mutate({ id: area.id, isActive: !area.isActive })
                        }
                        title={area.isActive ? 'Tạm ẩn khu vực' : 'Kích hoạt lại khu vực'}
                      >
                        <Power className="w-3.5 h-3.5 mr-1" />
                        {area.isActive ? 'Ẩn' : 'Bật'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-surface/20 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
