import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { benefitsAPI } from '../../services/api'
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  FileText,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

export const BenefitApplications: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete'>('approve')
  const queryClient = useQueryClient()

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-benefit-applications', searchTerm, selectedStatus],
    queryFn: () => benefitsAPI.getAllApplications({ 
      search: searchTerm || undefined,
      status: selectedStatus || undefined 
    })
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => benefitsAPI.approveApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-benefit-applications'] })
      setShowActionModal(false)
      setSelectedApplication(null)
      toast.success('Application approved successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve application')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => benefitsAPI.rejectApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-benefit-applications'] })
      setShowActionModal(false)
      setSelectedApplication(null)
      toast.success('Application rejected successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject application')
    }
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => benefitsAPI.completeApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-benefit-applications'] })
      setShowActionModal(false)
      setSelectedApplication(null)
      toast.success('Application marked as completed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to complete application')
    }
  })

  const handleViewDetails = (application: any) => {
    setSelectedApplication(application)
    setShowDetailModal(true)
  }

  const handleAction = (application: any, action: 'approve' | 'reject' | 'complete') => {
    setSelectedApplication(application)
    setActionType(action)
    setShowActionModal(true)
  }

  const handleSubmitAction = (data: any) => {
    if (!selectedApplication) return

    switch (actionType) {
      case 'approve':
        approveMutation.mutate({ id: selectedApplication.id, data })
        break
      case 'reject':
        rejectMutation.mutate({ id: selectedApplication.id, data })
        break
      case 'complete':
        completeMutation.mutate({ id: selectedApplication.id, data })
        break
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
      case 'completed': return <CheckCircle className="h-5 w-5 text-blue-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
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
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Benefit Applications</h1>
          <p className="text-gray-600">Review and manage benefit applications from residents</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { status: 'pending', label: 'Pending', count: applications?.data?.filter((app: any) => app.status === 'pending').length || 0 },
            { status: 'approved', label: 'Approved', count: applications?.data?.filter((app: any) => app.status === 'approved').length || 0 },
            { status: 'rejected', label: 'Rejected', count: applications?.data?.filter((app: any) => app.status === 'rejected').length || 0 },
            { status: 'completed', label: 'Completed', count: applications?.data?.filter((app: any) => app.status === 'completed').length || 0 }
          ].map((stat) => (
            <div key={stat.status} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getStatusIcon(stat.status)}
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search applications..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStatus('')
                }}
                className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications?.data?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600">No applications match your current filters.</p>
            </div>
          ) : (
            applications?.data?.map((application: any) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{application.benefit_title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>Applicant: {application.applicant_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Applied: {formatDate(application.created_at)}</span>
                      </div>
                      {application.approved_at && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Approved: {formatDate(application.approved_at)}</span>
                        </div>
                      )}
                    </div>

                    {application.notes && (
                      <p className="text-gray-600 text-sm mb-4">
                        <strong>Notes:</strong> {application.notes}
                      </p>
                    )}

                    {application.rejection_reason && (
                      <p className="text-red-600 text-sm mb-4">
                        <strong>Rejection Reason:</strong> {application.rejection_reason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(application, 'approve')}
                          className="p-2 text-green-400 hover:text-green-600 transition-colors"
                          title="Approve Application"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(application, 'reject')}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Reject Application"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    
                    {application.status === 'approved' && (
                      <button
                        onClick={() => handleAction(application, 'complete')}
                        className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                        title="Mark as Completed"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Application Detail Modal */}
        {showDetailModal && selectedApplication && (
          <ApplicationDetailModal
            application={selectedApplication}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedApplication(null)
            }}
          />
        )}

        {/* Action Modal */}
        {showActionModal && selectedApplication && (
          <ActionModal
            application={selectedApplication}
            actionType={actionType}
            onClose={() => {
              setShowActionModal(false)
              setSelectedApplication(null)
            }}
            onSubmit={handleSubmitAction}
            isLoading={approveMutation.isPending || rejectMutation.isPending || completeMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

// Application Detail Modal Component
const ApplicationDetailModal: React.FC<{
  application: any
  onClose: () => void
}> = ({ application, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const applicationData = application.application_data ? JSON.parse(application.application_data) : {}
  const documents = application.documents ? JSON.parse(application.documents) : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{application.benefit_title}</h3>
              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {application.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicant</label>
                <p className="text-gray-900">{application.applicant_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
                <p className="text-gray-900">{formatDate(application.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{applicationData.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <p className="text-gray-900">{applicationData.contact_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{applicationData.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">{applicationData.address || 'N/A'}</p>
              </div>
            </div>

            {applicationData.additional_info && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                <p className="text-gray-900">{applicationData.additional_info}</p>
              </div>
            )}

            {application.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-gray-900">{application.notes}</p>
              </div>
            )}

            {application.rejection_reason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                <p className="text-red-600">{application.rejection_reason}</p>
              </div>
            )}

            {documents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents</label>
                <div className="space-y-2">
                  {documents.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center text-sm text-blue-600">
                      <FileText className="h-4 w-4 mr-2" />
                      <a href={doc} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Document {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="btn bg-gray-600 text-white hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Action Modal Component
const ActionModal: React.FC<{
  application: any
  actionType: 'approve' | 'reject' | 'complete'
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ application, actionType, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    notes: '',
    rejection_reason: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {actionType === 'approve' && 'Approve Application'}
              {actionType === 'reject' && 'Reject Application'}
              {actionType === 'complete' && 'Mark as Completed'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{application.benefit_title}</h3>
              <p className="text-sm text-gray-600">Applicant: {application.applicant_name}</p>
            </div>

            {actionType === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.rejection_reason}
                  onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Please provide a reason for rejection"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional notes or comments"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || (actionType === 'reject' && !formData.rejection_reason)}
                className={`btn ${
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white disabled:opacity-50`}
              >
                {isLoading ? 'Processing...' : 
                  actionType === 'approve' ? 'Approve' :
                  actionType === 'reject' ? 'Reject' :
                  'Mark Complete'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
