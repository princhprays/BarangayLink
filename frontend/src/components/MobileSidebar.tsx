import React from 'react'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AdminSidebar } from './AdminSidebar'
import { PublicSidebar } from './PublicSidebar'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  isAdmin?: boolean
  isPublic?: boolean
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  isOpen, 
  onClose, 
  isAdmin = false,
  isPublic = false
}) => {
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-[9998] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`mobile-sidebar ${
          isOpen ? 'mobile-sidebar-open' : 'mobile-sidebar-closed'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isAdmin ? 'Admin Menu' : isPublic ? 'Menu' : 'Menu'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="h-full overflow-y-auto">
          {isAdmin ? <AdminSidebar /> : isPublic ? <PublicSidebar /> : <Sidebar />}
        </div>
      </div>
    </>
  )
}
