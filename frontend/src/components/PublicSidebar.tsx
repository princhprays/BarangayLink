import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Package, 
  Gift, 
  Megaphone, 
  FileCheck, 
  Info,
  LogIn,
  UserPlus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const PublicSidebar: React.FC = () => {
  const { isAuthenticated } = useAuth()

  const publicItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Marketplace', href: '/marketplace', icon: Package },
    { name: 'Community Benefits', href: '/benefits', icon: Gift },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
    { name: 'Certificates', href: '/certificates', icon: FileCheck },
    { name: 'About', href: '/about', icon: Info },
  ]

  const authItems = [
    { name: 'Login', href: '/login', icon: LogIn },
    { name: 'Register', href: '/register', icon: UserPlus },
  ]

  const getSidebarItems = () => {
    if (isAuthenticated) {
      return publicItems
    }
    return [...publicItems, ...authItems]
  }

  const sidebarItems = getSidebarItems()

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <nav className="flex-1 px-2 py-4 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => {
                const baseClasses = "sidebar-item"
                const activeClasses = "sidebar-item-active"
                const inactiveClasses = "sidebar-item-inactive"
                
                return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
              }}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
