import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface RequestType {
  id: string
  name: string
  description: string
  category: string
  icon: string
}

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate()
  const [selectedRequestType, setSelectedRequestType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const requestTypes: RequestType[] = [
    {
      id: 'document',
      name: 'Document Request',
      description: 'Request official documents and certificates from the barangay (with file upload)',
      category: 'Administrative',
      icon: '📄'
    },
    {
      id: 'benefit',
      name: 'Benefit Application',
      description: 'Apply for barangay benefits and assistance programs',
      category: 'Social Services',
      icon: '🎁'
    },
    {
      id: 'item',
      name: 'Item Request',
      description: 'Request to borrow items from the community marketplace',
      category: 'Community',
      icon: '📦'
    },
    {
      id: 'sos',
      name: 'Emergency SOS',
      description: 'Send emergency alert for immediate assistance',
      category: 'Emergency',
      icon: '🚨'
    },
    {
      id: 'relocation',
      name: 'Relocation Request',
      description: 'Request transfer to another barangay',
      category: 'Administrative',
      icon: '🏠'
    },
    {
      id: 'general',
      name: 'General Inquiry',
      description: 'Submit general questions or concerns to barangay officials',
      category: 'General',
      icon: '❓'
    }
  ]

  const handleRequestTypeSelect = (requestType: string) => {
    // Redirect to dedicated Document Requests page for document requests
    if (requestType === 'document') {
      navigate('/resident/document-requests')
      return
    }
    
    setSelectedRequestType(requestType)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // This would be replaced with actual API call
      console.log('Creating request:', selectedRequestType)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Request created successfully! You will be notified of any updates.')
      setSelectedRequestType(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Administrative': return 'bg-blue-100 text-blue-800'
      case 'Social Services': return 'bg-green-100 text-green-800'
      case 'Community': return 'bg-purple-100 text-purple-800'
      case 'Emergency': return 'bg-red-100 text-red-800'
      case 'General': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Request</h1>
        <p className="text-gray-600">Select the type of request you would like to create.</p>
      </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {!selectedRequestType ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requestTypes.map(requestType => (
                <div
                  key={requestType.id}
                  onClick={() => handleRequestTypeSelect(requestType.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
                >
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{requestType.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{requestType.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(requestType.category)}`}>
                        {requestType.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600">{requestType.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Request Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All requests are reviewed by barangay officials</li>
                <li>• Processing times vary depending on request type</li>
                <li>• You will be notified via email of any updates</li>
                <li>• Emergency requests are prioritized and processed immediately</li>
                <li>• Some requests may require additional documentation</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <button
                onClick={() => setSelectedRequestType(null)}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Request Types
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {requestTypes.find(rt => rt.id === selectedRequestType)?.name}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Request Form */}
              {selectedRequestType === 'document' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select document type</option>
                      <option value="clearance">Barangay Clearance</option>
                      <option value="indigency">Indigency Certificate</option>
                      <option value="residency">Residency Certificate</option>
                      <option value="business">Business Permit</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What is the purpose of this document?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Number of copies needed"
                    />
                  </div>
                </div>
              )}

              {/* Benefit Application Form */}
              {selectedRequestType === 'benefit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefit Type *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select benefit type</option>
                      <option value="financial">Financial Assistance</option>
                      <option value="educational">Educational Support</option>
                      <option value="healthcare">Healthcare Benefits</option>
                      <option value="housing">Housing Assistance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Application *</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please explain why you need this benefit..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your monthly income (optional)"
                    />
                  </div>
                </div>
              )}

              {/* Item Request Form */}
              {selectedRequestType === 'item' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What item do you need?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Why do you need this item?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select duration</option>
                      <option value="1-day">1 Day</option>
                      <option value="3-days">3 Days</option>
                      <option value="1-week">1 Week</option>
                      <option value="2-weeks">2 Weeks</option>
                      <option value="1-month">1 Month</option>
                    </select>
                  </div>
                </div>
              )}

              {/* SOS Request Form */}
              {selectedRequestType === 'sos' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-sm font-medium text-red-800">Emergency Alert</h3>
                    </div>
                    <p className="mt-1 text-sm text-red-700">
                      This will immediately alert barangay officials. Only use for genuine emergencies.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Type *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select emergency type</option>
                      <option value="medical">Medical Emergency</option>
                      <option value="fire">Fire Emergency</option>
                      <option value="security">Security Threat</option>
                      <option value="natural_disaster">Natural Disaster</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Describe the emergency situation..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your current location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
              )}

              {/* Relocation Request Form */}
              {selectedRequestType === 'relocation' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination Barangay *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select destination barangay</option>
                      <option value="1">Barangay A</option>
                      <option value="2">Barangay B</option>
                      <option value="3">Barangay C</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Address *</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your new address in the destination barangay"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Relocation</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Why are you relocating?"
                    />
                  </div>
                </div>
              )}

              {/* General Inquiry Form */}
              {selectedRequestType === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief subject of your inquiry"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="general">General</option>
                      <option value="complaint">Complaint</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="information">Information Request</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setSelectedRequestType(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}
    </div>
  )
}
