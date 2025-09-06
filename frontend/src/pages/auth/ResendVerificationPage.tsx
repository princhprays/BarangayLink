import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

export const ResendVerificationPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)

  const checkEmailStatus = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    setCheckingEmail(true)
    try {
      const response = await api.post('/auth/resend-verification', { email })
      if (response.data.email_verified) {
        setStatus('success')
        setMessage(response.data.message)
      }
    } catch (error: any) {
      // Don't show error for checking, just reset status
      setStatus('idle')
    }
    setCheckingEmail(false)
  }

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email && email.includes('@')) {
        checkEmailStatus(email)
      }
    }, 1000) // Check after 1 second of no typing

    return () => clearTimeout(timeoutId)
  }, [email])

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage('Please enter your email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await api.post('/auth/resend-verification', { email })
      setStatus('success')
      setMessage(response.data.message)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to resend verification email'
      
      // Handle specific case where email is already verified
      if (errorMessage.includes('already verified')) {
        setStatus('success')
        setMessage('Your email is already verified! You can now log in to your account.')
      } else {
        setMessage(errorMessage)
        setStatus('error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            {status === 'idle' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Resend Verification Email
                </h1>
                <p className="text-gray-600 mb-6">
                  Enter your email address to receive a new verification link.
                </p>
                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {checkingEmail && (
                      <p className="text-sm text-blue-600 mt-1">Checking email status...</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Send Verification Email
                  </button>
                </form>
              </>
            )}

            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Sending Email...
                </h1>
                <p className="text-gray-600">
                  Please wait while we send your verification email.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Sent!
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block"
                  >
                    Go to Login
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {message.includes('not found') ? 'Email Not Found' : 'Failed to Send Email'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  {message.includes('not found') ? (
                    <>
                      <Link
                        to="/register"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block text-center"
                      >
                        Register New Account
                      </Link>
                      <button
                        onClick={() => setStatus('idle')}
                        className="w-full bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Try Different Email
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setStatus('idle')}
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Try Again
                      </button>
                      <Link
                        to="/register"
                        className="w-full bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block text-center"
                      >
                        Register Again
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="mt-6 pt-6 border-t">
              <Link
                to="/"
                className="flex items-center justify-center text-blue-600 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
