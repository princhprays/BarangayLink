import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'

interface SOSRequest {
  id: number
  emergency_type: string
  description: string
  location: string
  status: string
  created_at: string
  response_time?: string
  response_notes?: string
  requester_name: string
  contact_phone?: string
}

interface RelocationRequest {
  id: number
  from_barangay_name: string
  to_barangay_name: string
  new_address: string
  reason: string
  status: string
  created_at: string
  from_barangay_approved: boolean
  to_barangay_approved: boolean
  requester_name: string
}

export const AdminSOSRelocation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sos' | 'relocation'>('sos')
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([])
  const [relocationRequests, setRelocationRequests] = useState<RelocationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSOS, setSelectedSOS] = useState<SOSRequest | null>(null)
  const [selectedRelocation, setSelectedRelocation] = useState<RelocationRequest | null>(null)
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [showRelocationModal, setShowRelocationModal] = useState(false)

  // SOS Response Form
  const [sosResponse, setSosResponse] = useState({
    response_notes: '',
    status: 'responded'
  })

  // Relocation Approval Form
  const [relocationApproval, setRelocationApproval] = useState({
    approved: true,
    notes: ''
  })

  useEffect(() => {
    fetchSOSRequests()
    fetchRelocationRequests()
  }, [])

  const fetchSOSRequests = async () => {
    try {
      const response = await api.get('/sos/requests')
      if (response.data.success) {
        setSosRequests(response.data.data || [])
      } else {
        setError(response.data.message || 'Failed to load SOS/Relocation data.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load SOS/Relocation data.')
    }
  }

  const fetchRelocationRequests = async () => {
    try {
      const response = await api.get('/relocation/requests')
      if (response.data.success) {
        setRelocationRequests(response.data.data || [])
      } else {
        setError(response.data.message || 'Failed to load SOS/Relocation data.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load SOS/Relocation data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSOSResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedSOS) {
        const response = await api.post(`/sos/requests/${selectedSOS.id}/respond`, sosResponse)
        if (response.data.success) {
          setShowSOSModal(false)
          setSelectedSOS(null)
          setSosResponse({ response_notes: '', status: 'responded' })
          fetchSOSRequests()
        } else {
          setError(response.data.message || 'Failed to update SOS request')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update SOS request')
    }
  }

  const handleRelocationApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedRelocation) {
        const endpoint = relocationApproval.approved ? 'approve' : 'reject'
        const response = await api.post(`/relocation/requests/${selectedRelocation.id}/${endpoint}`, {
          notes: relocationApproval.notes
        })
        if (response.data.success) {
          setShowRelocationModal(false)
          setSelectedRelocation(null)
          setRelocationApproval({ approved: true, notes: '' })
          fetchRelocationRequests()
        } else {
          setError(response.data.message || 'Failed to update relocation request')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update relocation request')
    }
  }

  const getEmergencyTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800'
      case 'fire': return 'bg-orange-100 text-orange-800'
      case 'security': return 'bg-purple-100 text-purple-800'
      case 'natural_disaster': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'responded': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SOS & Relocation Management</h1>
          <p className="text-gray-600">Manage emergency SOS requests and relocation applications.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active SOS</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sosRequests.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Responded SOS</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sosRequests.filter(s => s.status === 'responded').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Relocations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {relocationRequests.filter(r => r.status === 'pending').length}
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
                <p className="text-sm font-medium text-gray-500">Approved Relocations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {relocationRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('sos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sos'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Emergency SOS ({sosRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('relocation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'relocation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Relocation Requests ({relocationRequests.length})
            </button>
          </nav>
        </div>

        {/* SOS Tab */}
        {activeTab === 'sos' && (
          <div>
            {sosRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No SOS requests</h3>
                <p className="mt-1 text-sm text-gray-500">No active SOS alerts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sosRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Emergency SOS Request</h3>
                        <p className="text-sm text-gray-600">From: {request.requester_name}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Emergency Type:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmergencyTypeColor(request.emergency_type)}`}>
                          {request.emergency_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Sent:</span>
                        <p className="font-medium">{formatDate(request.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium">{request.location}</p>
                      </div>
                      {request.contact_phone && (
                        <div>
                          <span className="text-gray-500">Contact:</span>
                          <p className="font-medium">{request.contact_phone}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-gray-500">Description:</span>
                      <p className="text-gray-900 mt-1">{request.description}</p>
                    </div>

                    {request.response_notes && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Response:</strong> {request.response_notes}
                        </p>
                      </div>
                    )}

                    {request.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedSOS(request)
                          setShowSOSModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Respond to SOS
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Relocation Tab */}
        {activeTab === 'relocation' && (
          <div>
            {relocationRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No relocation requests</h3>
                <p className="mt-1 text-sm text-gray-500">No relocation requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {relocationRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Relocation Request</h3>
                        <p className="text-sm text-gray-600">From: {request.requester_name}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">From:</span>
                        <p className="font-medium">{request.from_barangay_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">To:</span>
                        <p className="font-medium">{request.to_barangay_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">New Address:</span>
                        <p className="font-medium">{request.new_address}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Requested:</span>
                        <p className="font-medium">{formatDate(request.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-gray-500">Reason:</span>
                      <p className="text-gray-900 mt-1">{request.reason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">From Barangay:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.from_barangay_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.from_barangay_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">To Barangay:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.to_barangay_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.to_barangay_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedRelocation(request)
                          setShowRelocationModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Review Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOS Response Modal */}
        {showSOSModal && selectedSOS && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Respond to SOS</h3>
                <form onSubmit={handleSOSResponse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Response Status *</label>
                    <select
                      required
                      value={sosResponse.status}
                      onChange={(e) => setSosResponse({...sosResponse, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="responded">Responded</option>
                      <option value="resolved">Resolved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Response Notes *</label>
                    <textarea
                      required
                      value={sosResponse.response_notes}
                      onChange={(e) => setSosResponse({...sosResponse, response_notes: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Describe your response actions..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSOSModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Submit Response
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Relocation Approval Modal */}
        {showRelocationModal && selectedRelocation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Relocation Request</h3>
                <form onSubmit={handleRelocationApproval} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Decision *</label>
                    <select
                      required
                      value={relocationApproval.approved ? 'approved' : 'rejected'}
                      onChange={(e) => setRelocationApproval({...relocationApproval, approved: e.target.value === 'approved'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={relocationApproval.notes}
                      onChange={(e) => setRelocationApproval({...relocationApproval, notes: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about your decision..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowRelocationModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Submit Decision
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
