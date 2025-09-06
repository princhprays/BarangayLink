import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from './Avatar'
import { formatUserName } from '../utils/nameUtils'

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, isAuthenticated } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setProfileOpen(false)
  }

  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Marketplace', href: '/marketplace' },
        { name: 'Community Benefits', href: '/benefits' },
        { name: 'Announcements', href: '/announcements' },
        { name: 'Certificates', href: '/certificates' },
        { name: 'About', href: '/about' },
      ]
    }

    if (user?.role === 'admin') {
      return [
        { name: 'Residents', href: '/admin' },
        { name: 'Requests', href: '/admin/request-management' },
        { name: 'Announcements', href: '/admin/announcements' },
        { name: 'SOS/Relocation', href: '/admin/sos-relocation' },
      ]
    }

    return [
      { name: 'Community', href: '/resident' },
      { name: 'Requests', href: '/resident/my-requests' },
      { name: 'Benefits', href: '/resident/benefits' },
      { name: 'Certificates', href: '/resident/certificates' },
      { name: 'Announcements', href: '/resident/announcements' },
      { name: 'Emergency', href: '/resident/sos-relocation' },
    ]
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={handleMenuClick}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BL</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">BarangayLink</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {getNavigationItems().map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/resident' || item.href === '/admin'}
                className={({ isActive }) => {
                  const baseClasses = "px-4 py-2 text-sm font-medium transition-all duration-200 relative"
                  const activeClasses = "text-primary-700 border-b-2 border-primary-600"
                  const inactiveClasses = "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
                  
                  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
                }}
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  <Avatar
                    src={user?.profile_picture_url}
                    name={formatUserName(user)}
                    size="sm"
                  />
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to={user?.role === 'admin' ? '/admin/profile' : '/resident/profile'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile
                    </Link>
                    {user?.role === 'resident' && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          to="/resident/create-request"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          Create Request
                        </Link>
                        <Link
                          to="/resident/add-item"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          Add Item
                        </Link>
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
