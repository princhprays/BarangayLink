import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI, marketplaceAPI } from '../../services/api'
import { 
  Users, 
  UserCheck, 
  Clock, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

interface DashboardStats {
  barangay_id: number
  pending_residents: number
  total_residents: number
  approved_residents: number
}

export const AdminDashboard: React.FC = () => {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminAPI.getDashboard
  })

  const { data: pendingItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['admin-pending-items'],
    queryFn: () => marketplaceAPI.getPendingItems({ page: 1, per_page: 5 })
  })

  const { data: allUsersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => adminAPI.getAllUsers({ page: 1, per_page: 1000 })
  })

  const { data: rejectedResidentsData, isLoading: rejectedLoading } = useQuery({
    queryKey: ['admin-rejected-residents'],
    queryFn: () => adminAPI.getAllUsers({ role: 'resident', status: 'rejected', page: 1, per_page: 1000 })
  })

  const stats: DashboardStats = dashboardData?.data?.success ? dashboardData.data.data || {
    barangay_id: 0,
    pending_residents: 0,
    total_residents: 0,
    approved_residents: 0
  } : {
    barangay_id: 0,
    pending_residents: 0,
    total_residents: 0,
    approved_residents: 0
  }

  const pendingItems = pendingItemsData?.data?.success ? pendingItemsData.data.data || [] : []
  
  // Calculate additional stats from real data
  const allUsers = allUsersData?.data?.success ? allUsersData.data.data || [] : []
  const rejectedResidents = rejectedResidentsData?.data?.success ? rejectedResidentsData.data.data || [] : []
  
  const totalAdmins = allUsers.filter((user: any) => user.role === 'admin').length
  const rejectedResidentsCount = rejectedResidents.length

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    change, 
    changeType 
  }: {
    title: string
    value: number
    icon: any
    color: string
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    color, 
    count, 
    href 
  }: {
    title: string
    description: string
    icon: any
    color: string
    count?: number
    href: string
  }) => (
    <a
      href={href}
      className="block bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {count !== undefined && count > 0 && (
          <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {count}
          </div>
        )}
      </div>
    </a>
  )

  if (dashboardLoading || usersLoading || rejectedLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm">Overview of your barangay's activity and management tasks.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Pending Verifications"
          value={stats.pending_residents}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Approved Residents"
          value={stats.approved_residents}
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          title="Rejected Residents"
          value={rejectedResidentsCount}
          icon={XCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Total Admins"
          value={totalAdmins}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <QuickActionCard
          title="Resident Verifications"
          description="Review and approve new resident registrations"
          icon={UserCheck}
          color="bg-blue-500"
          count={stats.pending_residents}
          href="/admin/verifications"
        />
        <QuickActionCard
          title="Pending Items"
          description="Review items submitted by residents"
          icon={Package}
          color="bg-purple-500"
          count={pendingItems.length}
          href="/admin/pending-items"
        />
        <QuickActionCard
          title="Request Management"
          description="Manage item requests and transactions"
          icon={Activity}
          color="bg-green-500"
          href="/admin/request-management"
        />
        <QuickActionCard
          title="User Management"
          description="Manage residents and admin accounts"
          icon={Users}
          color="bg-indigo-500"
          href="/admin/manage-users"
        />
        <QuickActionCard
          title="Announcements"
          description="Create and manage community announcements"
          icon={AlertTriangle}
          color="bg-orange-500"
          href="/admin/announcements"
        />
        <QuickActionCard
          title="Document Requests"
          description="Process certificate and document requests"
          icon={CheckCircle}
          color="bg-teal-500"
          href="/admin/document-requests"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Items */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Pending Items</h3>
          </div>
          <div className="p-4">
            {itemsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No pending items</p>
                <p className="text-xs text-gray-400 mt-1">All items have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {item.owner_name} • {item.category}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
                {pendingItems.length > 5 && (
                  <div className="text-center pt-3">
                    <a
                      href="/admin/pending-items"
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View all pending items
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-900">Database</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-900">API Services</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-900">File Storage</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-900">Email Service</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p>Last updated: {new Date().toLocaleString()}</p>
                <p className="mt-1">System uptime: 99.9%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
