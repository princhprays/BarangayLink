import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceAPI } from '../../services/api'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar,
  Package,
  User,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export const MyRequests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['my-requests'],
    queryFn: marketplaceAPI.getMyRequests
  })

  const requests = requestsData?.data?.requests || []

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: number) => marketplaceAPI.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] })
      toast.success('Request cancelled successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel request')
    }
  })

  const filteredRequests = requests?.filter((request: any) => {
    if (filter === 'all') return true
    return request.status === filter
  }) || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled': return <XCircle className="h-5 w-5 text-gray-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
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

  const handleCancelRequest = (requestId: number) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      cancelRequestMutation.mutate(requestId)
    }
  }

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Requests</h3>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Item Requests</h1>
        <p className="text-gray-600">Track and manage your item borrowing requests</p>
      </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { value: 'all', label: 'All Requests', count: requests?.length || 0 },
              { value: 'pending', label: 'Pending', count: requests?.filter((r: any) => r.status === 'pending').length || 0 },
              { value: 'approved', label: 'Approved', count: requests?.filter((r: any) => r.status === 'approved').length || 0 },
              { value: 'rejected', label: 'Rejected', count: requests?.filter((r: any) => r.status === 'rejected').length || 0 }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any item requests yet."
                : `No ${filter} requests found.`
              }
            </p>
            <a
              href="/resident/community-items"
              className="btn bg-primary-600 text-white hover:bg-primary-700"
            >
              Browse Items
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request: any) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.item_title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Requested: {formatDate(request.created_at)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Duration: {request.requested_loan_days} days</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>Owner: {request.owner_name}</span>
                      </div>
                    </div>

                    {request.purpose && (
                      <p className="text-gray-600 text-sm mb-4">
                        <strong>Purpose:</strong> {request.purpose}
                      </p>
                    )}

                    {request.requester_message && (
                      <p className="text-gray-600 text-sm mb-4">
                        <strong>Your Message:</strong> {request.requester_message}
                      </p>
                    )}

                    {request.owner_message && (
                      <p className="text-gray-600 text-sm mb-4">
                        <strong>Owner's Response:</strong> {request.owner_message}
                      </p>
                    )}

                    {request.rejection_reason && (
                      <p className="text-red-600 text-sm mb-4">
                        <strong>Rejection Reason:</strong> {request.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Cancel Request"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedRequest.item_title}</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.toUpperCase()}
                      </span>
                      {getStatusIcon(selectedRequest.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                      <p className="text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loan Duration</label>
                      <p className="text-gray-900">{selectedRequest.requested_loan_days} days</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Owner</label>
                      <p className="text-gray-900">{selectedRequest.owner_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <p className="text-gray-900">{selectedRequest.status}</p>
                    </div>
                  </div>

                  {selectedRequest.purpose && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                      <p className="text-gray-900">{selectedRequest.purpose}</p>
                    </div>
                  )}

                  {selectedRequest.requester_message && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                      <p className="text-gray-900">{selectedRequest.requester_message}</p>
                    </div>
                  )}

                  {selectedRequest.owner_message && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner's Response</label>
                      <p className="text-gray-900">{selectedRequest.owner_message}</p>
                    </div>
                  )}

                  {selectedRequest.rejection_reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                      <p className="text-red-600">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}

                  {selectedRequest.start_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loan Period</label>
                      <p className="text-gray-900">
                        {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  {selectedRequest.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleCancelRequest(selectedRequest.id)
                        setShowDetailModal(false)
                      }}
                      className="btn btn-outline border-red-600 text-red-600 hover:bg-red-50"
                    >
                      Cancel Request
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="btn bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
