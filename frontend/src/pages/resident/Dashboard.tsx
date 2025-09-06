import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { marketplaceAPI, benefitsAPI, announcementsAPI } from '../../services/api'
import { Link } from 'react-router-dom'
import { 
  Package, 
  FileText, 
  Gift, 
  Megaphone, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight
} from 'lucide-react'

interface DashboardStats {
  totalItems: number
  myRequests: number
  pendingRequests: number
  approvedRequests: number
  myApplications: number
  pendingApplications: number
  recentAnnouncements: number
}

export const ResidentDashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    myRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    myApplications: 0,
    pendingApplications: 0,
    recentAnnouncements: 0
  })

  // Fetch dashboard data
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['dashboard-items'],
    queryFn: () => marketplaceAPI.getItems({ per_page: 1 })
  })

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['dashboard-requests'],
    queryFn: marketplaceAPI.getMyRequests
  })

  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['dashboard-applications'],
    queryFn: benefitsAPI.getMyApplications
  })

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['dashboard-announcements'],
    queryFn: announcementsAPI.getAnnouncements
  })

  const isLoading = itemsLoading || requestsLoading || applicationsLoading || announcementsLoading

  // Update stats when data changes
  useEffect(() => {
    if (itemsData?.data?.success && itemsData.data.data) {
      setStats(prev => ({ ...prev, totalItems: itemsData.data.data.length }))
    }
  }, [itemsData])

  useEffect(() => {
    if (requestsData?.data?.success && requestsData.data.data) {
      const requests = requestsData.data.data
      setStats(prev => ({
        ...prev,
        myRequests: requests.length,
        pendingRequests: requests.filter((r: any) => r.status === 'pending').length,
        approvedRequests: requests.filter((r: any) => r.status === 'approved').length
      }))
    }
  }, [requestsData])

  useEffect(() => {
    if (applicationsData?.data?.success && applicationsData.data.data) {
      const applications = applicationsData.data.data
      setStats(prev => ({
        ...prev,
        myApplications: applications.length,
        pendingApplications: applications.filter((a: any) => a.status === 'pending').length
      }))
    }
  }, [applicationsData])

  useEffect(() => {
    if (announcementsData?.data?.success && announcementsData.data.data) {
      setStats(prev => ({ ...prev, recentAnnouncements: announcementsData.data.data.length }))
    }
  }, [announcementsData])

  if (user?.status === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-600 text-2xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully. Please wait for admin approval to access all features.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
            <p className="text-yellow-800 text-sm">
              You can still access your profile and benefits information while waiting for approval.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-3">
              <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-3">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Browse Items',
      description: 'Explore community items available for borrowing',
      icon: Package,
      href: '/resident/community-items',
      color: 'bg-blue-500'
    },
    {
      title: 'Add Item',
      description: 'Share an item with your community',
      icon: Plus,
      href: '/resident/add-item',
      color: 'bg-green-500'
    },
    {
      title: 'Apply for Benefits',
      description: 'View and apply for available benefits',
      icon: Gift,
      href: '/resident/benefits',
      color: 'bg-purple-500'
    },
    {
      title: 'Request Document',
      description: 'Request official documents',
      icon: FileText,
      href: '/resident/document-requests',
      color: 'bg-orange-500'
    }
  ]

  const recentRequests = requestsData?.data?.success ? requestsData.data.data?.slice(0, 3) || [] : []
  const recentAnnouncements = announcementsData?.data?.success ? announcementsData.data.data?.slice(0, 3) || [] : []

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.first_name}! 👋
        </h1>
        <p className="text-gray-600 text-sm">Here's what's happening in your community today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Community Items</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center">
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Requests</p>
              <p className="text-xl font-bold text-gray-900">{stats.myRequests}</p>
              <p className="text-xs text-gray-500">{stats.pendingRequests} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-xl font-bold text-gray-900">{stats.myApplications}</p>
              <p className="text-xs text-gray-500">{stats.pendingApplications} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Megaphone className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Announcements</p>
              <p className="text-xl font-bold text-gray-900">{stats.recentAnnouncements}</p>
              <p className="text-xs text-gray-500">recent updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="group p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start">
                    <div className={`p-3 ${action.color} rounded-lg mr-4`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          {/* Recent Requests */}
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
              <Link 
                to="/resident/my-requests" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {request.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {request.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {request.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.item_title}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{request.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">You haven't made any requests yet</p>
                <p className="text-xs text-gray-400 mt-1">Start by browsing community items</p>
              </div>
            )}
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Latest News</h3>
              <Link 
                to="/resident/announcements" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {recentAnnouncements.map((announcement: any) => (
                  <div key={announcement.id} className="border-l-4 border-blue-200 pl-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No announcements at this time</p>
                <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600 mb-1">{stats.totalItems}</div>
            <div className="text-sm text-gray-600">Items Shared</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600 mb-1">{stats.approvedRequests}</div>
            <div className="text-sm text-gray-600">Successful Borrows</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600 mb-1">{stats.myApplications}</div>
            <div className="text-sm text-gray-600">Benefit Applications</div>
          </div>
        </div>
      </div>
    </div>
  )
}
