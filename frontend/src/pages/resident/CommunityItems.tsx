import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceAPI } from '../../services/api'
import { Search, Filter, Package, Clock, User, MessageCircle, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  is_available: boolean
}

interface RequestModalProps {
  item: Item | null
  isOpen: boolean
  onClose: () => void
}

const RequestModal: React.FC<RequestModalProps> = ({ item, isOpen, onClose }) => {
  const [purpose, setPurpose] = useState('')
  const [loanDays, setLoanDays] = useState(7)
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  const requestMutation = useMutation(
    (data: any) => marketplaceAPI.requestItem(item!.id, data),
    {
      onSuccess: () => {
        toast.success('Request submitted successfully!')
        queryClient.invalidateQueries({ queryKey: ['items'] })
        onClose()
        setPurpose('')
        setLoanDays(7)
        setMessage('')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit request')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    requestMutation.mutate({
      purpose,
      requested_loan_days: loanDays,
      requester_message: message
    })
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-3">
        <h3 className="text-lg font-semibold mb-4">Request Item</h3>
        <div className="mb-4">
          <h4 className="font-medium text-gray-900">{item.title}</h4>
          <p className="text-sm text-gray-600">by {item.owner_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What do you need this item for?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Duration (days)
            </label>
            <input
              type="number"
              value={loanDays}
              onChange={(e) => setLoanDays(parseInt(e.target.value))}
              min="1"
              max={item.max_loan_days}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {item.max_loan_days} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Additional message for the owner..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestMutation.isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {requestMutation.isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const CommunityItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: marketplaceAPI.getCategories
  })
  
  // Fetch items
  const { data: itemsData, isLoading, error } = useQuery({
    queryKey: ['items', { search: searchTerm, category: selectedCategory, page }],
    queryFn: () => marketplaceAPI.getItems({
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      page,
      per_page: 12
    }),
    keepPreviousData: true
  })

  React.useEffect(() => {
    if (categoriesData?.data?.success && categoriesData.data.data) {
      setCategories(categoriesData.data.data)
    }
  }, [categoriesData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleRequestItem = (item: Item) => {
    setSelectedItem(item)
    setShowRequestModal(true)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Community Items</h1>
        <Link
          to="/resident/add-item"
          className="btn bg-primary-600 text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-3 mb-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
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
          <div className="md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
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

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-3 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>Failed to load items. Please try again later.</p>
          </div>
        </div>
      ) : itemsData?.data?.success && itemsData.data.data?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm || selectedCategory ? (
              <div className="max-w-md mx-auto">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search terms or browse all categories.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory('')
                        setPage(1)
                      }}
                      className="btn bg-primary-600 text-white hover:bg-primary-700 px-6 py-2"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 border border-primary-100">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-10 w-10 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No items shared yet</h3>
                    <p className="text-gray-600 mb-2">Be the first to share something with your community!</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Tools, books, electronics, or any items you'd like to lend to your neighbors.
                    </p>
                    <Link
                      to="/resident/add-item"
                      className="inline-flex items-center btn bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Share Your First Item
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {itemsData?.data?.success && itemsData.data.data?.map((item: Item, index: number) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  index % 3 === 0 ? 'ring-2 ring-primary-100' : ''
                }`}
              >
                {/* Item Image */}
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <img
                      src={item.image_urls[0]}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-medium">{item.category}</p>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                      {item.condition}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    {item.is_available ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Item Details */}
                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                    <span className="text-xs text-primary-600 font-medium uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{item.owner_name}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Max {item.max_loan_days} days</span>
                    </div>
                    
                    {item.value_estimate && (
                      <div className="text-sm font-medium text-gray-900">
                        Est. Value: ₱{item.value_estimate.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400 mb-3">
                      Added {formatDate(item.created_at)}
                    </div>
                    
                    {item.is_available && (
                      <button
                        onClick={() => handleRequestItem(item)}
                        className="w-full btn bg-primary-600 text-white hover:bg-primary-700 text-sm py-2 rounded-lg font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Request Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {itemsData?.data?.success && itemsData.data.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, itemsData.data.pages || 1))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        page === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setPage(p => Math.min(itemsData.data.pages || 1, p + 1))}
                  disabled={page === (itemsData.data.pages || 1)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Community Stats */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {itemsData?.data?.success ? itemsData.data.total || 0 : 0}
                  </div>
                  <div className="text-gray-600">Items Shared</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {categories.length}
                  </div>
                  <div className="text-gray-600">Categories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {itemsData?.data?.success && itemsData.data.total ? Math.ceil(itemsData.data.total / 4) : 0}
                  </div>
                  <div className="text-gray-600">Active Members</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Request Modal */}
      <RequestModal
        item={selectedItem}
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false)
          setSelectedItem(null)
        }}
      />
    </div>
  )
}
