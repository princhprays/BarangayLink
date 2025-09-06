import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI, api } from '../../services/api'

interface Request {
  id: number
  type: string
  requester_name: string
  status: string
  created_at: string
  processed_at?: string
  priority: string
  description: string
  purpose?: string
  quantity?: number
  delivery_method?: string
  delivery_address?: string
  delivery_notes?: string
  document_type_name?: string
  requester_email?: string
  requester_phone?: string
}

export const RequestManagement: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [requestDetails, setRequestDetails] = useState<any>(null)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [requirementFiles, setRequirementFiles] = useState<any[]>([])

  const [responseForm, setResponseForm] = useState({
    status: 'approved',
    notes: ''
  })

  const [showFileModal, setShowFileModal] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<{name: string, files: any[]} | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filterType, filterStatus, filterPriority])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        type: filterType === 'all' ? undefined : filterType,
        status: filterStatus === 'all' ? undefined : filterStatus,
        priority: filterPriority === 'all' ? undefined : filterPriority
      }
      
      console.log('Fetching requests with params:', params)
      
      const response = await adminAPI.getAllRequests(params)
      
      if (response.data.success) {
        console.log('Received requests:', response.data.data)
        console.log('Debug info:', response.data.debug_info)
        setRequests(response.data.data || [])
      } else {
        setError(response.data.error || 'Failed to load requests. Please try again later.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequestDetails = async (requestId: number) => {
    try {
      setLoadingDetails(true)
      const response = await adminAPI.getRequestDetails(requestId)
      
      if (response.data.success) {
        setRequestDetails(response.data.data)
        setUploadedFiles(response.data.uploaded_files || [])
        
        // Load requirement files for document requests
        if (response.data.data.type === 'document') {
          try {
            const filesResponse = await adminAPI.getDocumentRequestFiles(requestId)
            if (filesResponse.data.success) {
              setRequirementFiles(filesResponse.data.data || [])
            }
          } catch (err) {
            console.error('Failed to load requirement files:', err)
            setRequirementFiles([])
          }
        } else {
          setRequirementFiles([])
        }
      } else {
        setError(response.data.error || 'Failed to load request details.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load request details.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleRequestResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return
    
    // Validate rejection reason if rejecting
    if (responseForm.status === 'rejected' && !responseForm.notes.trim()) {
      setError('Please provide a reason for rejection.')
      return
    }
    
    try {
      let endpoint = ''
      let data = {}
      
      switch (selectedRequest.type) {
        case 'document':
          if (responseForm.status === 'approved') {
            endpoint = `/documents/requests/${selectedRequest.id}/approve`
            data = { processing_notes: responseForm.notes }
          } else if (responseForm.status === 'rejected') {
            endpoint = `/documents/requests/${selectedRequest.id}/reject`
            data = { rejection_reason: responseForm.notes }
          }
          break
        case 'sos':
          // Handle SOS request approval/rejection
          endpoint = `/sos/requests/${selectedRequest.id}/respond`
          data = { 
            status: responseForm.status,
            notes: responseForm.notes 
          }
          break
        case 'relocation':
          if (responseForm.status === 'approved') {
            endpoint = `/relocation/requests/${selectedRequest.id}/approve`
            data = { notes: responseForm.notes }
          } else if (responseForm.status === 'rejected') {
            endpoint = `/relocation/requests/${selectedRequest.id}/reject`
            data = { notes: responseForm.notes }
          }
          break
        case 'item':
          if (responseForm.status === 'approved') {
            endpoint = `/marketplace/requests/${selectedRequest.id}/approve`
            data = { notes: responseForm.notes }
          } else if (responseForm.status === 'rejected') {
            endpoint = `/marketplace/requests/${selectedRequest.id}/reject`
            data = { rejection_reason: responseForm.notes }
          }
          break
      }
      
      if (endpoint) {
        const response = await api.post(endpoint, data)
        if (response.data.success) {
          setShowModal(false)
          setSelectedRequest(null)
          setRequestDetails(null)
          setUploadedFiles([])
          setRequirementFiles([])
          setResponseForm({ status: 'approved', notes: '' })
          fetchRequests()
        } else {
          setError(response.data.error || 'Failed to update request')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update request')
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || request.type === filterType
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800'
      case 'benefit': return 'bg-green-100 text-green-800'
      case 'item': return 'bg-purple-100 text-purple-800'
      case 'relocation': return 'bg-orange-100 text-orange-800'
      case 'sos': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-200 text-red-900 border border-red-300'
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Management</h1>
          <p className="text-gray-600">Manage and process all types of requests from residents.</p>
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
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
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
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
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
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by requester or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="document">Document</option>
                <option value="benefit">Benefit</option>
                <option value="item">Item</option>
                <option value="relocation">Relocation</option>
                <option value="sos">SOS</option>
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterStatus('all')
                  setFilterPriority('all')
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No requests at the moment.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                    </h3>
                    <p className="text-sm text-gray-600">From: {request.requester_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                      {request.type}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-900 mt-1">{request.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Requested:</span>
                    <p className="font-medium">{formatDate(request.created_at)}</p>
                  </div>
                  {request.processed_at && (
                    <div>
                      <span className="text-gray-500">Processed:</span>
                      <p className="font-medium">{formatDate(request.processed_at)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <p className="font-medium">{request.priority}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setShowModal(true)
                      fetchRequestDetails(request.id)
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Process Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modern Enhanced Response Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              {/* Modern Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                    Process {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)} Request
                  </h3>
                      <p className="text-blue-100 text-sm">Review and make a decision on this request</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedRequest(null)
                      setRequestDetails(null)
                      setUploadedFiles([])
                      setRequirementFiles([])
                    }}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="p-6">

                {loadingDetails ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 font-medium">Loading request details...</p>
                      </div>
                  </div>
                ) : requestDetails ? (
                  <div className="space-y-6">
                      {/* Modern Request Information Card */}
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                        <div className="flex items-center mb-6">
                          <div className="bg-blue-100 p-3 rounded-lg mr-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">Request Information</h4>
                            <p className="text-gray-600">Review the requester's details and request information</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-700">Requester Name</span>
                              </div>
                              <p className="text-gray-900 font-medium">{requestDetails.requester_name}</p>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-700">Email Address</span>
                              </div>
                              <p className="text-gray-900 font-medium">{requestDetails.requester_email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                              </div>
                              <p className="text-gray-900 font-medium">{requestDetails.requester_phone}</p>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-700">Request Date</span>
                              </div>
                              <p className="text-gray-900 font-medium">{formatDate(requestDetails.created_at)}</p>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Document Request Specific Details */}
                    {requestDetails.type === 'document' && (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Document Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Document Type:</span>
                              <p className="text-gray-900">{requestDetails.document_type_name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Quantity:</span>
                              <p className="text-gray-900">{requestDetails.quantity}</p>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-sm font-medium text-gray-500">Purpose:</span>
                              <p className="text-gray-900 mt-1">{requestDetails.purpose}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Delivery Method:</span>
                              <p className="text-gray-900 capitalize">{requestDetails.delivery_method}</p>
                            </div>
                            {requestDetails.delivery_address && (
                              <div className="md:col-span-2">
                                <span className="text-sm font-medium text-gray-500">Delivery Address:</span>
                                <p className="text-gray-900 mt-1">{requestDetails.delivery_address}</p>
                              </div>
                            )}
                            {requestDetails.delivery_notes && (
                              <div className="md:col-span-2">
                                <span className="text-sm font-medium text-gray-500">Delivery Notes:</span>
                                <p className="text-gray-900 mt-1">{requestDetails.delivery_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Document Requirements */}
                        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                          <div className="flex items-center mb-4">
                            <div className="bg-amber-100 p-3 rounded-lg mr-4">
                              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">Required Documents</h4>
                              <p className="text-gray-600 text-sm">Click on each requirement to view uploaded files</p>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border border-amber-100">
                            <div className="space-y-3">
                              {/* Valid ID Requirement */}
                              <div 
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                                onClick={() => {
                                  const filesToShow = requestDetails.type === 'document' ? requirementFiles : uploadedFiles;
                                  if (filesToShow.length > 0) {
                                    setSelectedRequirement({ name: 'Valid ID', files: filesToShow });
                                    setShowFileModal(true);
                                  } else {
                                    alert('No files uploaded for this request');
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  <div className="bg-blue-500 w-2 h-2 rounded-full mr-3 flex-shrink-0"></div>
                                  <span className="font-medium text-gray-800 group-hover:text-blue-800">Valid ID</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {uploadedFiles.length > 0 ? (
                                    <>
                                      <span className="text-green-600 text-sm font-medium">✓ {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded</span>
                                      <svg className="w-4 h-4 text-blue-500 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-red-600 text-sm font-medium">✗ No files</span>
                                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Request Letter Requirement */}
                              <div 
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                                onClick={() => {
                                  const filesToShow = requestDetails.type === 'document' ? requirementFiles : uploadedFiles;
                                  if (filesToShow.length > 0) {
                                    setSelectedRequirement({ name: 'Request Letter', files: filesToShow });
                                    setShowFileModal(true);
                                  } else {
                                    alert('No files uploaded for this request');
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  <div className="bg-blue-500 w-2 h-2 rounded-full mr-3 flex-shrink-0"></div>
                                  <span className="font-medium text-gray-800 group-hover:text-blue-800">Request Letter</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {uploadedFiles.length > 0 ? (
                                    <>
                                      <span className="text-green-600 text-sm font-medium">✓ {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded</span>
                                      <svg className="w-4 h-4 text-blue-500 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-red-600 text-sm font-medium">✗ No files</span>
                                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded Requirements */}
                        {(() => {
                          const filesToShow = requestDetails.type === 'document' ? requirementFiles : uploadedFiles;
                          return filesToShow.length > 0 && (
                            <div className="bg-amber-50 rounded-lg p-4">
                              <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Requirements</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filesToShow.map((file, index) => (
                                <div key={index} className="bg-white rounded-lg p-3 border border-amber-200">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-amber-100 p-2 rounded-lg">
                                      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                                      <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                    <a
                                      href={file.file_url || file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      View
                                    </a>
                                  </div>
                                </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                      {/* Modern Decision Form */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 rounded-t-xl border-b border-slate-200">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">Admin Decision</h4>
                              <p className="text-gray-600 text-sm">Make your decision and provide any necessary notes</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <form onSubmit={handleRequestResponse} className="space-y-6">
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Decision *
                              </label>
                              <div className="relative">
                          <select
                            required
                            value={responseForm.status}
                            onChange={(e) => setResponseForm({...responseForm, status: e.target.value})}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                          >
                                  <option value="approved">✅ Approve & Generate Document</option>
                                  <option value="rejected">❌ Reject Request</option>
                          </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                        </div>
                        
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {responseForm.status === 'rejected' ? (
                                  <>
                                    <span className="text-red-600">Rejection Reason *</span>
                                    <span className="text-gray-500 text-xs ml-2">Required for rejections</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-gray-700">Notes</span>
                                    <span className="text-gray-500 text-xs ml-2">Optional</span>
                                  </>
                                )}
                              </label>
                          <textarea
                                required={responseForm.status === 'rejected'}
                            value={responseForm.notes}
                                onChange={(e) => {
                                  setResponseForm({...responseForm, notes: e.target.value})
                                  if (error) setError(null) // Clear error when user starts typing
                                }}
                            rows={4}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                                  responseForm.status === 'rejected' 
                                    ? 'border-red-200 focus:border-red-500 focus:ring-red-200' 
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                                }`}
                                placeholder={responseForm.status === 'rejected' ? 'Please provide a detailed reason for rejection...' : 'Add any notes about your decision (optional)...'}
                          />
                        </div>
                        
                            <div className="flex space-x-4 pt-6 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModal(false)
                              setSelectedRequest(null)
                              setRequestDetails(null)
                              setUploadedFiles([])
                            }}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                                className={`flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium ${
                                  responseForm.status === 'approved'
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-200'
                                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-200'
                                }`}
                              >
                                {responseForm.status === 'approved' ? '✅ Approve Request' : '❌ Reject Request'}
                          </button>
                        </div>
                      </form>
                        </div>
                    </div>
                  </div>
                ) : (
                    <div className="text-center py-12">
                      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Details</h3>
                        <p className="text-red-600">Unable to load request details. Please try again.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Viewer Modal */}
        {showFileModal && selectedRequirement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedRequirement.name} Files
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {selectedRequirement.files.length} file{selectedRequirement.files.length !== 1 ? 's' : ''} uploaded
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowFileModal(false)
                      setSelectedRequirement(null)
                    }}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedRequirement.files.map((file, index) => (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{file.original_filename || file.filename}</p>
                              <p className="text-xs text-gray-500">
                                {file.file_size_mb ? `${file.file_size_mb} MB` : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                              </p>
                              {file.file_type && (
                                <p className="text-xs text-blue-600 font-medium">{file.file_type}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <a
                              href={file.file_url || file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View File
                            </a>
                            
                            <a
                              href={file.file_url || file.url}
                              download={file.original_filename || file.filename}
                              className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedRequirement.files.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Files Found</h3>
                        <p className="text-gray-600">No files were uploaded for this requirement.</p>
                      </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
