import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
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
}

export const SOSRelocation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sos' | 'relocation'>('sos')
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([])
  const [relocationRequests, setRelocationRequests] = useState<RelocationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [showRelocationModal, setShowRelocationModal] = useState(false)

  // SOS Form state
  const [sosForm, setSosForm] = useState({
    emergency_type: '',
    description: '',
    location: '',
    contact_phone: '',
    emergency_contact: '',
    emergency_contact_phone: ''
  })

  // Relocation Form state
  const [relocationForm, setRelocationForm] = useState({
    to_barangay_id: '',
    new_address: '',
    reason: ''
  })

  useEffect(() => {
    fetchSOSRequests()
    fetchRelocationRequests()
  }, [])

  const fetchSOSRequests = async () => {
    try {
      const response = await api.get('/sos/requests')
      if (response.data.success) {
        setSosRequests(response.data.data)
      } else {
        setError(response.data.message || 'Failed to fetch SOS requests')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch SOS requests')
    }
  }

  const fetchRelocationRequests = async () => {
    try {
      const response = await api.get('/relocation/requests')
      if (response.data.success) {
        setRelocationRequests(response.data.data)
      } else {
        setError(response.data.message || 'Failed to fetch relocation requests')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch relocation requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/sos/requests', sosForm)
      if (response.data.success) {
        setShowSOSModal(false)
        setSosForm({
          emergency_type: '',
          description: '',
          location: '',
          contact_phone: '',
          emergency_contact: '',
          emergency_contact_phone: ''
        })
        // Refresh SOS requests
        fetchSOSRequests()
      } else {
        setError(response.data.message || 'Failed to submit SOS request')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit SOS request')
    }
  }

  const handleRelocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/relocation/requests', relocationForm)
      if (response.data.success) {
        setShowRelocationModal(false)
        setRelocationForm({
          to_barangay_id: '',
          new_address: '',
          reason: ''
        })
        // Refresh relocation requests
        fetchRelocationRequests()
      } else {
        setError(response.data.message || 'Failed to submit relocation request')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit relocation request')
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
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SOS & Relocation</h1>
        <p className="text-gray-600">Emergency assistance and relocation services.</p>
      </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Emergency SOS Alert */}
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">Emergency SOS</h3>
          </div>
          <p className="mt-1 text-sm text-red-700">
            For immediate emergency assistance, use the SOS button below. This will alert barangay officials immediately.
          </p>
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
            <div className="mb-6">
              <button
                onClick={() => setShowSOSModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Send SOS Alert
              </button>
            </div>

            {sosRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No SOS requests</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't sent any SOS alerts yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sosRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Emergency SOS Request</h3>
                        <p className="text-sm text-gray-600">Location: {request.location}</p>
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
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-gray-500">Description:</span>
                      <p className="text-gray-900 mt-1">{request.description}</p>
                    </div>

                    {request.response_notes && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Response:</strong> {request.response_notes}
                        </p>
                      </div>
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
            <div className="mb-6">
              <button
                onClick={() => setShowRelocationModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Request Relocation
              </button>
            </div>

            {relocationRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No relocation requests</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't made any relocation requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {relocationRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Relocation Request</h3>
                        <p className="text-sm text-gray-600">
                          From {request.from_barangay_name} to {request.to_barangay_name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
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

                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOS Modal */}
        {showSOSModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency SOS Alert</h3>
                <form onSubmit={handleSOSSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type *</label>
                    <select
                      required
                      value={sosForm.emergency_type}
                      onChange={(e) => setSosForm({...sosForm, emergency_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select emergency type</option>
                      <option value="medical">Medical Emergency</option>
                      <option value="fire">Fire Emergency</option>
                      <option value="security">Security Threat</option>
                      <option value="natural_disaster">Natural Disaster</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      required
                      value={sosForm.description}
                      onChange={(e) => setSosForm({...sosForm, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Describe the emergency situation..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={sosForm.location}
                      onChange={(e) => setSosForm({...sosForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your current location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={sosForm.contact_phone}
                      onChange={(e) => setSosForm({...sosForm, contact_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your phone number"
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
                      Send SOS Alert
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Relocation Modal */}
        {showRelocationModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Request Relocation</h3>
                <form onSubmit={handleRelocationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Barangay *</label>
                    <select
                      required
                      value={relocationForm.to_barangay_id}
                      onChange={(e) => setRelocationForm({...relocationForm, to_barangay_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select barangay</option>
                      <option value="1">Barangay A</option>
                      <option value="2">Barangay B</option>
                      <option value="3">Barangay C</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Address *</label>
                    <textarea
                      required
                      value={relocationForm.new_address}
                      onChange={(e) => setRelocationForm({...relocationForm, new_address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your new address in the destination barangay"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Relocation</label>
                    <textarea
                      value={relocationForm.reason}
                      onChange={(e) => setRelocationForm({...relocationForm, reason: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Why are you relocating?"
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
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
