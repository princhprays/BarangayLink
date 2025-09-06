import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Upload, X, FileText } from 'lucide-react';

interface DocumentType {
  id: number;
  name: string;
  description: string;
  requirements: string;
  processing_days: number;
  fee: number;
  is_active: boolean;
}

interface DocumentRequest {
  id: number;
  document_type_id: number;
  document_type_name: string;
  purpose: string;
  quantity: number;
  status: string;
  rejection_reason?: string;
  processing_notes?: string;
  processed_at?: string;
  document_url?: string;
  qr_code?: string;
  delivery_method: string;
  delivery_address: string;
  delivery_notes: string;
  created_at: string;
}

const DocumentRequests: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    purpose: '',
    quantity: 1,
    delivery_method: 'pickup',
    delivery_address: '',
    delivery_notes: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchDocumentTypes();
    fetchMyRequests();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/types');
      if (response.data.success) {
        setDocumentTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/documents/requests');
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDocument = (docType: DocumentType) => {
    setSelectedDocumentType(docType);
    setShowRequestForm(true);
    // Reset form data when opening modal
    setFormData({
      purpose: '',
      quantity: 1,
      delivery_method: 'pickup',
      delivery_address: '',
      delivery_notes: ''
    });
    setUploadedFiles([]);
    setFilePreviews([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...uploadedFiles, ...files];
    setUploadedFiles(newFiles);
    
    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocumentType) return;

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('document_type_id', selectedDocumentType.id.toString());
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('quantity', formData.quantity.toString());
      formDataToSend.append('delivery_method', formData.delivery_method);
      formDataToSend.append('delivery_address', formData.delivery_address);
      formDataToSend.append('delivery_notes', formData.delivery_notes);
      
      // Append uploaded files
      uploadedFiles.forEach((file) => {
        formDataToSend.append(`requirement_files`, file);
      });

      const response = await api.post('/documents/requests', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setShowRequestForm(false);
        setSelectedDocumentType(null);
        setFormData({
          purpose: '',
          quantity: 1,
          delivery_method: 'pickup',
          delivery_address: '',
          delivery_notes: ''
        });
        setUploadedFiles([]);
        setFilePreviews([]);
        fetchMyRequests();
      }
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadDocument = (documentUrl: string) => {
    // For file URLs, don't add the /api prefix since they're served directly
    // The Vite proxy will handle forwarding /uploads/* to the backend
    window.open(documentUrl, '_blank');
  };

  // Helper function to parse requirements
  const parseRequirements = (requirements: string) => {
    try {
      return JSON.parse(requirements);
    } catch {
      // If it's not JSON, treat as comma-separated string
      return requirements.split(',').map(req => req.trim()).filter(req => req);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Requests</h1>
          <p className="text-gray-600">Request barangay certificates and documents</p>
        </div>
        <button
          onClick={() => {
            if (documentTypes.length === 0) {
              alert('No document types available. Please contact the administrator.');
              return;
            }
            setShowRequestForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request Document
        </button>
      </div>

      {/* Available Document Types */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentTypes.map((docType) => (
            <div key={docType.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900">{docType.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
              
              {/* Requirements Display */}
              {docType.requirements && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
                  <div className="text-xs text-gray-600">
                    {(() => {
                      const requirements = parseRequirements(docType.requirements);
                      return Array.isArray(requirements) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {requirements.map((req: string, index: number) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{requirements}</p>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Processing:</span> {docType.processing_days} days
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Fee:</span> ₱{docType.fee.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleRequestDocument(docType)}
                className="mt-3 w-full bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Request
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* My Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No document requests yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{request.document_type_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested on: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.purpose && (
                      <p className="text-sm text-gray-600 mt-1">
                        Purpose: {request.purpose}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: {request.quantity} | Delivery: {request.delivery_method}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {request.document_url && request.status === 'ready' && (
                      <button
                        onClick={() => downloadDocument(request.document_url!)}
                        className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
                
                {request.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Rejection Reason:</span> {request.rejection_reason}
                    </p>
                  </div>
                )}
                
                {request.processing_notes && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Processing Notes:</span> {request.processing_notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Document Type Selection Modal */}
      {showRequestForm && !selectedDocumentType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Select Document Type</h2>
                  <p className="text-blue-100 text-sm mt-1">Choose the type of document you want to request</p>
                </div>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-blue-200 hover:text-white transition-colors p-2 hover:bg-blue-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documentTypes.map((docType) => (
                  <div 
                    key={docType.id} 
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      setSelectedDocumentType(docType);
                      setFormData({
                        purpose: '',
                        quantity: 1,
                        delivery_method: 'pickup',
                        delivery_address: '',
                        delivery_notes: ''
                      });
                      setUploadedFiles([]);
                      setFilePreviews([]);
                    }}
                  >
                    {/* Document Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{docType.name}</div>
                        <div className="text-sm text-blue-600 font-medium">₱{docType.fee.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{docType.description}</p>
                    
                    {/* Requirements */}
                    {docType.requirements && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <svg className="h-4 w-4 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-700">Requirements</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const requirements = parseRequirements(docType.requirements);
                            return Array.isArray(requirements) ? (
                              <ul className="list-disc list-inside space-y-1">
                                {requirements.slice(0, 2).map((req: string, reqIndex: number) => (
                                  <li key={reqIndex}>{req}</li>
                                ))}
                                {requirements.length > 2 && (
                                  <li className="text-blue-600">+{requirements.length - 2} more...</li>
                                )}
                              </ul>
                            ) : (
                              <p className="line-clamp-2">{requirements}</p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Processing Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{docType.processing_days} day{docType.processing_days > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span>₱{docType.fee.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Select Button */}
                    <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-sm">
                      Select This Document
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Request Form Modal */}
      {showRequestForm && selectedDocumentType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Request {selectedDocumentType.name}</h2>
                  <p className="text-blue-100 text-sm mt-1">{selectedDocumentType.description}</p>
                </div>
                <button
                  onClick={() => setSelectedDocumentType(null)}
                  className="text-blue-200 hover:text-white transition-colors p-2 hover:bg-blue-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Document Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{selectedDocumentType.processing_days} day{selectedDocumentType.processing_days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-gray-600">₱{selectedDocumentType.fee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {selectedDocumentType.requirements && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 mb-2">Required Documents</h3>
                      <div className="text-sm text-amber-800">
                        {(() => {
                          const requirements = parseRequirements(selectedDocumentType.requirements);
                          return Array.isArray(requirements) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {requirements.map((req: string, reqIndex: number) => (
                                <li key={reqIndex}>{req}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{requirements}</p>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-amber-700 mt-2 font-medium">
                        📎 Please upload all required documents below
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmitRequest} className="space-y-5">
                {/* Compact File Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Upload Required Documents *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 group">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-base font-medium text-gray-700 mb-2">
                        Click to upload files
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
                      </span>
                    </label>
                  </div>
                  
                  {/* Compact File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-900 mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2">
                              <div className="bg-blue-100 p-1 rounded">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Purpose Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Purpose *
                    </label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      rows={3}
                      placeholder="What is the purpose of this document?"
                      required
                    />
                  </div>
                  
                  {/* Quantity Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                  
                  {/* Delivery Method Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Delivery Method *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.delivery_method}
                        onChange={(e) => setFormData({...formData, delivery_method: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
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
                
                {/* Delivery Address (conditional) */}
                {formData.delivery_method !== 'pickup' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-blue-900 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                      className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      rows={3}
                      placeholder="Enter complete delivery address"
                      required
                    />
                    <p className="text-xs text-blue-700 mt-1">
                      {formData.delivery_method === 'email' 
                        ? '📧 Document will be sent to your registered email address'
                        : '📮 Document will be mailed to the address provided'
                      }
                    </p>
                  </div>
                )}
                
                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.delivery_notes}
                    onChange={(e) => setFormData({...formData, delivery_notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    rows={2}
                    placeholder="Any special instructions or additional information"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setSelectedDocumentType(null);
                    setUploadedFiles([]);
                    setFilePreviews([]);
                    setFormData({
                      purpose: '',
                      quantity: 1,
                      delivery_method: 'pickup',
                      delivery_address: '',
                      delivery_notes: ''
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmitRequest}
                  disabled={uploadedFiles.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadedFiles.length === 0 ? 'Upload Documents First' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequests;