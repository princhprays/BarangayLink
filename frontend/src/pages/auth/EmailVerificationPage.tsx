import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../services/api'
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react'

export const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const response = await api.get(`/auth/verify/${token}`)
        setStatus('success')
        setMessage(response.data.message)
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Verification failed'
        setMessage(errorMessage)
        
        if (errorMessage.includes('expired')) {
          setStatus('expired')
        } else if (errorMessage.includes('already verified')) {
          setStatus('success')
          setMessage('Your email is already verified! You can now log in to your account.')
        } else if (errorMessage.includes('Invalid verification token')) {
          setStatus('error')
          setMessage('This verification link has already been used or is invalid. If you have already verified your email, please try logging in instead.')
        } else {
          setStatus('error')
        }
      }
    }

    verifyEmail()
  }, [token])


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Verifying Email...
                </h1>
                <p className="text-gray-600">
                  Please wait while we verify your email address.
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
                  {message.includes('already verified') ? 'Email Already Verified!' : 'Email Verified!'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                {message.includes('pending admin approval') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Account Pending Approval
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Your account is now pending admin approval. You will receive an email notification once your account is approved and you can log in.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  Verification Failed
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Link
                    to="/resend-verification"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block text-center"
                  >
                    Resend Verification Email
                  </Link>
                  <Link
                    to="/register"
                    className="w-full bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block text-center"
                  >
                    Register Again
                  </Link>
                </div>
              </>
            )}

            {status === 'expired' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Link Expired
                </h1>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Link
                    to="/resend-verification"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block text-center"
                  >
                    Resend Verification Email
                  </Link>
                  <Link
                    to="/register"
                    className="w-full bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors inline-block text-center"
                  >
                    Register Again
                  </Link>
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
