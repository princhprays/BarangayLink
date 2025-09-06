import React, { useState, useEffect } from 'react'
import { authAPI, residentsAPI } from '../../services/api'
import { Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '../../components/Avatar'
import { formatUserName } from '../../utils/nameUtils'

interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  phone_number?: string
  profile_picture_url?: string
  created_at: string
  updated_at: string
}

interface ResidentProfile {
  id: number
  user_id: number
  barangay_id: number
  first_name: string
  last_name: string
  middle_name?: string
  birth_date: string
  gender: string
  civil_status: string
  nationality: string
  religion: string
  occupation: string
  monthly_income: number
  educational_attainment: string
  contact_number: string
  emergency_contact: string
  emergency_contact_number: string
  address: string
  is_voter: boolean
  is_indigent: boolean
  is_pwd: boolean
  is_senior_citizen: boolean
  created_at: string
  updated_at: string
}

export const ResidentUserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [showResidentDetails, setShowResidentDetails] = useState(false)
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null)
  const [residentLoading, setResidentLoading] = useState(false)
  const [isEditingResidentDetails, setIsEditingResidentDetails] = useState(false)
  const [residentFormData, setResidentFormData] = useState<Partial<ResidentProfile>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchResidentProfile = async () => {
    try {
      setResidentLoading(true)
      const response = await residentsAPI.getProfile()
      setResidentProfile(response.data)
      setResidentFormData(response.data)
    } catch (err: any) {
      console.error('Failed to fetch resident profile:', err)
      toast.error('Failed to load resident details')
    } finally {
      setResidentLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getProfile()
      const userData = response.data.user
      setProfile(userData)
      setFormData(userData)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'profile_picture_url' && formData[key as keyof UserProfile]) {
          submitData.append(key, formData[key as keyof UserProfile] as string)
        }
      })
      
      // Add profile picture file if selected
      if (profilePictureFile) {
        submitData.append('profile_picture', profilePictureFile)
      }
      
      const response = await authAPI.updateProfile(submitData)
      const userData = response.data.user
      setProfile(userData)
      setIsEditing(false)
      setProfilePictureFile(null)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setIsEditing(false)
    setError(null)
    setProfilePictureFile(null)
  }

  const handleResidentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setResidentFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResidentLoading(true)
    setError(null)

    try {
      await residentsAPI.updateProfile(residentFormData)
      toast.success('Resident details updated successfully!')
      setIsEditingResidentDetails(false)
      fetchResidentProfile() // Refresh resident profile data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update resident details')
      toast.error('Failed to update resident details')
    } finally {
      setResidentLoading(false)
    }
  }

  const handleResidentCancel = () => {
    setIsEditingResidentDetails(false)
    setResidentFormData(residentProfile || {})
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information.</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn bg-primary-600 text-white hover:bg-primary-700 flex items-center"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {profile && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border">
            {/* Profile Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Avatar
                    src={profile.profile_picture_url}
                    name={formatUserName(profile)}
                    size="xl"
                  />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-gray-600">Resident</p>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="px-6 py-4 space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                ) : (
                  <p className="text-gray-900">{profile.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                ) : (
                  <p className="text-gray-900">{profile.last_name}</p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.middle_name || ''}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.middle_name || 'Not provided'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                ) : (
                  <p className="text-gray-900">{profile.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter contact number"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone_number || 'Not provided'}</p>
                )}
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={formData.profile_picture_url || profile.profile_picture_url}
                        name={formatUserName({ first_name: formData.first_name || profile.first_name, last_name: formData.last_name || profile.last_name })}
                        size="lg"
                      />
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Validate file size (max 2MB)
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error('File size must be less than 2MB')
                                return
                              }
                              
                              // Validate file type
                              if (!file.type.startsWith('image/')) {
                                toast.error('Please select a valid image file')
                                return
                              }
                              
                              // Create a preview URL
                              const previewUrl = URL.createObjectURL(file)
                              setFormData({ ...formData, profile_picture_url: previewUrl })
                              setProfilePictureFile(file)
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: Square image, max 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={profile.profile_picture_url}
                      name={formatUserName(profile)}
                      size="lg"
                    />
                    <p className="text-sm text-gray-500">
                      {profile.profile_picture_url ? 'Profile picture uploaded' : 'No profile picture'}
                    </p>
                  </div>
                )}
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Created
                </label>
                <p className="text-gray-900">{formatDate(profile.created_at)}</p>
              </div>

              {/* Last Updated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Updated
                </label>
                <p className="text-gray-900">{formatDate(profile.updated_at)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 px-6 pb-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-primary-600 text-white hover:bg-primary-700 flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        )}

        {/* Resident Details Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div 
            className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
            onClick={() => {
              if (!showResidentDetails && !residentProfile) {
                fetchResidentProfile()
              }
              setShowResidentDetails(!showResidentDetails)
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Resident Details</h2>
                <p className="text-gray-600">Complete resident information for barangay services</p>
              </div>
              <div className="flex items-center space-x-3">
                {showResidentDetails && residentProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingResidentDetails(!isEditingResidentDetails)
                    }}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {isEditingResidentDetails ? 'Cancel Edit' : 'Edit Details'}
                  </button>
                )}
                {showResidentDetails ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {showResidentDetails && (
            <div className="p-6">
              {residentLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
                  ))}
                </div>
              ) : residentProfile ? (
                isEditingResidentDetails ? (
                  <form onSubmit={handleResidentSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                          <input
                            type="date"
                            name="birth_date"
                            value={residentFormData.birth_date || ''}
                            onChange={handleResidentInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                          <select
                            name="gender"
                            value={residentFormData.gender || ''}
                            onChange={handleResidentInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                          <select
                            name="civil_status"
                            value={residentFormData.civil_status || ''}
                            onChange={handleResidentInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select civil status</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="widowed">Widowed</option>
                            <option value="divorced">Divorced</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                          <input
                            type="text"
                            name="nationality"
                            value={residentFormData.nationality || ''}
                            onChange={handleResidentInputChange}
                            placeholder="e.g., Filipino"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                          <input
                            type="text"
                            name="religion"
                            value={residentFormData.religion || ''}
                            onChange={handleResidentInputChange}
                            placeholder="e.g., Catholic"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Professional Information</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                          <input
                            type="text"
                            name="occupation"
                            value={residentFormData.occupation || ''}
                            onChange={handleResidentInputChange}
                            placeholder="e.g., Teacher, Engineer"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                          <input
                            type="number"
                            name="monthly_income"
                            value={residentFormData.monthly_income || ''}
                            onChange={handleResidentInputChange}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Educational Attainment</label>
                          <select
                            name="educational_attainment"
                            value={residentFormData.educational_attainment || ''}
                            onChange={handleResidentInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select education level</option>
                            <option value="Elementary">Elementary</option>
                            <option value="High School">High School</option>
                            <option value="Vocational">Vocational</option>
                            <option value="College">College</option>
                            <option value="Graduate">Graduate</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                          <input
                            type="tel"
                            name="contact_number"
                            value={residentFormData.contact_number || ''}
                            onChange={handleResidentInputChange}
                            placeholder="09123456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Emergency Contact</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                          <input
                            type="text"
                            name="emergency_contact"
                            value={residentFormData.emergency_contact || ''}
                            onChange={handleResidentInputChange}
                            placeholder="Full name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
                          <input
                            type="tel"
                            name="emergency_contact_number"
                            value={residentFormData.emergency_contact_number || ''}
                            onChange={handleResidentInputChange}
                            placeholder="09123456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Address & Status */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Address & Status</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            name="address"
                            value={residentFormData.address || ''}
                            onChange={handleResidentInputChange}
                            rows={3}
                            placeholder="Complete address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Special Status</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="is_voter"
                                checked={residentFormData.is_voter || false}
                                onChange={handleResidentInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm">Voter</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="is_indigent"
                                checked={residentFormData.is_indigent || false}
                                onChange={handleResidentInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm">Indigent</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="is_pwd"
                                checked={residentFormData.is_pwd || false}
                                onChange={handleResidentInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm">Person with Disability (PWD)</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="is_senior_citizen"
                                checked={residentFormData.is_senior_citizen || false}
                                onChange={handleResidentInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm">Senior Citizen</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleResidentCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={residentLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {residentLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                        <p className="text-gray-900">{residentProfile.birth_date ? new Date(residentProfile.birth_date).toLocaleDateString() : 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <p className="text-gray-900">{residentProfile.gender || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                        <p className="text-gray-900">{residentProfile.civil_status || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                        <p className="text-gray-900">{residentProfile.nationality || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                        <p className="text-gray-900">{residentProfile.religion || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Professional Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                        <p className="text-gray-900">{residentProfile.occupation || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                        <p className="text-gray-900">{residentProfile.monthly_income ? `₱${residentProfile.monthly_income.toLocaleString()}` : 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Educational Attainment</label>
                        <p className="text-gray-900">{residentProfile.educational_attainment || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <p className="text-gray-900">{residentProfile.contact_number || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Emergency Contact</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                        <p className="text-gray-900">{residentProfile.emergency_contact || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Number</label>
                        <p className="text-gray-900">{residentProfile.emergency_contact_number || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Address & Status */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Address & Status</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-gray-900">{residentProfile.address || 'Not provided'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Special Status</label>
                        <div className="flex flex-wrap gap-2">
                          {residentProfile.is_voter && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Voter
                            </span>
                          )}
                          {residentProfile.is_indigent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Indigent
                            </span>
                          )}
                          {residentProfile.is_pwd && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              PWD
                            </span>
                          )}
                          {residentProfile.is_senior_citizen && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Senior Citizen
                            </span>
                          )}
                          {!residentProfile.is_voter && !residentProfile.is_indigent && !residentProfile.is_pwd && !residentProfile.is_senior_citizen && (
                            <span className="text-gray-500 text-sm">No special status</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No resident details available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
