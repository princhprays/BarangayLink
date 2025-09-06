import React, { useState, useEffect } from 'react'
import { documentsAPI } from '../../services/api'

interface DocumentType {
  id: number
  name: string
  description: string
  requirements: string
  processing_days: number
  fee: number
  validity_days: number
  is_active: boolean
}

interface DocumentRequest {
  id: number
  document_type_id: number
  document_type_name: string
  purpose: string
  quantity: number
  status: string
  created_at: string
  processed_at?: string
  rejection_reason?: string
}

export const Certificates: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [myRequests, setMyRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'my-requests'>('available')

  useEffect(() => {
    fetchDocumentTypes()
    fetchMyRequests()
  }, [])

  const fetchDocumentTypes = async () => {
    try {
      const response = await documentsAPI.getDocumentTypes()
      // API returns {success: true, data: [...]}
      setDocumentTypes(response.data.data || [])
    } catch (err: any) {
      console.error('Error fetching document types:', err)
      setError(err.response?.data?.message || 'Failed to fetch document types')
      setDocumentTypes([]) // Ensure it's always an array
    }
  }

  const fetchMyRequests = async () => {
    try {
      const response = await documentsAPI.getMyDocumentRequests()
      // API returns {success: true, data: [...]}
      setMyRequests(response.data.data || [])
    } catch (err: any) {
      console.error('Error fetching my requests:', err)
      setError(err.response?.data?.message || 'Failed to fetch requests')
      setMyRequests([]) // Ensure it's always an array
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificates & Documents</h1>
        <p className="text-gray-600">Request official documents and certificates from the barangay.</p>
      </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Documents
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Requests ({Array.isArray(myRequests) ? myRequests.length : 0})
            </button>
          </nav>
        </div>

        {/* Available Documents Tab */}
        {activeTab === 'available' && (
          <div>
            {!Array.isArray(documentTypes) || documentTypes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No available documents</h3>
                <p className="mt-1 text-sm text-gray-500">There are currently no document types available for request.</p>
                <div className="mt-6">
                  <p className="text-sm text-gray-600">
                    Please contact the barangay administration to add document types, or check back later.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documentTypes.map(docType => (
                  <div key={docType.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{docType.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ₱{docType.fee}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{docType.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Requirements:</h4>
                        <p className="text-sm text-gray-600">
                          {(() => {
                            if (!docType.requirements) return 'No specific requirements'
                            
                            try {
                              if (typeof docType.requirements === 'string') {
                                if (docType.requirements.startsWith('[')) {
                                  const parsed = JSON.parse(docType.requirements)
                                  return Array.isArray(parsed) ? parsed.join(', ') : docType.requirements
                                }
                                return docType.requirements
                              }
                              return docType.requirements
                            } catch {
                              return docType.requirements
                            }
                          })()}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Processing Time:</h4>
                        <p className="text-sm text-gray-600">{docType.processing_days} business days</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Validity:</h4>
                        <p className="text-sm text-gray-600">{docType.validity_days} days</p>
                      </div>
                    </div>

                    <button
                      onClick={() => window.location.href = '/resident/document-requests'}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Request Document
                    </button>
                  </div>
                ))}
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Information</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• All requests are subject to approval by barangay officials</li>
                    <li>• Processing times may vary depending on document complexity</li>
                    <li>• Fees are non-refundable once processing begins</li>
                    <li>• You will be notified via email when your document is ready</li>
                    <li>• Documents can be picked up at the barangay hall during office hours</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div>
            {!Array.isArray(myRequests) || myRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No document requests</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't made any document requests yet.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('available')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Available Documents
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(myRequests) && myRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.document_type_name}</h3>
                        <p className="text-sm text-gray-600">Purpose: {request.purpose}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <p className="font-medium">{request.quantity}</p>
                      </div>
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
                      {request.rejection_reason && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Reason:</span>
                          <p className="font-medium text-red-600">{request.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {request.status === 'completed' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          Your document is ready for pickup at the barangay hall.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  )
}
