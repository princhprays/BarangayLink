import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { benefitsAPI } from '../../services/api'
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Phone,
  Mail,
  Plus,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

// Application Modal Component
const ApplicationModal: React.FC<{
  benefit: any
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ benefit, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    application_data: {
      full_name: '',
      contact_number: '',
      email: '',
      address: '',
      additional_info: ''
    },
    documents: [],
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Apply for {benefit.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Eligibility Criteria</h3>
              <p className="text-sm text-blue-800">{benefit.eligibility_criteria}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.application_data.full_name}
                  onChange={(e) => setFormData({
                    ...formData,
                    application_data: { ...formData.application_data, full_name: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={formData.application_data.contact_number}
                  onChange={(e) => setFormData({
                    ...formData,
                    application_data: { ...formData.application_data, contact_number: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.application_data.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    application_data: { ...formData.application_data, email: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.application_data.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    application_data: { ...formData.application_data, address: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
              <textarea
                value={formData.application_data.additional_info}
                onChange={(e) => setFormData({
                  ...formData,
                  application_data: { ...formData.application_data, additional_info: e.target.value }
                })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Provide any additional information that might be relevant to your application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any additional notes or comments"
              />
            </div>

            {benefit.required_documents && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-900 mb-2">Required Documents</h3>
                <p className="text-sm text-yellow-800">{benefit.required_documents}</p>
                <p className="text-xs text-yellow-700 mt-2">
                  Please ensure you have all required documents ready before submitting your application.
                </p>
              </div>
            )}

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
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export const BenefitsApplication: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBenefit, setSelectedBenefit] = useState<any>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: benefits, isLoading } = useQuery({
    queryKey: ['benefits', searchTerm, selectedCategory],
    queryFn: () => benefitsAPI.getBenefits({ 
      search: searchTerm || undefined,
      category: selectedCategory || undefined 
    })
  })

  const { data: categories } = useQuery({
    queryKey: ['benefit-categories'],
    queryFn: benefitsAPI.getCategories
  })

  const { data: myApplications } = useQuery({
    queryKey: ['my-benefit-applications'],
    queryFn: () => benefitsAPI.getMyApplications()
  })

  const createApplicationMutation = useMutation({
    mutationFn: benefitsAPI.createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-benefit-applications'] })
      setShowApplicationModal(false)
      setSelectedBenefit(null)
      toast.success('Application submitted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit application')
    }
  })

  const handleApplyForBenefit = (benefit: any) => {
    setSelectedBenefit(benefit)
    setShowApplicationModal(true)
  }

  const handleSubmitApplication = (data: any) => {
    createApplicationMutation.mutate({
      benefit_id: selectedBenefit.id,
      ...data
    })
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

  const hasAppliedForBenefit = (benefitId: number) => {
    return myApplications?.applications?.some((app: any) => 
      app.benefit_id === benefitId && app.status !== 'rejected'
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Benefits</h1>
        <p className="text-gray-600">Apply for available community benefits and track your applications</p>
      </div>

      {/* My Applications Summary */}
      {myApplications?.applications?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['pending', 'approved', 'rejected', 'completed'].map((status) => {
              const count = myApplications.applications.filter((app: any) => app.status === status).length
              return (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
        {benefits?.benefits?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Benefits Available</h3>
            <p className="text-gray-600">No benefits match your current filters.</p>
          </div>
        ) : (
          benefits?.benefits?.map((benefit: any) => (
            <div key={benefit.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {benefit.category}
                    </span>
                    {hasAppliedForBenefit(benefit.id) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Applied
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{benefit.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</h4>
                      <p className="text-sm text-gray-600">{benefit.eligibility_criteria}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Contact Information</h4>
                      <div className="text-sm text-gray-600">
                        {benefit.contact_person && (
                          <div className="flex items-center mb-1">
                            <User className="h-4 w-4 mr-2" />
                            {benefit.contact_person}
                          </div>
                        )}
                        {benefit.contact_number && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-4 w-4 mr-2" />
                            {benefit.contact_number}
                          </div>
                        )}
                        {benefit.contact_email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {benefit.contact_email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {benefit.required_documents && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Required Documents</h4>
                      <p className="text-sm text-gray-600">{benefit.required_documents}</p>
                    </div>
                  )}

                  {benefit.application_process && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Application Process</h4>
                      <p className="text-sm text-gray-600">{benefit.application_process}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!hasAppliedForBenefit(benefit.id) ? (
                    <button
                      onClick={() => handleApplyForBenefit(benefit)}
                      className="btn bg-primary-600 text-white hover:bg-primary-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Apply Now
                    </button>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Status:</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        myApplications.applications.find((app: any) => app.benefit_id === benefit.id)?.status || 'pending'
                      )}`}>
                        {myApplications.applications.find((app: any) => app.benefit_id === benefit.id)?.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedBenefit && (
        <ApplicationModal
          benefit={selectedBenefit}
          onClose={() => {
            setShowApplicationModal(false)
            setSelectedBenefit(null)
          }}
          onSubmit={handleSubmitApplication}
          isLoading={createApplicationMutation.isPending}
        />
      )}
    </div>
  )
}
