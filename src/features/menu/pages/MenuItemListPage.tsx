import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Upload, FileSpreadsheet, FileCheck } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from 'sonner'
import { useMenuItems } from '../hooks/useMenu'
import { useMenuFilters } from '../hooks/useMenuFilters'
import { MenuFilters } from '../components/MenuFilters'
import { MenuFeedback } from '../components/MenuFeedback'
import { MenuPagination } from '../components/MenuPagination'
import { MenuStatusBadge } from '../components/MenuStatusBadge'
import { MenuImage } from '../components/MenuImage'
import { MenuExcelImportModal } from '../components/MenuExcelImportModal'
import { menuApi } from '../api/menuApi'
import { formatMenuPrice, getMenuErrorMessage, orderedMenuImages } from '../utils/menu'
import { getApiErrorMessage } from '@/shared/lib/axios'

export function MenuItemListPage() {
  const filters = useMenuFilters()
  const query = useMenuItems(filters.params, !filters.invalid)
  const data = query.data

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

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

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true)
      const blob = await menuApi.exportExcel()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `menu_items_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Đã xuất danh sách món ra file Excel thành công!')
    } catch (err) {
      toast.error('Lỗi khi xuất file Excel: ' + getApiErrorMessage(err))
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Quản lý thực đơn
          </p>
          <h1 className="text-2xl font-bold text-primary">Danh sách món</h1>
          <p className="mt-2 text-sm text-muted">
            Theo dõi món ăn, danh mục, giá bán và xuất nhập file Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            disabled={isDownloadingTemplate}
            onClick={handleDownloadTemplate}
            className="gap-1.5 text-xs font-semibold"
          >
            <FileCheck className="h-3.5 w-3.5 text-accent" />
            {isDownloadingTemplate ? 'Đang tải...' : 'Tải file mẫu'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isExportingExcel}
            onClick={handleExportExcel}
            className="gap-1.5 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            {isExportingExcel ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Upload className="h-3.5 w-3.5 text-status-ready" />
            Nhập Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={query.isFetching || filters.invalid}
            onClick={() => void query.refetch()}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Link
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover focus-visible:outline-accent shadow-xs"
            to="/owner/menu-items/new"
          >
            <Plus className="h-4 w-4" />
            Tạo món
          </Link>
        </div>
      </header>

      <MenuFilters params={filters.params} onChange={filters.change} onReset={filters.reset} />

      {filters.invalid ? (
        <MenuFeedback
          message="Bộ lọc trong đường dẫn chưa hợp lệ. Vui lòng đặt lại bộ lọc."
          retry={filters.reset}
        />
      ) : query.isPending ? (
        <MenuFeedback message="Đang tải danh sách món..." loading />
      ) : query.isError ? (
        <MenuFeedback
          message={getMenuErrorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          {data?.content.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="font-semibold text-primary">Không có món phù hợp</h2>
              <p className="mt-2 text-sm text-muted">
                Thử đổi bộ lọc hoặc nhập dữ liệu từ file Excel / tạo món mới.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button variant="outline" onClick={filters.reset}>
                  Về danh sách đầu tiên
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsImportModalOpen(true)}
                  className="gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  Nhập file Excel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
              aria-busy={query.isFetching}
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Danh sách món theo danh mục và trạng thái
                </caption>
                <thead className="bg-surface/30 text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4">Món ăn</th>
                    <th scope="col" className="px-5 py-4">Danh mục</th>
                    <th scope="col" className="px-5 py-4">Giá</th>
                    <th scope="col" className="px-5 py-4">Trạng thái</th>
                    <th scope="col" className="px-5 py-4">Khả dụng hiện tại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.content.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/20">
                      <th scope="row" className="min-w-56 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <MenuImage
                            src={orderedMenuImages(item.images)[0]?.imageUrl}
                            name={item.name}
                            className="h-14 w-14 shrink-0 rounded-lg"
                          />
                          <div>
                            <Link
                              className="font-semibold text-primary hover:underline focus-visible:outline-accent"
                              to={`/owner/menu-items/${item.id}`}
                            >
                              {item.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {item.isFeatured && (
                                <Badge variant="secondary">Nổi bật</Badge>
                              )}
                              {(item.isDirectSale || item.is_direct_sale) && (
                                <Badge variant="outline" className="border-sky-500 text-sky-600 bg-sky-50 dark:bg-sky-950/40 text-[10px]">
                                  Bán trực tiếp
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </th>
                      <td className="px-5 py-4 text-muted">{item.category.name}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {formatMenuPrice(item.price)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <MenuStatusBadge status={item.status} />
                      </td>
                      <td className="min-w-44 px-5 py-4 text-muted">
                        {item.availability.sellable
                          ? 'Có thể đặt món'
                          : 'Hiện chưa thể đặt món'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && (
            <MenuPagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              busy={query.isFetching}
              onPage={(page) => filters.change('page', String(page))}
            />
          )}
        </>
      )}

      {/* Excel Import Modal */}
      <MenuExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => void query.refetch()}
      />
    </section>
  )
}
