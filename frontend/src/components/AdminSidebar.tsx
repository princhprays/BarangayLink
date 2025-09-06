import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Users, 
  FileText, 
  UserCheck, 
  Settings, 
  Package, 
  FileCheck, 
  Megaphone, 
  AlertTriangle,
  User,
  Gift,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const adminItems = [
    { name: 'Admin Dashboard', href: '/admin', icon: Home },
    { name: 'Verifications', href: '/admin/verifications', icon: UserCheck },
    { name: 'Request Management', href: '/admin/request-management', icon: FileText },
    { name: 'Manage Users', href: '/admin/manage-users', icon: Users },
    { name: 'Admin Management', href: '/admin/admin-management', icon: Settings },
    { name: 'Pending Items', href: '/admin/pending-items', icon: Package },
  { name: 'Benefits Management', href: '/admin/benefits', icon: Gift },
  { name: 'Benefit Applications', href: '/admin/benefit-applications', icon: FileText },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Document Management', href: '/admin/document-management', icon: FileCheck },
    { name: 'SOS / Relocation', href: '/admin/sos-relocation', icon: AlertTriangle },
    { name: 'Profile', href: '/admin/profile', icon: User },
  ]

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {adminItems.map((item, index) => {
          const Icon = item.icon
          const isLastItem = index === adminItems.length - 1
          
          return (
            <div key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/resident' || item.href === '/admin'}
                className={({ isActive }) => {
                  const baseClasses = `sidebar-item ${isCollapsed ? 'justify-center' : ''}`
                  const activeClasses = "sidebar-item-active"
                  const inactiveClasses = "sidebar-item-inactive"
                  
                  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
                }}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </NavLink>
              
              {/* Sidebar Toggle Button after Profile */}
              {isLastItem && onToggle && (
                <div className={`mt-2 ${isCollapsed ? 'px-1' : ''}`}>
                  <button
                    onClick={onToggle}
                    className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
                      isCollapsed 
                        ? 'w-8 h-8 p-1 bg-primary-100 text-primary-600 hover:bg-primary-200' 
                        : 'w-full px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <>
                        <PanelLeftClose className="h-5 w-5" />
                        <span className="ml-2 text-sm font-medium">Collapse</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
