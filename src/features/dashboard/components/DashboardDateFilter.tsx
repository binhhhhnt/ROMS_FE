import { useState } from 'react'
import { Calendar, Download, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface DashboardDateFilterProps {
  startDate: string
  endDate: string
  onDateChange: (start: string, end: string) => void
  onRefresh: () => void
  onExportCsv: () => void
  isExporting?: boolean
  isRefreshing?: boolean
}

type PresetOption = '7_days' | '30_days' | 'today' | 'custom'

export function DashboardDateFilter({
  startDate,
  endDate,
  onDateChange,
  onRefresh,
  onExportCsv,
  isExporting = false,
  isRefreshing = false,
}: DashboardDateFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>('30_days')

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  const handleSelectPreset = (preset: PresetOption) => {
    setSelectedPreset(preset)
    const today = new Date()

    if (preset === 'today') {
      const todayStr = formatDate(today)
      onDateChange(todayStr, todayStr)
    } else if (preset === '7_days') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      onDateChange(formatDate(past), formatDate(today))
    } else if (preset === '30_days') {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      onDateChange(formatDate(past), formatDate(today))
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
      {/* Preset Buttons & Custom Date */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              selectedPreset === 'today' ? 'bg-card text-primary font-bold shadow-xs' : 'text-muted hover:text-text'
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('7_days')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              selectedPreset === '7_days' ? 'bg-card text-primary font-bold shadow-xs' : 'text-muted hover:text-text'
            }`}
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('30_days')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              selectedPreset === '30_days' ? 'bg-card text-primary font-bold shadow-xs' : 'text-muted hover:text-text'
            }`}
          >
            30 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('custom')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              selectedPreset === 'custom' ? 'bg-card text-primary font-bold shadow-xs' : 'text-muted hover:text-text'
            }`}
          >
            Tùy chọn
          </button>
        </div>

        {/* Custom Date Pickers */}
        {selectedPreset === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="pl-8 pr-2 py-1.5 h-9 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent"
                title="Từ ngày"
              />
            </div>
            <span className="text-muted">đến</span>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="pl-8 pr-2 py-1.5 h-9 rounded-md border border-border bg-card text-text focus:outline-none focus:border-accent"
                title="Đến ngày"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 px-3 text-xs"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onExportCsv}
          disabled={isExporting}
          className="h-9 px-3 text-xs border border-border font-medium"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-accent" />
          {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
        </Button>
      </div>
    </div>
  )
}
