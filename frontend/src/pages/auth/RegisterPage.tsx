import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Upload, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'

interface Location {
  id: number
  name: string
  psgc_code: string
  geographic_level: string
}

interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  first_name: string
  last_name: string
  middle_name?: string
  phone_number: string
  province_id: number
  municipality_id: number
  barangay_id: number
  complete_address?: string
  valid_id: FileList
  selfie_with_id: FileList
  profile_picture?: FileList
}

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null)
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{
    valid_id: File | null
    selfie_with_id: File | null
    profile_picture: File | null
  }>({
    valid_id: null,
    selfie_with_id: null,
    profile_picture: null
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterForm>()

  const password = watch('password')
  const provinceId = watch('province_id')
  const municipalityId = watch('municipality_id')

  // Fetch provinces
  const { data: provincesData } = useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const response = await api.get('/locations/provinces')
      return response.data.provinces.sort((a: Location, b: Location) => a.name.localeCompare(b.name))
    }
  })

  // Fetch municipalities when province is selected
  const { data: municipalitiesData, isLoading: municipalitiesLoading } = useQuery({
    queryKey: ['municipalities', provinceId],
    queryFn: async () => {
      if (!provinceId) return []
      const response = await api.get(`/locations/municipalities?province_id=${provinceId}`)
      return response.data.municipalities.sort((a: Location, b: Location) => a.name.localeCompare(b.name))
    },
    enabled: !!provinceId
  })

  // Fetch barangays when municipality is selected
  const { data: barangaysData, isLoading: barangaysLoading } = useQuery({
    queryKey: ['barangays', selectedMunicipality],
    queryFn: async () => {
      if (!selectedMunicipality) return []
      const response = await api.get(`/locations/barangays?municipality_id=${selectedMunicipality}`)
      return response.data.barangays.sort((a: Location, b: Location) => a.name.localeCompare(b.name))
    },
    enabled: !!selectedMunicipality
  })

  const handleFileUpload = (file: File, type: 'valid_id' | 'selfie_with_id' | 'profile_picture') => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }))
  }

  const removeFile = (type: 'valid_id' | 'selfie_with_id' | 'profile_picture') => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: null
    }))
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      // Create FormData for file uploads
      const formData = new FormData()
      
      // Add form fields
      formData.append('username', data.username)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('confirm_password', data.confirmPassword)
      formData.append('first_name', data.first_name)
      formData.append('last_name', data.last_name)
      if (data.middle_name) formData.append('middle_name', data.middle_name)
      formData.append('phone_number', data.phone_number)
      formData.append('province_id', data.province_id.toString())
      formData.append('municipality_id', data.municipality_id.toString())
      formData.append('barangay_id', data.barangay_id.toString())
      if (data.complete_address) formData.append('complete_address', data.complete_address)
      
      // Add files
      if (uploadedFiles.valid_id) {
        formData.append('valid_id', uploadedFiles.valid_id)
      }
      if (uploadedFiles.selfie_with_id) {
        formData.append('selfie_with_id', uploadedFiles.selfie_with_id)
      }
      if (uploadedFiles.profile_picture) {
        formData.append('profile_picture', uploadedFiles.profile_picture)
      }
      
      await registerUser(formData)
      navigate('/login', { state: { message: 'Registration successful! Please check your email to verify your account.' } })
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-xl">BL</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Join BarangayLink
          </h1>
          <p className="text-blue-200 text-lg">
            Create your account to access community services
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-sm text-gray-600">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Personal & Account Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      {...register('first_name', { required: 'First name is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                      placeholder="First name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      {...register('last_name', { required: 'Last name is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                      placeholder="Last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name (Optional)
                  </label>
                  <input
                    {...register('middle_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    placeholder="Middle name"
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Account Information</h3>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    {...register('username', { required: 'Username is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    placeholder="Choose a username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    {...register('phone_number', { required: 'Contact number is required' })}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    placeholder="Enter your phone number"
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === password || 'Passwords do not match'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Right Column - Address & Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Address Information</h3>

                <div>
                  <label htmlFor="province_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Province *
                  </label>
                  <select
                    {...register('province_id', { 
                      required: 'Please select your province',
                      onChange: (e) => {
                        const provinceId = parseInt(e.target.value)
                        setSelectedProvince(provinceId)
                        setSelectedMunicipality(null)
                        setValue('municipality_id', 0)
                        setValue('barangay_id', 0)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  >
                    <option value="">Select your province</option>
                    {provincesData?.map((province: Location) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {errors.province_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.province_id.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="municipality_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Municipality/City *
                  </label>
                  <select
                    {...register('municipality_id', { 
                      required: 'Please select your municipality/city',
                      onChange: (e) => {
                        const municipalityId = parseInt(e.target.value)
                        setSelectedMunicipality(municipalityId)
                        setValue('barangay_id', 0)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    disabled={!selectedProvince || municipalitiesLoading}
                  >
                    <option value="">
                      {municipalitiesLoading ? 'Loading municipalities...' : 'Select your municipality/city'}
                    </option>
                    {municipalitiesData?.map((municipality: Location) => (
                      <option key={municipality.id} value={municipality.id}>
                        {municipality.name}
                      </option>
                    ))}
                  </select>
                  {errors.municipality_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.municipality_id.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="barangay_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Barangay *
                  </label>
                  <select
                    {...register('barangay_id', { required: 'Please select your barangay' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    disabled={!selectedMunicipality || barangaysLoading}
                  >
                    <option value="">
                      {barangaysLoading ? 'Loading barangays...' : 'Select your barangay'}
                    </option>
                    {barangaysData?.map((barangay: Location) => (
                      <option key={barangay.id} value={barangay.id}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                  {errors.barangay_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.barangay_id.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="complete_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Complete Address (Optional)
                  </label>
                  <textarea
                    {...register('complete_address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    placeholder="House number, street, subdivision, etc."
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Verification Documents</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid ID *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedFiles.valid_id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{uploadedFiles.valid_id.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('valid_id')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Upload valid ID (JPG, PNG, PDF)</p>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          id="valid_id"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], 'valid_id')
                            }
                          }}
                        />
                        <label
                          htmlFor="valid_id"
                          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selfie with ID *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedFiles.selfie_with_id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{uploadedFiles.selfie_with_id.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('selfie_with_id')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Upload selfie holding your ID (JPG, PNG)</p>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          id="selfie_with_id"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], 'selfie_with_id')
                            }
                          }}
                        />
                        <label
                          htmlFor="selfie_with_id"
                          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedFiles.profile_picture ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{uploadedFiles.profile_picture.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('profile_picture')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Upload profile picture (JPG, PNG)</p>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          id="profile_picture"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], 'profile_picture')
                            }
                          }}
                        />
                        <label
                          htmlFor="profile_picture"
                          className="mt-2 inline-block px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={isLoading || !uploadedFiles.valid_id || !uploadedFiles.selfie_with_id}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
              <p className="mt-2 text-sm text-gray-600 text-center">
                By creating an account, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
