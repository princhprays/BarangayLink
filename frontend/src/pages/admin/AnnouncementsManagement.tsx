import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsAPI } from '../../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Pin,
  PinOff,
  Calendar,
  Clock,
  MapPin,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Announcement {
  id: number
  title: string
  content: string
  category: string
  priority: string
  location?: string
  event_date?: string
  event_time?: string
  is_pinned: boolean
  is_active: boolean
  author_name: string
  created_at: string
  updated_at: string
}

interface AnnouncementsResponse {
  announcements: Announcement[]
  total: number
  pages: number
  current_page: number
}

export const AnnouncementsManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const queryClient = useQueryClient()

  const { data: announcements, isLoading, error } = useQuery<AnnouncementsResponse, Error>({
    queryKey: ['admin-announcements', searchTerm, selectedCategory, selectedPriority, selectedStatus],
    queryFn: () => announcementsAPI.getAllAnnouncements({ 
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      priority: selectedPriority || undefined,
      status: selectedStatus || undefined
    }).then(response => response.data),
    retry: 3,
    retryDelay: 1000
  })

  const { data: categories } = useQuery<string[], Error>({
    queryKey: ['announcement-categories'],
    queryFn: () => announcementsAPI.getCategories().then(response => response.data)
  })

  const createAnnouncementMutation = useMutation({
    mutationFn: announcementsAPI.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      setShowCreateModal(false)
      toast.success('Announcement created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create announcement')
    }
  })

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => announcementsAPI.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      setShowEditModal(false)
      setSelectedAnnouncement(null)
      toast.success('Announcement updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update announcement')
    }
  })

  const deleteAnnouncementMutation = useMutation({
    mutationFn: announcementsAPI.deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Announcement deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete announcement')
    }
  })

  const pinAnnouncementMutation = useMutation({
    mutationFn: announcementsAPI.pinAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success('Announcement pin status updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update pin status')
    }
  })

  const handleCreateAnnouncement = (data: any) => {
    createAnnouncementMutation.mutate(data)
  }

  const handleUpdateAnnouncement = (data: any) => {
    if (selectedAnnouncement) {
      updateAnnouncementMutation.mutate({ id: selectedAnnouncement.id, data })
    }
  }

  const handleDeleteAnnouncement = (announcementId: number) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncementMutation.mutate(announcementId)
    }
  }

  const handlePinAnnouncement = (announcementId: number) => {
    pinAnnouncementMutation.mutate(announcementId)
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setShowEditModal(true)
  }


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements Management</h1>
            <p className="text-gray-600">Create and manage community announcements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn bg-primary-600 text-white hover:bg-primary-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Announcement
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="search-announcements" className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  id="search-announcements"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search announcements..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                id="category-filter"
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
            <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                id="priority-filter"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                  setSelectedPriority('')
                  setSelectedStatus('')
                }}
                className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Announcements</h3>
                  <div className="mt-2 text-sm text-red-700">
                    Failed to load announcements. Please try again.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!announcements?.announcements || announcements.announcements.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements Found</h3>
              <p className="text-gray-600 mb-6">No announcements posted yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn bg-primary-600 text-white hover:bg-primary-700"
              >
                Create Announcement
              </button>
            </div>
          ) : (
            announcements.announcements.map((announcement: Announcement) => (
              <div key={announcement.id} className={`bg-white rounded-lg shadow-sm border p-6 ${announcement.is_pinned ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {announcement.is_pinned && (
                        <Pin className="h-5 w-5 text-primary-600" />
                      )}
                      <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {announcement.category}
                      </span>
                      {announcement.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{announcement.content}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {announcement.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{announcement.location}</span>
                        </div>
                      )}
                      {announcement.event_date && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(announcement.event_date)}</span>
                        </div>
                      )}
                      {announcement.event_time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{announcement.event_time}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Created by {announcement.author_name} on {formatDate(announcement.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePinAnnouncement(announcement.id)}
                      className={`p-2 transition-colors ${
                        announcement.is_pinned 
                          ? 'text-primary-600 hover:text-primary-700' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={announcement.is_pinned ? 'Unpin Announcement' : 'Pin Announcement'}
                    >
                      {announcement.is_pinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit Announcement"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Announcement Modal */}
        {showCreateModal && (
          <CreateAnnouncementModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateAnnouncement}
            isLoading={createAnnouncementMutation.isPending}
          />
        )}

        {/* Edit Announcement Modal */}
        {showEditModal && selectedAnnouncement && (
          <EditAnnouncementModal
            announcement={selectedAnnouncement}
            onClose={() => {
              setShowEditModal(false)
              setSelectedAnnouncement(null)
            }}
            onSubmit={handleUpdateAnnouncement}
            isLoading={updateAnnouncementMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

// Create Announcement Modal Component
const CreateAnnouncementModal: React.FC<{
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'medium',
    location: '',
    event_date: '',
    event_time: '',
    is_pinned: false
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
            <h2 className="text-xl font-semibold text-gray-900">Create New Announcement</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <AlertCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="create_title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                id="create_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="create_content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                id="create_content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="create_category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="create_category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="community">Community</option>
                  <option value="health">Health</option>
                  <option value="utility">Utility</option>
                  <option value="education">Education</option>
                  <option value="business">Business</option>
                  <option value="sports">Sports</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label htmlFor="create_priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="create_priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="create_location" className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
              <input
                id="create_location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Event or meeting location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="create_event_date" className="block text-sm font-medium text-gray-700 mb-1">Event Date (Optional)</label>
                <input
                  id="create_event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="create_event_time" className="block text-sm font-medium text-gray-700 mb-1">Event Time (Optional)</label>
                <input
                  id="create_event_time"
                  type="text"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 8:00 AM - 12:00 PM"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="create_is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="create_is_pinned" className="ml-2 block text-sm text-gray-900">
                Pin this announcement to the top
              </label>
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
                {isLoading ? 'Creating...' : 'Create Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Announcement Modal Component
const EditAnnouncementModal: React.FC<{
  announcement: Announcement
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ announcement, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: announcement.title,
    content: announcement.content,
    category: announcement.category,
    priority: announcement.priority,
    location: announcement.location || '',
    event_date: announcement.event_date ? announcement.event_date.split('T')[0] : '',
    event_time: announcement.event_time || '',
    is_pinned: announcement.is_pinned
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
            <h2 className="text-xl font-semibold text-gray-900">Edit Announcement</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <AlertCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit_title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                id="edit_title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="edit_content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                id="edit_content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="edit_category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="community">Community</option>
                  <option value="health">Health</option>
                  <option value="utility">Utility</option>
                  <option value="education">Education</option>
                  <option value="business">Business</option>
                  <option value="sports">Sports</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="edit_priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="edit_location" className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
              <input
                id="edit_location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Event or meeting location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_event_date" className="block text-sm font-medium text-gray-700 mb-1">Event Date (Optional)</label>
                <input
                  id="edit_event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="edit_event_time" className="block text-sm font-medium text-gray-700 mb-1">Event Time (Optional)</label>
                <input
                  id="edit_event_time"
                  type="text"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 8:00 AM - 12:00 PM"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit_is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="edit_is_pinned" className="ml-2 block text-sm text-gray-900">
                Pin this announcement to the top
              </label>
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
                {isLoading ? 'Updating...' : 'Update Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
