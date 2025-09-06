import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Avatar } from '../../components/Avatar'
import { formatUserName } from '../../utils/nameUtils'
import { useApiState } from '../../hooks/useApiState'
import { apiCall, getStatusColor, formatDate } from '../../utils/apiUtils'
import { ErrorMessage } from '../../components/common/ErrorMessage'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  contact_number?: string
  complete_address?: string
  role: string
  status: string
  created_at: string
  last_login?: string
  profile_picture_url?: string
  province?: { name: string }
  municipality?: { name: string }
  barangay?: { name: string }
  profile: {
    contact_number?: string
    address?: string
    house_number?: string
    street?: string
    purok?: string
    sitio?: string
  }
}

export const ManageUsers: React.FC = () => {
  const { data: users, isLoading, error, setError, setData } = useApiState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Helper function to construct address from hierarchical fields
  const constructAddress = (user: User): string => {
    // First try complete_address from User model
    if (user.complete_address) {
      return user.complete_address
    }
    
    // Then try address from profile
    if (user.profile?.address) {
      return user.profile.address
    }
    
    // Finally, construct from Philippine administrative hierarchy: Barangay, Municipality, Province
    const addressParts = []
    if (user.barangay?.name) addressParts.push(user.barangay.name)
    if (user.municipality?.name) addressParts.push(user.municipality.name)
    if (user.province?.name) addressParts.push(user.province.name)
    
    if (addressParts.length > 0) {
      return addressParts.join(', ')
    }
    
    return 'N/A'
  }

  const [actionForm, setActionForm] = useState({
    action: 'suspend',
    reason: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [filterRole, filterStatus])

  const fetchUsers = async () => {
    await apiCall<User[]>(
      () => adminAPI.getAllUsers({
        role: filterRole === 'all' ? undefined : filterRole,
        status: filterStatus === 'all' ? undefined : filterStatus
      }),
      (data) => setData(data || []),
      (error) => setError(error)
    )
  }

  const handleUserAction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // This would be replaced with actual API call
      console.log('User Action:', { userId: selectedUser?.id, ...actionForm })
      setShowModal(false)
      setSelectedUser(null)
      setActionForm({ action: 'suspend', reason: '' })
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'resident': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Using standardized utilities for status colors and date formatting

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage all users in the system.</p>
        </div>

        {error && (
          <ErrorMessage error={error} onRetry={fetchUsers} />
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Residents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users?.filter(u => u.role === 'resident').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users?.filter(u => u.role === 'admin').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users?.filter(u => u.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="resident">Resident</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterRole('all')
                  setFilterStatus('all')
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : (filterRole as string) === 'admin' ? 'No admin accounts created yet.' : 'There are no users in the system.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <Avatar
                      src={user.profile_picture_url}
                      name={formatUserName(user, 'No Profile')}
                      size="md"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'No Name'}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Contact:</span>
                    <p className="font-medium">{user.contact_number || user.profile?.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="font-medium">{constructAddress(user)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                {user.last_login && (
                  <div className="mb-4">
                    <span className="text-gray-500">Last Login:</span>
                    <p className="font-medium">{formatDate(user.last_login)}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setShowModal(true)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Manage User
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setShowDetailsModal(true)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Action Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Manage User: {selectedUser.first_name && selectedUser.last_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'No Name'}
                </h3>
                <form onSubmit={handleUserAction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                    <select
                      required
                      value={actionForm.action}
                      onChange={(e) => setActionForm({...actionForm, action: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="suspend">Suspend User</option>
                      <option value="activate">Activate User</option>
                      <option value="delete">Delete User</option>
                      <option value="change_role">Change Role</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <textarea
                      value={actionForm.reason}
                      onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Reason for this action..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Submit Action
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={selectedUser.profile_picture_url}
                      name={formatUserName(selectedUser, 'No Profile')}
                      size="xl"
                    />
                    <h3 className="text-2xl font-bold text-gray-900">
                      User Details: {selectedUser.first_name && selectedUser.last_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'No Name'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Role:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                          {selectedUser.role}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Joined:</span>
                        <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
                      </div>
                      {selectedUser.last_login && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Last Login:</span>
                          <p className="text-gray-900">{formatDate(selectedUser.last_login)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h4>
                    {selectedUser.profile ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Full Name:</span>
                          <p className="text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Contact Number:</span>
                          <p className="text-gray-900">{selectedUser.contact_number || selectedUser.profile?.contact_number || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Address:</span>
                          <p className="text-gray-900">{constructAddress(selectedUser)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No profile information available</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setShowModal(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Manage User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
