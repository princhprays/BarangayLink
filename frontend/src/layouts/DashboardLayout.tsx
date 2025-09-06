import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { MobileSidebar } from '../components/MobileSidebar'

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={handleMenuClick} />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className={`hidden md:flex md:flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'md:w-16' : 'md:w-64'
        }`}>
          <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        
        {/* Mobile Sidebar */}
        <MobileSidebar 
          isOpen={sidebarOpen} 
          onClose={handleSidebarClose} 
        />
        
        {/* Main Content */}
        <div className="flex-1 transition-all duration-300">
          <main className="py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
