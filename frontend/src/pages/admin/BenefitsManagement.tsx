import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { benefitsAPI } from '../../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  XCircle,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Benefit {
  id: number
  title: string
  description: string
  category: string
  eligibility_criteria: string
  required_documents?: string
  application_process?: string
  contact_person?: string
  contact_number?: string
  contact_email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface BenefitsResponse {
  benefits: Benefit[]
  total: number
  pages: number
  current_page: number
}

export const BenefitsManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const queryClient = useQueryClient()

  const { data: benefits, isLoading, error } = useQuery<BenefitsResponse, Error>({
    queryKey: ['admin-benefits', searchTerm, selectedCategory],
    queryFn: () => benefitsAPI.getAdminBenefits({ 
      search: searchTerm || undefined,
      category: selectedCategory || undefined 
    }).then(response => response.data),
    retry: 3,
    retryDelay: 1000
  })

  const { data: categories } = useQuery<string[], Error>({
    queryKey: ['benefit-categories'],
    queryFn: () => benefitsAPI.getCategories().then(response => response.data)
  })

  const createBenefitMutation = useMutation({
    mutationFn: benefitsAPI.createBenefit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-benefits'] })
      setShowCreateModal(false)
      toast.success('Benefit created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create benefit')
    }
  })

  const updateBenefitMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => benefitsAPI.updateBenefit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-benefits'] })
      setShowEditModal(false)
      setSelectedBenefit(null)
      toast.success('Benefit updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update benefit')
    }
  })

  const deleteBenefitMutation = useMutation({
    mutationFn: benefitsAPI.deleteBenefit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-benefits'] })
      toast.success('Benefit deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete benefit')
    }
  })

  const handleCreateBenefit = (data: any) => {
    createBenefitMutation.mutate(data)
  }

  const handleUpdateBenefit = (data: any) => {
    if (selectedBenefit) {
      updateBenefitMutation.mutate({ id: selectedBenefit.id, data })
    }
  }

  const handleDeleteBenefit = (benefitId: number) => {
    if (window.confirm('Are you sure you want to delete this benefit?')) {
      deleteBenefitMutation.mutate(benefitId)
    }
  }

  const handleEditBenefit = (benefit: Benefit) => {
    setSelectedBenefit(benefit)
    setShowEditModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Benefits Management</h1>
            <p className="text-gray-600">Manage community benefits and applications</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn bg-primary-600 text-white hover:bg-primary-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Benefit
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search benefits..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {categories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                }}
                className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Benefits</h3>
                  <div className="mt-2 text-sm text-red-700">
                    Failed to load benefits. Please try again.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!benefits?.benefits || benefits.benefits.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Benefits Found</h3>
              <p className="text-gray-600 mb-4">No benefits available at the moment.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn bg-primary-600 text-white hover:bg-primary-700"
              >
                Create Benefit
              </button>
            </div>
          ) : (
            benefits.benefits.map((benefit: Benefit) => (
              <div key={benefit.id} className="bg-white rounded-lg shadow-sm border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {benefit.category}
                      </span>
                      {benefit.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{benefit.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</h4>
                        <p className="text-sm text-gray-600">{benefit.eligibility_criteria}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Contact Information</h4>
                        <p className="text-sm text-gray-600">
                          {benefit.contact_person && `${benefit.contact_person} - `}
                          {benefit.contact_number || benefit.contact_email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Created: {new Date(benefit.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditBenefit(benefit)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit Benefit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBenefit(benefit.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete Benefit"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Benefit Modal */}
        {showCreateModal && (
          <CreateBenefitModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateBenefit}
            isLoading={createBenefitMutation.isPending}
          />
        )}

        {/* Edit Benefit Modal */}
        {showEditModal && selectedBenefit && (
          <EditBenefitModal
            benefit={selectedBenefit}
            onClose={() => {
              setShowEditModal(false)
              setSelectedBenefit(null)
            }}
            onSubmit={handleUpdateBenefit}
            isLoading={updateBenefitMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

// Create Benefit Modal Component
const CreateBenefitModal: React.FC<{
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eligibility_criteria: '',
    required_documents: '',
    application_process: '',
    contact_person: '',
    contact_number: '',
    contact_email: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New Benefit</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="financial">Financial</option>
                  <option value="social">Social</option>
                  <option value="housing">Housing</option>
                  <option value="employment">Employment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label>
              <textarea
                value={formData.eligibility_criteria}
                onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Documents</label>
              <textarea
                value={formData.required_documents}
                onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="List required documents separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Process</label>
              <textarea
                value={formData.application_process}
                onChange={(e) => setFormData({ ...formData, application_process: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the application process"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
                disabled={isLoading}
                className="btn bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Benefit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Benefit Modal Component
const EditBenefitModal: React.FC<{
  benefit: Benefit
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ benefit, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: benefit.title,
    description: benefit.description,
    category: benefit.category,
    eligibility_criteria: benefit.eligibility_criteria,
    required_documents: benefit.required_documents || '',
    application_process: benefit.application_process || '',
    contact_person: benefit.contact_person || '',
    contact_number: benefit.contact_number || '',
    contact_email: benefit.contact_email || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Benefit</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="financial">Financial</option>
                  <option value="social">Social</option>
                  <option value="housing">Housing</option>
                  <option value="employment">Employment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label>
              <textarea
                value={formData.eligibility_criteria}
                onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Documents</label>
              <textarea
                value={formData.required_documents}
                onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="List required documents separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Process</label>
              <textarea
                value={formData.application_process}
                onChange={(e) => setFormData({ ...formData, application_process: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the application process"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
                disabled={isLoading}
                className="btn bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Benefit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
