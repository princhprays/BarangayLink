import React, { useState } from 'react'
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
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react'

interface AdminSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
}

interface NavSection {
  title: string
  icon: any
  items: NavItem[]
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard'])

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    )
  }

  const navSections: NavSection[] = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      items: [
        { name: 'Overview', href: '/admin', icon: Home }
      ]
    },
    {
      title: 'Management',
      icon: Settings,
      items: [
        { name: 'Users & Verifications', href: '/admin/manage-users', icon: Users },
        { name: 'Documents & Requests', href: '/admin/document-management', icon: FileCheck },
        { name: 'Benefits & Applications', href: '/admin/benefits', icon: Gift },
        { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
        { name: 'Marketplace', href: '/admin/pending-items', icon: Package }
      ]
    },
    {
      title: 'Reviews & Approvals',
      icon: Clock,
      items: [
        { name: 'User Verifications', href: '/admin/verifications', icon: UserCheck },
        { name: 'Request Management', href: '/admin/request-management', icon: FileText },
        { name: 'Benefit Applications', href: '/admin/benefit-applications', icon: FileText },
        { name: 'SOS & Relocation', href: '/admin/sos-relocation', icon: AlertTriangle }
      ]
    },
    {
      title: 'System',
      icon: Shield,
      items: [
        { name: 'Admin Management', href: '/admin/admin-management', icon: Settings },
        { name: 'Profile', href: '/admin/profile', icon: User }
      ]
    }
  ]

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon
          const isExpanded = expandedSections.includes(section.title.toLowerCase().replace(/\s+/g, '-'))
          const isLastSection = sectionIndex === navSections.length - 1
          
          return (
            <div key={section.title}>
              {/* Section Header */}
              <div className="mb-2">
                {isCollapsed ? (
                  <div className="flex justify-center">
                    <SectionIcon className="h-5 w-5 text-gray-500" title={section.title} />
                  </div>
                ) : (
                  <button
                    onClick={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, '-'))}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <SectionIcon className="h-4 w-4 mr-2" />
                      <span>{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Section Items */}
              {(!isCollapsed && isExpanded) && (
                <div className="ml-6 space-y-1 mb-4">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.href === '/admin'}
                        className={({ isActive }) => {
                          const baseClasses = `sidebar-item ${isCollapsed ? 'justify-center' : ''}`
                          const activeClasses = "sidebar-item-active"
                          const inactiveClasses = "sidebar-item-inactive"
                          
                          return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
                        }}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 text-sm">{item.name}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              )}
              
              {/* Sidebar Toggle Button after last section */}
              {isLastSection && onToggle && (
                <div className={`mt-4 ${isCollapsed ? 'px-1' : ''}`}>
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
