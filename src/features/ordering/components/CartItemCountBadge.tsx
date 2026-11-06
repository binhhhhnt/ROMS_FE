import { useCartStore } from '@/features/ordering/store/cartStore'

export function CartItemCountBadge() {
  const count = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  )

  return (
    <>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-card bg-[#e5484d] px-1 text-[11px] font-bold leading-none text-white tabular-nums"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {` (${count} phần)`}
      </span>
    </>
  )
}
