import { useSearchParams } from 'react-router-dom'
import { isMenuStatus, positiveMenuId } from '../utils/menu'
import type { MenuListParams } from '../types/menu.types'

const sorts = ['name,asc', 'name,desc', 'price,asc', 'price,desc']

export function useMenuFilters(tablet = false) {
  const [search, setSearch] = useSearchParams()
  const pageValue = search.get('page') ?? '0'
  const page = Number(pageValue)
  const categoryValue = search.get('categoryId') ?? ''
  const categoryId = positiveMenuId(categoryValue)
  const statusValue = search.get('status') ?? ''
  const sort = search.get('sort') ?? 'name,asc'
  const invalid = !/^\d+$/.test(pageValue) || !Number.isSafeInteger(page) || page >= 2147483647
    || (!!categoryValue && categoryId === null) || !sorts.includes(sort)
    || (!!statusValue && (!isMenuStatus(statusValue) || (tablet && statusValue !== 'AVAILABLE')))
  const params: MenuListParams = {
    page: invalid ? 0 : page,
    size: tablet ? 12 : 20,
    categoryId: categoryId ?? undefined,
    status: tablet ? 'AVAILABLE' : isMenuStatus(statusValue) ? statusValue : undefined,
    sort,
  }

  const change = (field: string, value: string) => {
    setSearch((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(field, value)
      else next.delete(field)
      if (field !== 'page') next.delete('page')
      return next
    })
  }

  return { params, invalid, change, reset: () => setSearch({}) }
}
