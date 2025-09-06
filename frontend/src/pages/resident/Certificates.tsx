import React, { useState, useEffect } from 'react'
import { documentsAPI } from '../../services/api'
import { X, FileText } from 'lucide-react'
import { RequirementsDisplay } from '../../components/common/RequirementsDisplay'
import { FileUpload } from '../../components/common/FileUpload'

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
  
  // Modal state
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null)
  const [formData, setFormData] = useState({
    purpose: '',
    quantity: 1,
    delivery_method: 'pickup',
    delivery_address: '',
    delivery_notes: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

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

  const handleRequestDocument = (docType: DocumentType) => {
    setSelectedDocumentType(docType)
    setShowRequestForm(true)
    // Reset form data when opening modal
    setFormData({
      purpose: '',
      quantity: 1,
      delivery_method: 'pickup',
      delivery_address: '',
      delivery_notes: ''
    })
    setUploadedFiles([])
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocumentType) return

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('document_type_id', selectedDocumentType.id.toString())
      formDataToSend.append('purpose', formData.purpose)
      formDataToSend.append('quantity', formData.quantity.toString())
      formDataToSend.append('delivery_method', formData.delivery_method)
      formDataToSend.append('delivery_address', formData.delivery_address)
      formDataToSend.append('delivery_notes', formData.delivery_notes)
      
      // Append uploaded files
      uploadedFiles.forEach((file) => {
        formDataToSend.append(`requirement_files`, file)
      })

      const response = await documentsAPI.createDocumentRequest(formDataToSend)
      
      if (response.data.success) {
        alert('Document request submitted successfully!')
        setShowRequestForm(false)
        setSelectedDocumentType(null)
        setUploadedFiles([])
        setFormData({
          purpose: '',
          quantity: 1,
          delivery_method: 'pickup',
          delivery_address: '',
          delivery_notes: ''
        })
        fetchMyRequests()
      }
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to submit request. Please try again.')
    }
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
                      onClick={() => handleRequestDocument(docType)}
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

      {/* Document Request Modal */}
      {showRequestForm && selectedDocumentType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Request {selectedDocumentType.name}</h2>
                    <p className="text-blue-100 text-xs line-clamp-1">{selectedDocumentType.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocumentType(null)}
                  className="text-blue-200 hover:text-white transition-colors duration-200 p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              {/* Document Info Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">Processing</p>
                      <p className="text-sm font-bold text-emerald-900">{selectedDocumentType.processing_days} day{selectedDocumentType.processing_days > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700">Fee</p>
                      <p className="text-sm font-bold text-blue-900">₱{(selectedDocumentType.fee || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {selectedDocumentType.requirements && (
                <RequirementsDisplay 
                  requirements={selectedDocumentType.requirements}
                  uploadedFiles={uploadedFiles}
                  className="mb-4"
                />
              )}
              
              <form onSubmit={handleSubmitRequest} className="space-y-5">
                {/* File Upload Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Upload Required Documents</h3>
                      <p className="text-xs text-gray-600">Drag and drop your files or click to browse</p>
                    </div>
                  </div>
                  <FileUpload
                    onFilesChange={setUploadedFiles}
                    acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
                    maxSize={10} // 10MB
                    multiple={true}
                    className="border-2 border-dashed border-blue-300 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
                    label=""
                    helpText=""
                  />
                </div>

                {/* Form Fields Grid */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                      <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Request Details</h3>
                      <p className="text-xs text-gray-600">Provide additional information for your request</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Purpose Field */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-900 mb-1">
                        Purpose *
                      </label>
                      <textarea
                        value={formData.purpose}
                        onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm"
                        rows={2}
                        placeholder="What is the purpose of this document?"
                        required
                      />
                    </div>
                  
                    {/* Quantity Field */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        required
                      />
                    </div>
                    
                    {/* Delivery Method Field */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
                        Delivery Method *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.delivery_method}
                          onChange={(e) => setFormData({...formData, delivery_method: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-sm"
                        >
                          <option value="pickup">🏢 Pickup at Barangay Hall</option>
                          <option value="email">📧 Email Delivery</option>
                          <option value="mail">📮 Mail Delivery</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Delivery Address (conditional) */}
                {formData.delivery_method !== 'pickup' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="bg-blue-100 p-1.5 rounded-lg">
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-900">Delivery Address</h4>
                        <p className="text-xs text-blue-700">Where should we send your document?</p>
                      </div>
                    </div>
                    <textarea
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm"
                      rows={2}
                      placeholder="Enter complete delivery address"
                      required
                    />
                    <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium">
                        {formData.delivery_method === 'email' 
                          ? '📧 Document will be sent to your registered email address'
                          : '📮 Document will be mailed to the address provided'
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Additional Notes */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="bg-gray-100 p-1.5 rounded-lg">
                      <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Additional Notes</h4>
                      <p className="text-xs text-gray-600">Any special instructions or additional information</p>
                    </div>
                  </div>
                  <textarea
                    value={formData.delivery_notes}
                    onChange={(e) => setFormData({...formData, delivery_notes: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm"
                    rows={2}
                    placeholder="Any special instructions or additional information"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setSelectedDocumentType(null);
                    setUploadedFiles([]);
                    setFormData({
                      purpose: '',
                      quantity: 1,
                      delivery_method: 'pickup',
                      delivery_address: '',
                      delivery_notes: ''
                    });
                  }}
                  className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold border-2 border-gray-200 hover:border-gray-300 shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmitRequest}
                  disabled={uploadedFiles.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all duration-200 font-bold shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-sm text-sm"
                >
                  {uploadedFiles.length === 0 ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Upload Documents First</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Request</span>
                    </div>
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
