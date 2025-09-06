import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import { Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '../../components/Avatar'
import { formatUserName } from '../../utils/nameUtils'

interface AdminProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  contact_number?: string
  profile_picture_url?: string
  created_at: string
  updated_at: string
}

export const AdminProfile: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  
  // Debug: Log AuthContext user data
  console.log('AuthContext user:', user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<AdminProfile>>({})
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getProfile()
      console.log('Profile API response:', response.data)
      
      const userData = response.data.user
      console.log('User data:', userData)
      
      if (!userData) {
        // Fallback to AuthContext user data
        console.log('No user data from API, using AuthContext user')
        if (user) {
          setProfile(user as AdminProfile)
          setFormData(user as AdminProfile)
        } else {
          throw new Error('No user data available')
        }
      } else {
        setProfile(userData)
        setFormData(userData)
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err)
      
      // Fallback to AuthContext user data on error
      if (user) {
        console.log('API failed, using AuthContext user as fallback')
        setProfile(user as AdminProfile)
        setFormData(user as AdminProfile)
        setError(null) // Clear error since we have fallback data
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to fetch profile')
        toast.error('Failed to fetch profile')
      }
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
        if (key !== 'profile_picture_url' && formData[key as keyof AdminProfile]) {
          submitData.append(key, formData[key as keyof AdminProfile] as string)
        }
      })
      
      // Add profile picture file if selected
      if (profilePictureFile) {
        submitData.append('profile_picture', profilePictureFile)
      }
      
      const response = await authAPI.updateProfile(submitData)
      const userData = response.data.user
      setProfile(userData)
      // updateUser(userData) // TODO: Implement updateUser in AuthContext
      setIsEditing(false)
      setProfilePictureFile(null)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile')
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setIsEditing(false)
    setError(null)
    setProfilePictureFile(null)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Profile</h1>
            <p className="text-gray-600">Manage your administrator account information.</p>
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
          <div className="bg-white rounded-lg shadow-sm border">
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
                     {profile.first_name || 'Admin'} {profile.last_name || 'User'}
                   </h2>
                  <p className="text-gray-600">Administrator</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <p className="text-gray-900">{profile.first_name || 'Not provided'}</p>
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
                    <p className="text-gray-900">{profile.last_name || 'Not provided'}</p>
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
                    <p className="text-gray-900">{profile.email || 'Not provided'}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.contact_number || ''}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter contact number"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.contact_number || 'Not provided'}</p>
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
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
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
          </div>
        )}
      </div>
    </div>
  )
}
