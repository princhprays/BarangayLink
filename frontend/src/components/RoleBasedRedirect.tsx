import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface RoleBasedRedirectProps {
  children: React.ReactNode
}

export const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { user, isLoading } = useAuth()

  console.log('RoleBasedRedirect - user:', user, 'isLoading:', isLoading)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('RoleBasedRedirect - no user, showing children')
    return <>{children}</>
  }

  console.log('RoleBasedRedirect - user role:', user.role)

  // Redirect based on user role
  if (user.role === 'admin') {
    console.log('RoleBasedRedirect - redirecting to /admin')
    return <Navigate to="/admin" replace />
  }

  if (user.role === 'resident') {
    console.log('RoleBasedRedirect - redirecting to /resident')
    return <Navigate to="/resident" replace />
  }

  console.log('RoleBasedRedirect - no matching role, showing children')
  return <>{children}</>
}
