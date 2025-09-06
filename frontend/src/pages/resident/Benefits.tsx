import React, { useState, useEffect } from 'react'
import { benefitsAPI } from '../../services/api'

interface Benefit {
  id: number
  name: string
  description: string
  category: string
  eligibility_criteria: string
  application_deadline: string
  is_active: boolean
  max_recipients: number
  current_recipients: number
}

interface BenefitApplication {
  id: number
  benefit_id: number
  benefit_name: string
  status: string
  applied_at: string
  processed_at?: string
  rejection_reason?: string
  notes?: string
}

export const Benefits: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [myApplications, setMyApplications] = useState<BenefitApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'my-applications'>('available')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchBenefits()
    fetchMyApplications()
    fetchCategories()
  }, [])

  const fetchBenefits = async () => {
    try {
      const response = await benefitsAPI.getBenefits()
      setBenefits(response.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch benefits')
    }
  }

  const fetchMyApplications = async () => {
    try {
      const response = await benefitsAPI.getMyApplications()
      setMyApplications(response.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await benefitsAPI.getCategories()
      setCategories(response.data || [])
    } catch (err) {
      console.error('Failed to fetch categories')
    }
  }

  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch = benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || benefit.category === selectedCategory
    return matchesSearch && matchesCategory && benefit.is_active
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800'
      case 'educational': return 'bg-blue-100 text-blue-800'
      case 'healthcare': return 'bg-red-100 text-red-800'
      case 'housing': return 'bg-purple-100 text-purple-800'
      case 'employment': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isEligible = (benefit: Benefit) => {
    // Check if user has already applied
    const hasApplied = myApplications.some(app => app.benefit_id === benefit.id)
    // Check if benefit is still accepting applications
    const deadline = new Date(benefit.application_deadline)
    const now = new Date()
    const isActive = deadline > now
    // Check if benefit has reached max recipients
    const hasCapacity = benefit.current_recipients < benefit.max_recipients
    
    return !hasApplied && isActive && hasCapacity
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Benefits</h1>
        <p className="text-gray-600">Discover and apply for available barangay benefits and assistance programs.</p>
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
              Available Benefits ({filteredBenefits.length})
            </button>
            <button
              onClick={() => setActiveTab('my-applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Applications ({myApplications.length})
            </button>
          </nav>
        </div>

        {/* Available Benefits Tab */}
        {activeTab === 'available' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search benefits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {filteredBenefits.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No benefits found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'There are no active benefits available at the moment.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBenefits.map(benefit => (
                  <div key={benefit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{benefit.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(benefit.category)}`}>
                        {benefit.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{benefit.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Eligibility:</h4>
                        <p className="text-sm text-gray-600">{benefit.eligibility_criteria}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Deadline:</h4>
                        <p className="text-sm text-gray-600">{formatDate(benefit.application_deadline)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Availability:</h4>
                        <p className="text-sm text-gray-600">
                          {benefit.current_recipients} of {benefit.max_recipients} slots filled
                        </p>
                      </div>
                    </div>

                    {isEligible(benefit) ? (
                      <button
                        onClick={() => window.location.href = `/resident/benefits-application?benefit_id=${benefit.id}`}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">
                          {myApplications.some(app => app.benefit_id === benefit.id) 
                            ? 'You have already applied for this benefit'
                            : 'Applications are currently closed'
                          }
                        </p>
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
                        >
                          Not Available
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Applications Tab */}
        {activeTab === 'my-applications' && (
          <div>
            {myApplications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't applied for any benefits yet.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('available')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Available Benefits
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map(application => (
                  <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{application.benefit_name}</h3>
                        <p className="text-sm text-gray-600">Application ID: #{application.id}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Applied:</span>
                        <p className="font-medium">{formatDate(application.applied_at)}</p>
                      </div>
                      {application.processed_at && (
                        <div>
                          <span className="text-gray-500">Processed:</span>
                          <p className="font-medium">{formatDate(application.processed_at)}</p>
                        </div>
                      )}
                      {application.notes && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Notes:</span>
                          <p className="font-medium">{application.notes}</p>
                        </div>
                      )}
                    </div>

                    {application.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {application.rejection_reason}
                        </p>
                      </div>
                    )}

                    {application.status === 'approved' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          Your application has been approved! You will be contacted for further instructions.
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
