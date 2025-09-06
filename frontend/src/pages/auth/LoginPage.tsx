import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

interface LoginForm {
  email_or_username: string
  password: string
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.email_or_username, data.password)
      console.log('Login successful, navigating to home page...')
      // Let the RoleBasedRedirect component handle the redirect based on user role
      if (from !== '/') {
        navigate(from, { replace: true })
      } else {
        // Navigate to home page and let RoleBasedRedirect handle the role-based redirect
        navigate('/', { replace: true })
      }
    } catch (error: any) {
      console.error('Login form error:', error)
      // Error is handled by the auth context, but we can add additional handling here
      if (error.message === 'Account pending approval') {
        // Don't navigate, just show the error
      } else if (error.message === 'Account rejected') {
        // Don't navigate, just show the error
      } else {
        // For other errors, we might want to stay on the login page
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-lg">BL</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-blue-200 text-sm">
            Sign in to your BarangayLink account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-600">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email_or_username" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <input
                {...register('email_or_username', {
                  required: 'Email or username is required'
                })}
                id="email_or_username"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                placeholder="Enter your email or username"
              />
              {errors.email_or_username && (
                <p className="mt-1 text-sm text-red-600">{errors.email_or_username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
