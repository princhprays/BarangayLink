import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  phone_number?: string
  role: 'resident' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  barangay_id: number
  profile_picture_url?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

interface Barangay {
  id: number
  name: string
  city: string
  province: string
  region: string
  zip_code: string
  barangay_captain?: string
  contact_number?: string
  email?: string
  address?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  barangay: Barangay | null
  token: string | null
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (userData: FormData) => Promise<void>
  reRegister: (userData: RegisterData) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
  middle_name?: string
  phone_number: string
  province_id: number
  municipality_id: number
  barangay_id: number
  complete_address?: string
  valid_id: File
  selfie_with_id: File
  profile_picture?: File
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [barangay, setBarangay] = useState<Barangay | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          console.log('Calling profile endpoint with token:', token)
          const response = await api.get('/auth/profile')
          console.log('Profile response:', response.data)
          setUser(response.data.user)
          if (response.data.barangay) {
            setBarangay(response.data.barangay)
          }
        } catch (error) {
          console.error('Profile fetch error:', error)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          setBarangay(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [token])

  const login = async (emailOrUsername: string, password: string) => {
    try {
      console.log('Attempting login with email/username:', emailOrUsername)
      const response = await api.post('/auth/login', { 
        email: emailOrUsername,
        password 
      })
      const { access_token, user: userData, barangay: barangayData } = response.data
      
      console.log('Login response:', { userData, barangayData })
      console.log('User role:', userData.role)
      console.log('User status:', userData.status)
      
      // Check user status before setting authentication
      if (userData.status === 'pending') {
        toast.error('Account pending approval. You will receive an email notification once your account is approved.')
        throw new Error('Account pending approval')
      }
      
      if (userData.status === 'rejected') {
        toast.error('Account was rejected. Please re-register.')
        throw new Error('Account rejected')
      }
      
      setToken(access_token)
      setUser(userData)
      setBarangay(barangayData)
      localStorage.setItem('token', access_token)
      
      toast.success('Login successful!')
    } catch (error: any) {
      console.error('Login error:', error)
      const message = error.response?.data?.error || error.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (userData: FormData) => {
    try {
      await api.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      toast.success('Registration successful! Please check your email to verify your account.')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const reRegister = async (userData: RegisterData) => {
    try {
      await api.post('/auth/re-register', userData)
      toast.success('Re-registration successful! Please wait for admin approval.')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Re-registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setBarangay(null)
    setToken(null)
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
  }

  const value: AuthContextType = {
    user,
    barangay,
    token,
    login,
    register,
    reRegister,
    logout,
    isLoading,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
