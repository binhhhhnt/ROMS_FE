import { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { menuApi } from '../api/menuApi'
import type { ExcelImportResult } from '../types/menu.types'
import { getApiErrorMessage } from '@/shared/lib/axios'

interface MenuExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MenuExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
}: MenuExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setErrorMessage(null)
    onClose()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx')) {
      setErrorMessage('Chỉ hỗ trợ file Excel định dạng .xlsx')
      setSelectedFile(null)
      return
    }

    setErrorMessage(null)
    setSelectedFile(file)
    setImportResult(null)
  }

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      const blob = await menuApi.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'menu_items_template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Đã tải file mẫu Excel thực đơn!')
    } catch (err) {
      toast.error('Lỗi khi tải file mẫu: ' + getApiErrorMessage(err))
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn file Excel để nhập')
      return
    }

    try {
      setIsUploading(true)
      setErrorMessage(null)
      const result = await menuApi.importExcel(selectedFile)
      setImportResult(result)
      onSuccess()

      if (result.errorCount === 0) {
        toast.success(
          `Nhập thành công ${result.insertedCount + result.updatedCount} món ăn!`
        )
      } else {
        toast.warning(
          `Nhập hoàn tất với ${result.insertedCount + result.updatedCount} món thành công, ${result.errorCount} lỗi.`
        )
      }
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setErrorMessage(msg)
      toast.error('Lỗi khi tải file lên: ' + msg)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-excel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-surface/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="import-excel-title"
                className="text-lg font-bold text-text"
              >
                Nhập thực đơn từ Excel
              </h2>
              <p className="text-xs text-muted">
                Hỗ trợ định dạng .xlsx chuẩn. Trùng tên món sẽ cập nhật thông tin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Download Template Banner */}
          <div className="flex items-center justify-between rounded-xl bg-accent/5 border border-accent/20 p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-xs font-semibold text-text">
                  Chưa có biểu mẫu chuẩn?
                </p>
                <p className="text-[11px] text-muted">
                  Tải file mẫu để điền đúng các cột: Tên món, Danh mục, Giá, Thuế suất...
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDownloadingTemplate}
              onClick={handleDownloadTemplate}
              className="shrink-0 gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloadingTemplate ? 'Đang tải...' : 'Tải file mẫu'}
            </Button>
          </div>

          {/* File Selector / Drag Zone */}
          {!importResult && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-surface/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary mb-3 shadow-xs">
                  <Upload className="h-6 w-6" />
                </div>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-bold text-text">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Kích thước: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <span className="inline-block mt-3 text-xs font-semibold text-primary hover:underline">
                      Chọn file khác
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text">
                      Nhấn vào đây để chọn file Excel
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Chỉ chấp nhận file .xlsx (tối đa 10MB)
                    </p>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Import Result Stats */}
          {importResult && (
            <div className="space-y-4">
              <div
                className={`rounded-xl p-4 border flex items-center gap-3 ${
                  importResult.errorCount === 0
                    ? 'bg-status-ready/10 border-status-ready/30 text-status-ready'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {importResult.errorCount === 0 ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-status-ready" />
                ) : (
                  <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {importResult.errorCount === 0
                      ? 'Nhập dữ liệu thành công hoàn toàn!'
                      : 'Đã hoàn tất nhập với một số lưu ý'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Đã xử lý {importResult.totalRows} dòng dữ liệu từ file Excel.
                  </p>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface/50 p-3 text-center">
                  <div className="text-xs text-muted font-medium">Thêm mới</div>
                  <div className="text-xl font-bold text-status-ready mt-1">
                    {importResult.insertedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3 text-center">
                  <div className="text-xs text-muted font-medium">Cập nhật</div>
                  <div className="text-xl font-bold text-primary mt-1">
                    {importResult.updatedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3 text-center">
                  <div className="text-xs text-muted font-medium">Lỗi</div>
                  <div className="text-xl font-bold text-red-600 mt-1">
                    {importResult.errorCount}
                  </div>
                </div>
              </div>

              {/* Errors List */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Chi tiết các dòng bị lỗi ({importResult.errors.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-800 space-y-1.5 font-mono">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="select-none text-red-400">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border p-4 bg-surface/30">
          {importResult ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setImportResult(null)
                  setSelectedFile(null)
                }}
              >
                Nhập file khác
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleClose}
              >
                Hoàn tất & Đóng
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isUploading}
                onClick={handleClose}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Bắt đầu tải lên
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

