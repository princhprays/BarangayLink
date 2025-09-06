import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, User, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface Resident {
  id: number
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  phone_number?: string
  status: string
  created_at: string
  valid_id_path?: string
  selfie_with_id_path?: string
  profile_picture_url?: string
  profile?: {
    birth_date?: string
    gender?: string
    civil_status?: string
    occupation?: string
    house_number?: string
    street?: string
    purok?: string
    sitio?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
  }
}

export const Verifications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionCategory, setRejectionCategory] = useState('other')
  
  const queryClient = useQueryClient()

  // Fetch pending residents
  const { data: residentsData, isLoading } = useQuery({
    queryKey: ['pending-residents', searchTerm],
    queryFn: async () => {
      const response = await api.get('/admin/residents/pending', {
        params: { search: searchTerm }
      })
      return response.data
    }
  })

  // Approve resident mutation
  const approveMutation = useMutation(
    async (residentId: number) => {
      const response = await api.post(`/admin/residents/${residentId}/approve`)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Resident approved successfully')
        queryClient.invalidateQueries({ queryKey: ['pending-residents'] })
        setShowDetails(false)
        setShowApproveModal(false)
        setSelectedResident(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to approve resident')
      }
    }
  )

  // Reject resident mutation
  const rejectMutation = useMutation(
    async ({ residentId, reason, category }: { residentId: number; reason: string; category: string }) => {
      const response = await api.post(`/admin/residents/${residentId}/reject`, {
        reason,
        category
      })
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Resident rejected')
        queryClient.invalidateQueries({ queryKey: ['pending-residents'] })
        setShowDetails(false)
        setShowRejectModal(false)
        setSelectedResident(null)
        setRejectionReason('')
        setRejectionCategory('other')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to reject resident')
      }
    }
  )

  const handleApprove = (resident: Resident) => {
    setSelectedResident(resident)
    setShowApproveModal(true)
  }

  const confirmApprove = () => {
    if (selectedResident) {
      approveMutation.mutate(selectedResident.id)
    }
  }

  const handleReject = (resident: Resident) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    
    rejectMutation.mutate({
      residentId: resident.id,
      reason: rejectionReason,
      category: rejectionCategory
    })
  }

  const residents = residentsData?.residents || []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resident Verifications</h1>
        <div className="text-sm text-gray-500">
          {residentsData?.pagination?.total || 0} pending residents
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search residents by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Residents List */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading residents...</p>
          </div>
        ) : residents.length === 0 ? (
          <div className="card text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pending residents found</p>
          </div>
        ) : (
          residents.map((resident: Resident) => (
            <div key={resident.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {resident.first_name} {resident.last_name}
                      {resident.middle_name && ` ${resident.middle_name}`}
                    </h3>
                    <p className="text-gray-600">{resident.email}</p>
                    <p className="text-sm text-gray-500">
                      Registered: {new Date(resident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* File Status Indicators */}
                  <div className="flex items-center space-x-1 mr-4">
                    {resident.valid_id_path && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ID ✓
                      </span>
                    )}
                    {resident.selfie_with_id_path && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Selfie ✓
                      </span>
                    )}
                    {!resident.valid_id_path && !resident.selfie_with_id_path && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        No Files
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedResident(resident)
                      setShowDetails(true)
                    }}
                    className="btn btn-outline flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  
                  <button
                    onClick={() => handleApprove(resident)}
                    disabled={approveMutation.isLoading}
                    className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedResident(resident)
                      setShowRejectModal(true)
                    }}
                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resident Details Modal */}
      {showDetails && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Resident Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetails(false)
                    setSelectedResident(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Registration Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Registration Information</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Required Information:</strong> The following information was provided during registration and is required for verification.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-gray-900">
                        {selectedResident.first_name} {selectedResident.last_name}
                        {selectedResident.middle_name && ` ${selectedResident.middle_name}`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <p className="text-gray-900">{selectedResident.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="text-gray-900">{selectedResident.phone_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Status</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Approval
                      </span>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                      <p className="text-gray-900">{new Date(selectedResident.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information (Optional) */}
                {selectedResident.profile && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> The following information is optional and may be completed by users after registration.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                        <p className="text-gray-900">
                          {selectedResident.profile.birth_date 
                            ? new Date(selectedResident.profile.birth_date).toLocaleDateString()
                            : 'Not provided'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <p className="text-gray-900">{selectedResident.profile.gender || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Civil Status</label>
                        <p className="text-gray-900">{selectedResident.profile.civil_status || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Occupation</label>
                        <p className="text-gray-900">{selectedResident.profile.occupation || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-gray-900">
                          {selectedResident.profile.house_number && selectedResident.profile.street
                            ? `${selectedResident.profile.house_number} ${selectedResident.profile.street}`
                            : 'Not provided'
                          }
                          {selectedResident.profile.purok && `, Purok ${selectedResident.profile.purok}`}
                          {selectedResident.profile.sitio && `, Sitio ${selectedResident.profile.sitio}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Valid ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid ID</label>
                      {selectedResident.valid_id_path ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <img
                            src={`http://localhost:5000/uploads/temp/${selectedResident.valid_id_path}`}
                            alt="Valid ID"
                            className="w-full h-48 object-contain rounded-lg bg-gray-50"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'block'
                              }
                            }}
                          />
                          <div style={{ display: 'none' }} className="text-center py-8 text-gray-500">
                            <p>❌ File not found</p>
                            <p className="text-sm">Path: {selectedResident.valid_id_path}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                          <p>No valid ID uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Selfie with ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Selfie with ID</label>
                      {selectedResident.selfie_with_id_path ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <img
                            src={`http://localhost:5000/uploads/temp/${selectedResident.selfie_with_id_path}`}
                            alt="Selfie with ID"
                            className="w-full h-48 object-contain rounded-lg bg-gray-50"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'block'
                              }
                            }}
                          />
                          <div style={{ display: 'none' }} className="text-center py-8 text-gray-500">
                            <p>❌ File not found</p>
                            <p className="text-sm">Path: {selectedResident.selfie_with_id_path}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                          <p>No selfie uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-6">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowDetails(false)
                        setSelectedResident(null)
                      }}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApprove(selectedResident)}
                      disabled={approveMutation.isLoading}
                      className="btn bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Reject Resident
                </h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedResident(null)
                    setRejectionReason('')
                    setRejectionCategory('other')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-2">
                    Rejecting: <strong>{selectedResident.first_name} {selectedResident.last_name}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Please provide a reason for rejection. This will be sent to the user.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Category
                  </label>
                  <select
                    value={rejectionCategory}
                    onChange={(e) => setRejectionCategory(e.target.value)}
                    className="input w-full"
                  >
                    <option value="invalid_documents">Invalid Documents</option>
                    <option value="incomplete_information">Incomplete Information</option>
                    <option value="duplicate_account">Duplicate Account</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                    className="input w-full h-24 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelectedResident(null)
                      setRejectionReason('')
                      setRejectionCategory('other')
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedResident)}
                    disabled={!rejectionReason.trim() || rejectMutation.isLoading}
                    className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejectMutation.isLoading ? 'Rejecting...' : 'Reject Resident'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApproveModal && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Approve Resident
                </h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to approve{' '}
                  <strong>{selectedResident.first_name} {selectedResident.last_name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This will give them full access to the BarangayLink platform and send them a confirmation email.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowApproveModal(false)
                    setSelectedResident(null)
                  }}
                  className="btn btn-outline px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={approveMutation.isLoading}
                  className="btn bg-green-600 text-white hover:bg-green-700 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {approveMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve Resident</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
