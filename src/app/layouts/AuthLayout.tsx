import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-surface selection:text-text">
      <main className="flex-1 flex items-center justify-center w-full px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} ROMS — Restaurant Operations Management System.
      </footer>
    </div>
  )
}
