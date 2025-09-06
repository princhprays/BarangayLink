import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceAPI } from '../../services/api'
import { Package, Search, Check, X, Eye, Clock, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Item {
  id: number
  title: string
  description: string
  category: string
  condition: string
  value_estimate: number
  max_loan_days: number
  image_urls: string[]
  owner_name: string
  created_at: string
  status: string
}

interface ItemDetailModalProps {
  item: Item | null
  isOpen: boolean
  onClose: () => void
  onApprove: (id: number) => void
  onReject: (id: number, reason: string) => void
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ 
  item, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!isOpen || !item) return null

  const handleApprove = () => {
    onApprove(item.id)
    onClose()
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    onReject(item.id, rejectionReason)
    onClose()
    setRejectionReason('')
    setShowRejectForm(false)
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'fair': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Item Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Item Image */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
              {item.image_urls && item.image_urls.length > 0 ? (
                <img
                  src={item.image_urls[0]}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Item Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{item.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900 capitalize">{item.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                  {item.condition}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Loan Days</label>
                <p className="text-gray-900">{item.max_loan_days} days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <p className="text-gray-900">{item.owner_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                <p className="text-gray-900">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {item.value_estimate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
                <p className="text-gray-900">₱{item.value_estimate.toLocaleString()}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900 whitespace-pre-wrap">{item.description || 'No description provided'}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Item
              </button>
              
              {!showRejectForm ? (
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Item
                </button>
              ) : (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReject}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const PendingItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: itemsData, isLoading, error } = useQuery({
    queryKey: ['admin-pending-items', { search: searchTerm, page }],
    queryFn: () => marketplaceAPI.getPendingItems({
      search: searchTerm || undefined,
      page,
      per_page: 10
    }),
    keepPreviousData: true
  })

  const approveMutation = useMutation(
    (itemId: number) => marketplaceAPI.approveItem(itemId),
    {
      onSuccess: () => {
        toast.success('Item approved successfully')
        queryClient.invalidateQueries({ queryKey: ['admin-pending-items'] })
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to approve item')
      }
    }
  )

  const rejectMutation = useMutation(
    ({ itemId, reason }: { itemId: number; reason: string }) => 
      marketplaceAPI.rejectItem(itemId, { rejection_reason: reason }),
    {
      onSuccess: () => {
        toast.success('Item rejected successfully')
        queryClient.invalidateQueries({ queryKey: ['admin-pending-items'] })
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to reject item')
      }
    }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleViewItem = (item: Item) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const handleApprove = (itemId: number) => {
    approveMutation.mutate(itemId)
  }

  const handleReject = (itemId: number, reason: string) => {
    rejectMutation.mutate({ itemId, reason })
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'fair': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Items</h1>
        <p className="text-gray-600">Review and approve items submitted by residents.</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn bg-primary-600 text-white hover:bg-primary-700 px-6 py-2"
          >
            Search
          </button>
        </form>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>Failed to load pending items. Please try again later.</p>
          </div>
        </div>
      ) : itemsData?.data?.items?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>No pending items found.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsData?.data?.items?.map((item: Item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                          {item.image_urls && item.image_urls.length > 0 ? (
                            <img
                              src={item.image_urls[0]}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{item.owner_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={approveMutation.isLoading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(item.id, 'Rejected by admin')}
                          disabled={rejectMutation.isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {itemsData?.data?.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {page} of {itemsData?.data?.pages || 1}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(itemsData?.data?.pages || 1, p + 1))}
                    disabled={page === (itemsData?.data?.pages || 1)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedItem(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
