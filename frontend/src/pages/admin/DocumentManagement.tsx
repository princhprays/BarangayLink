import React, { useState, useEffect } from 'react';
import { api, documentsAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { StepForm } from '../../components/common/StepForm';
import { 
  BasicInfoStep, 
  RequirementsStep, 
  ProcessingStep, 
  ReviewStep,
  DocumentTypeFormData 
} from '../../components/forms/DocumentTypeForm';

interface DocumentType {
  id: number;
  name: string;
  description: string;
  requirements: string;
  processing_days: number;
  fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentRequest {
  id: number;
  document_type_id: number;
  document_type_name: string;
  requester_name: string;
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

const DocumentManagement: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'types' | 'requests'>('requests');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingType, setDeletingType] = useState<DocumentType | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [forceDelete, setForceDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<{name: string, files: any[]} | null>(null);
  const [forceDeleteData, setForceDeleteData] = useState<any>(null);
  
  const [typeFormData, setTypeFormData] = useState<DocumentTypeFormData>({
    name: '',
    description: '',
    requirements: '',
    processing_days: 3,
    fee: 0,
    is_active: true
  });

  const updateTypeFormData = (data: Partial<DocumentTypeFormData>) => {
    setTypeFormData(prev => ({ ...prev, ...data }));
  };
  
  const [actionFormData, setActionFormData] = useState({
    processing_notes: '',
    rejection_reason: ''
  });

  useEffect(() => {
    fetchDocumentTypes();
    fetchRequests();
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

  const fetchRequests = async () => {
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

  // Helper function to parse requirements
  const parseRequirements = (requirements: string) => {
    try {
      return JSON.parse(requirements);
    } catch {
      // If it's not JSON, treat as comma-separated string
      return requirements.split(',').map(req => req.trim()).filter(req => req);
    }
  };

  // Helper function to get document type by ID
  const getDocumentTypeById = (typeId: number) => {
    return documentTypes.find(type => type.id === typeId);
  };

  const handleCreateType = async (data: DocumentTypeFormData) => {
    try {
      const response = await api.post('/documents/types', {
        ...data,
        requirements: data.requirements.split(',').map(r => r.trim())
      });

      if (response.data.success) {
        setShowTypeForm(false);
        setTypeFormData({
          name: '',
          description: '',
          requirements: '',
          processing_days: 3,
          fee: 0,
          is_active: true
        });
        fetchDocumentTypes();
        toast.success('Document type created successfully!');
      }
    } catch (error) {
      console.error('Error creating document type:', error);
      toast.error('Failed to create document type');
    }
  };

  const handleUpdateType = async (data: DocumentTypeFormData) => {
    if (!editingType) return;

    try {
      const response = await api.put(`/documents/types/${editingType.id}`, {
        ...data,
        requirements: data.requirements.split(',').map(r => r.trim())
      });

      if (response.data.success) {
        setShowTypeForm(false);
        setEditingType(null);
        setTypeFormData({
          name: '',
          description: '',
          requirements: '',
          processing_days: 3,
          fee: 0,
          is_active: true
        });
        fetchDocumentTypes();
        toast.success('Document type updated successfully!');
      }
    } catch (error) {
      console.error('Error updating document type:', error);
      toast.error('Failed to update document type');
    }
  };

  const handleDeleteType = async (type: DocumentType) => {
    setDeletingType(type);
    setDeleteReason('');
    setForceDelete(false);
    setShowDeleteModal(true);
  };

  const confirmDeleteType = async () => {
    if (!deletingType) return;
    
    setDeleteLoading(true);
    try {
      const response = await api.delete(`/documents/types/${deletingType.id}`, {
        data: {
          deletion_reason: deleteReason,
          force_delete: forceDelete
        }
      });
      
      if (response.data.success) {
        setShowDeleteModal(false);
        setDeletingType(null);
        setDeleteReason('');
        setForceDelete(false);
        fetchDocumentTypes();
        
        // Show success message
        toast.success(response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting document type:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data?.options) {
        const errorData = error.response.data;
        setForceDeleteData(errorData);
        setShowForceDeleteModal(true);
        return;
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete document type');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeactivateType = async (type: DocumentType) => {
    const reason = prompt('Enter reason for deactivation (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      const response = await documentsAPI.deactivateDocumentType(type.id, {
        deactivation_reason: reason
      });
      
      if (response.data.success) {
        fetchDocumentTypes();
        toast.success('Document type has been deactivated successfully');
      }
    } catch (error: any) {
      console.error('Error deactivating document type:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate document type');
    }
  };

  const handleReactivateType = async (type: DocumentType) => {
    try {
      const response = await documentsAPI.reactivateDocumentType(type.id);
      
      if (response.data.success) {
        fetchDocumentTypes();
        toast.success('Document type has been reactivated successfully');
      }
    } catch (error: any) {
      console.error('Error reactivating document type:', error);
      toast.error(error.response?.data?.message || 'Failed to reactivate document type');
    }
  };

  const handleForceDeleteConfirm = () => {
    setForceDelete(true);
    setShowForceDeleteModal(false);
    // Retry with force delete
    setTimeout(() => confirmDeleteType(), 100);
  };

  const handleForceDeleteCancel = () => {
    setShowForceDeleteModal(false);
    setForceDeleteData(null);
    setDeleteLoading(false);
  };

  const handleSelectType = (typeId: number) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSelectAllTypes = () => {
    if (selectedTypes.length === documentTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(documentTypes.map(type => type.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one document type to delete');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedTypes.length === 0) return;
    
    setBulkDeleteLoading(true);
    try {
      const response = await documentsAPI.bulkDeleteDocumentTypes({
        type_ids: selectedTypes,
        deletion_reason: deleteReason,
        force_delete: forceDelete
      });
      
      if (response.data.success) {
        setShowBulkDeleteModal(false);
        setSelectedTypes([]);
        setDeleteReason('');
        setForceDelete(false);
        fetchDocumentTypes();
        
        // Show detailed results
        const summary = response.data.summary;
        const results = response.data.results;
        
        let message = `Bulk deletion completed!\n\nSummary:\n- Total: ${summary.total}\n- Successful: ${summary.successful}\n- Failed: ${summary.failed}`;
        
        if (summary.failed > 0) {
          const failedItems = results.filter((r: any) => !r.success);
          message += `\n\nFailed items:\n${failedItems.map((r: any) => `- ${r.name || `ID ${r.type_id}`}: ${r.message}`).join('\n')}`;
        }
        
        toast.success(message);
      }
    } catch (error: any) {
      console.error('Error bulk deleting document types:', error);
      toast.error(error.response?.data?.message || 'Failed to bulk delete document types');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleEditType = (type: DocumentType) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      description: type.description,
      requirements: typeof type.requirements === 'string' ? type.requirements : JSON.stringify(type.requirements),
      processing_days: type.processing_days,
      fee: type.fee,
      is_active: type.is_active
    });
    setShowTypeForm(true);
  };

  const handleRequestAction = (request: DocumentRequest, action: 'approve' | 'reject' | 'complete') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowRequestModal(true);
    setActionFormData({
      processing_notes: '',
      rejection_reason: ''
    });
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;

    try {
      let endpoint = '';
      let data = {};

      switch (actionType) {
        case 'approve':
          endpoint = `/documents/requests/${selectedRequest.id}/approve`;
          data = { processing_notes: actionFormData.processing_notes };
          break;
        case 'reject':
          endpoint = `/documents/requests/${selectedRequest.id}/reject`;
          data = { rejection_reason: actionFormData.rejection_reason };
          break;
        case 'complete':
          endpoint = `/documents/requests/${selectedRequest.id}/complete`;
          data = { processing_notes: actionFormData.processing_notes };
          break;
      }

      const response = await api.post(endpoint, data);
      if (response.data.success) {
        setShowRequestModal(false);
        setSelectedRequest(null);
        setActionType(null);
        fetchRequests();
      }
    } catch (error) {
      console.error('Error processing request:', error);
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

  const getUploadedFiles = async (requestId: number) => {
    try {
      const response = await adminAPI.getRequestDetails(requestId);
      return response.data.uploaded_files || [];
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      return [];
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
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Manage document types and process requests</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'types' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Document Types
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'requests' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Requests
          </button>
        </div>
      </div>

      {/* Document Types Tab */}
      {activeTab === 'types' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Document Types</h2>
              <div className="flex space-x-3">
                {selectedTypes.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Selected ({selectedTypes.length})
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingType(null);
                    setTypeFormData({
                      name: '',
                      description: '',
                      requirements: '',
                      processing_days: 3,
                      fee: 0,
                      is_active: true
                    });
                    setShowTypeForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Document Type
                </button>
              </div>
            </div>

            {documentTypes.length > 0 && (
              <div className="mb-4 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTypes.length === documentTypes.length}
                    onChange={handleSelectAllTypes}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select All ({documentTypes.length})
                  </span>
                </label>
                {selectedTypes.length > 0 && (
                  <span className="text-sm text-blue-600">
                    {selectedTypes.length} selected
                  </span>
                )}
              </div>
            )}

            {documentTypes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No document types found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentTypes.map((type) => (
                  <div key={type.id} className={`border rounded-lg p-4 ${!type.is_active ? 'bg-gray-50 opacity-75' : ''} ${selectedTypes.includes(type.id) ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type.id)}
                          onChange={() => handleSelectType(type.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                      </div>
                      {!type.is_active && (
                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    
                    {/* Requirements Display */}
                    {type.requirements && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const requirements = parseRequirements(type.requirements);
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
                        <span className="font-medium">Processing:</span> {type.processing_days} days
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Fee:</span> ₱{type.fee.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleEditType(type)}
                        className="flex-1 bg-yellow-600 text-white text-xs px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                      >
                        Edit
                      </button>
                      {type.is_active ? (
                        <>
                          <button
                            onClick={() => handleDeactivateType(type)}
                            className="flex-1 bg-orange-600 text-white text-xs px-3 py-1 rounded hover:bg-orange-700 transition-colors"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleDeleteType(type)}
                            className="flex-1 bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleReactivateType(type)}
                          className="flex-1 bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No document requests found.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const documentType = getDocumentTypeById(request.document_type_id);
                  return (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{request.document_type_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Requested by: {request.requester_name}
                          </p>
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
                          
                          {/* Enhanced Requirements Display for Admin */}
                          {documentType?.requirements && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-blue-900">Required Documents</p>
                                  <p className="text-xs text-blue-700">Click to view uploaded files for each requirement</p>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="text-sm text-gray-800">
                                  {(() => {
                                    const requirements = parseRequirements(documentType.requirements);
                                    return Array.isArray(requirements) ? (
                                      <ul className="space-y-2">
                                        {requirements.map((req: string, index: number) => (
                                          <li key={index} 
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group"
                                            onClick={async () => {
                                              const uploadedFiles = await getUploadedFiles(request.id);
                                              
                                              if (uploadedFiles.length > 0) {
                                                setSelectedRequirement({ name: req, files: uploadedFiles });
                                                setShowFileModal(true);
                                              } else {
                                                alert(`No files uploaded for this request`);
                                              }
                                            }}
                                          >
                                            <div className="flex items-start">
                                              <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                              <span className="font-medium group-hover:text-blue-800">{req}</span>
                                            </div>
                                            <svg className="w-4 h-4 text-blue-500 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group">
                                        <div className="flex items-start">
                                          <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                          <span className="font-medium group-hover:text-blue-800">{requirements}</span>
                                        </div>
                                        <svg className="w-4 h-4 text-blue-500 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          {request.document_url && request.status === 'ready' && (
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => downloadDocument(request.document_url!)}
                                className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition-colors"
                              >
                                Download
                              </button>
                              {request.delivery_method === 'email' && (
                                <span className="text-xs text-green-600 font-medium">
                                  📧 Email Sent
                                </span>
                              )}
                            </div>
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

                      {/* Action Buttons */}
                      {request.status === 'pending' && (
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleRequestAction(request, 'approve')}
                            className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequestAction(request, 'reject')}
                            className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {request.status === 'approved' && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleRequestAction(request, 'complete')}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            Approve & Generate Document
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Type Form Modal */}
      {showTypeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <StepForm
            title={editingType ? 'Edit Document Type' : 'Create Document Type'}
            steps={[
              {
                id: 'basic-info',
                title: 'Basic Information',
                description: 'Document name and description',
                component: <BasicInfoStep data={typeFormData} updateData={updateTypeFormData} />
              },
              {
                id: 'requirements',
                title: 'Requirements',
                description: 'Required documents from residents',
                component: <RequirementsStep data={typeFormData} updateData={updateTypeFormData} />
              },
              {
                id: 'processing',
                title: 'Processing Details',
                description: 'Time and fees',
                component: <ProcessingStep data={typeFormData} updateData={updateTypeFormData} />
              },
              {
                id: 'review',
                title: 'Review & Confirm',
                description: 'Final review before creating',
                component: <ReviewStep data={typeFormData} updateData={updateTypeFormData} />
              }
            ]}
            onComplete={editingType ? handleUpdateType : handleCreateType}
            onCancel={() => {
              setShowTypeForm(false);
              setEditingType(null);
            }}
            submitText={editingType ? 'Update Document Type' : 'Create Document Type'}
            className="max-w-lg"
          />
        </div>
      )}

      {/* Request Action Modal */}
      {showRequestModal && selectedRequest && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approve' && 'Approve Request'}
              {actionType === 'reject' && 'Reject Request'}
              {actionType === 'complete' && 'Complete Request'}
            </h2>
            
            <form onSubmit={handleSubmitAction} className="space-y-4">
              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Notes (Optional)
                  </label>
                  <textarea
                    value={actionFormData.processing_notes}
                    onChange={(e) => setActionFormData({...actionFormData, processing_notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any processing notes..."
                  />
                </div>
              )}
              
              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={actionFormData.rejection_reason}
                    onChange={(e) => setActionFormData({...actionFormData, rejection_reason: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
              
              {actionType === 'complete' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Notes (Optional)
                  </label>
                  <textarea
                    value={actionFormData.processing_notes}
                    onChange={(e) => setActionFormData({...actionFormData, processing_notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any processing notes..."
                  />
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedRequest(null);
                    setActionType(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'complete' && 'Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Document Type
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete <strong>"{deletingType.name}"</strong>?
              </p>
              <p className="text-xs text-red-600 mb-3">
                This action cannot be undone. All associated files will be permanently deleted.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason for deletion..."
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Force delete even if there are existing requests
                </span>
              </label>
              {forceDelete && (
                <p className="text-xs text-red-600 mt-1">
                  This will cancel all existing requests and delete associated files.
                </p>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingType(null);
                  setDeleteReason('');
                  setForceDelete(false);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteType}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bulk Delete Document Types
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete <strong>{selectedTypes.length}</strong> document type(s)?
              </p>
              <p className="text-xs text-red-600 mb-3">
                This action cannot be undone. All associated files will be permanently deleted.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason for deletion..."
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Force delete even if there are existing requests
                </span>
              </label>
              {forceDelete && (
                <p className="text-xs text-red-600 mt-1">
                  This will cancel all existing requests and delete associated files.
                </p>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setDeleteReason('');
                  setForceDelete(false);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={bulkDeleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={bulkDeleteLoading}
              >
                {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedTypes.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Delete Confirmation Modal */}
      {showForceDeleteModal && forceDeleteData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Force Delete Required
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {forceDeleteData.message}
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Request Details:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Total requests: {forceDeleteData.details.total_requests}</li>
                  <li>• Pending: {forceDeleteData.details.pending_requests}</li>
                  <li>• Approved: {forceDeleteData.details.approved_requests}</li>
                  <li>• Ready: {forceDeleteData.details.ready_requests}</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Force deleting will cancel all existing requests and permanently delete associated files. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleForceDeleteCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForceDeleteConfirm}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Force Delete
              </button>
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
                            <p className="text-sm font-semibold text-gray-900 truncate">{file.filename}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <a
                            href={file.url}
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
                            href={file.url}
                            download={file.filename}
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
  );
};

export default DocumentManagement;