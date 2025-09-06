import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Package, 
  FileText, 
  Gift, 
  FileCheck, 
  Megaphone, 
  AlertTriangle,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const { user } = useAuth()

  const residentItems = [
    { name: 'Dashboard', href: '/resident', icon: Home },
    { name: 'Community', href: '/resident/community-items', icon: Package },
    { name: 'Requests', href: '/resident/my-requests', icon: FileText },
    { name: 'Benefits', href: '/resident/benefits', icon: Gift },
    { name: 'Certificates', href: '/resident/certificates', icon: FileCheck },
    { name: 'Announcements', href: '/resident/announcements', icon: Megaphone },
    { name: 'Emergency', href: '/resident/sos-relocation', icon: AlertTriangle },
    { name: 'Profile', href: '/resident/profile', icon: User },
  ]

  const getSidebarItems = () => {
    if (user?.status === 'pending') {
      return [
        { name: 'Profile', href: '/resident/profile', icon: User, disabled: false },
        { name: 'Benefits', href: '/resident/benefits', icon: Gift, disabled: false },
        ...residentItems.slice(2).map(item => ({ ...item, disabled: true }))
      ]
    }
    return residentItems.map(item => ({ ...item, disabled: false }))
  }

  const sidebarItems = getSidebarItems()

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon
          const isLastItem = index === sidebarItems.length - 1
          
          return (
            <div key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/resident' || item.href === '/admin'}
                className={({ isActive }) => {
                  const baseClasses = `sidebar-item ${isCollapsed ? 'justify-center' : ''}`
                  const activeClasses = "sidebar-item-active"
                  const inactiveClasses = item.disabled ? "sidebar-item-disabled" : "sidebar-item-inactive"
                  
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
