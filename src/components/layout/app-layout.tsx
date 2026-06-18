import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar — slides in on mobile, always visible lg+ */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64 print:pl-0 flex flex-col min-h-screen">
        <div className="print:hidden">
          <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        </div>
        <main className="p-3 sm:p-4 md:p-6 flex-1 overflow-x-hidden print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
