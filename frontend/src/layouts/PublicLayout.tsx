import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileSidebar } from '../components/MobileSidebar'

export const PublicLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={handleMenuClick} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
        isAdmin={false}
        isPublic={true}
      />
    </div>
  )
}
