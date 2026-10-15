import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'Tính năng đang trong quá trình xây dựng theo kế hoạch dự án.',
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-dashed border-border rounded-xl">
      <div className="w-14 h-14 rounded-full bg-surface text-primary flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-accent" />
      </div>
      <h2 className="text-xl font-bold text-text mb-2">{title}</h2>
      <p className="text-sm text-muted max-w-md">{description}</p>
    </div>
  )
}
export default PlaceholderPage
