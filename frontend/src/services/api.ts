import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Utility function to clear all tokens
export const clearAllTokens = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  console.log('🧹 All tokens cleared')
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 401 Error detected - clearing token and redirecting to login')
      localStorage.removeItem('token')
      sessionStorage.removeItem('token') // Clear from session storage too
      // Force a hard redirect to clear any cached state
      window.location.replace('/login')
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  register: (data: any) => 
    api.post('/auth/register', data),
  logout: () => 
    api.post('/auth/logout'),
  getProfile: () => 
    api.get('/auth/profile'),
  updateProfile: (data: any) => {
    // Check if data is FormData to set proper headers
    if (data instanceof FormData) {
      return api.put('/auth/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    }
    return api.put('/auth/profile', data)
  },
  reRegister: (data: any) => 
    api.post('/auth/re-register', data),
}

export const barangayAPI = {
  getBarangays: () => 
    api.get('/barangay/'),
  getBarangay: (id: number) => 
    api.get(`/barangay/${id}`),
}

export const adminAPI = {
  getDashboard: () => 
    api.get('/admin/dashboard'),
  getPendingResidents: (params?: any) => 
    api.get('/admin/residents/pending', { params }),
  getResident: (id: number) => 
    api.get(`/admin/residents/${id}`),
  approveResident: (id: number, data?: any) => 
    api.post(`/admin/residents/${id}/approve`, data),
  rejectResident: (id: number, data: { rejection_reason: string }) => 
    api.post(`/admin/residents/${id}/reject`, data),
  getAllRequests: (params?: any) => 
    api.get('/admin/requests', { params }),
  getRequestDetails: (requestId: number) => 
    api.get(`/admin/requests/${requestId}/details`),
  getAllUsers: (params?: any) => 
    api.get('/admin/users', { params }),
  getDocumentRequestFiles: (requestId: number) => 
    api.get(`/documents/requests/${requestId}/files`),
}

export const residentsAPI = {
  getProfile: () => 
    api.get('/residents/profile'),
  updateProfile: (data: any) => 
    api.post('/residents/profile', data),
}

export const marketplaceAPI = {
  // Items
  getItems: (params?: any) => 
    api.get('/marketplace/items', { params }),
  getItem: (id: number) => 
    api.get(`/marketplace/items/${id}`),
  createItem: (data: any) => 
    api.post('/marketplace/items', data),
  updateItem: (id: number, data: any) => 
    api.put(`/marketplace/items/${id}`, data),
  deleteItem: (id: number) => 
    api.delete(`/marketplace/items/${id}`),
  getMyItems: () => 
    api.get('/marketplace/my-items'),
  getCategories: () => 
    api.get('/marketplace/items/categories'),
  
  // Requests
  requestItem: (itemId: number, data: any) => 
    api.post(`/marketplace/items/${itemId}/request`, data),
  getMyRequests: () => 
    api.get('/marketplace/requests'),
  approveRequest: (requestId: number, data?: any) => 
    api.post(`/marketplace/requests/${requestId}/approve`, data),
  rejectRequest: (requestId: number, data: { rejection_reason: string; owner_message?: string }) => 
    api.post(`/marketplace/requests/${requestId}/reject`, data),
  cancelRequest: (requestId: number) => 
    api.delete(`/marketplace/requests/${requestId}`),
  
  // Admin
  getPendingItems: (params?: any) => 
    api.get('/marketplace/admin/pending-items', { params }),
  approveItem: (itemId: number) => 
    api.post(`/marketplace/admin/items/${itemId}/approve`),
  rejectItem: (itemId: number, data: { rejection_reason: string }) => 
    api.post(`/marketplace/admin/items/${itemId}/reject`, data),
}

// Benefits API
export const benefitsAPI = {
  // Public
  getBenefits: (params?: any) => 
    api.get('/benefits', { params }),
  getBenefit: (benefitId: number) => 
    api.get(`/benefits/${benefitId}`),
  getCategories: () => 
    api.get('/benefits/categories'),
  
  // Admin
  getAdminBenefits: (params?: any) => 
    api.get('/benefits/admin/benefits', { params }),
  createBenefit: (data: any) => 
    api.post('/benefits', data),
  updateBenefit: (benefitId: number, data: any) => 
    api.put(`/benefits/${benefitId}`, data),
  deleteBenefit: (benefitId: number) => 
    api.delete(`/benefits/${benefitId}`),
  
  // Applications
  createApplication: (data: any) => 
    api.post('/benefits/applications', data),
  getMyApplications: (params?: any) => 
    api.get('/benefits/applications', { params }),
  
  // Admin Applications
  getAllApplications: (params?: any) => 
    api.get('/benefits/applications', { params }),
  approveApplication: (applicationId: number, data?: any) => 
    api.post(`/benefits/applications/${applicationId}/approve`, data),
  rejectApplication: (applicationId: number, data: { rejection_reason: string; notes?: string }) => 
    api.post(`/benefits/applications/${applicationId}/reject`, data),
  completeApplication: (applicationId: number, data?: any) => 
    api.post(`/benefits/applications/${applicationId}/complete`, data),
}

// Announcements API
export const announcementsAPI = {
  // Public
  getAnnouncements: (params?: any) => 
    api.get('/announcements', { params }),
  getAnnouncement: (announcementId: number) => 
    api.get(`/announcements/${announcementId}`),
  getCategories: () => 
    api.get('/announcements/categories'),
  
  // Admin
  createAnnouncement: (data: any) => 
    api.post('/announcements', data),
  updateAnnouncement: (announcementId: number, data: any) => 
    api.put(`/announcements/${announcementId}`, data),
  deleteAnnouncement: (announcementId: number) => 
    api.delete(`/announcements/${announcementId}`),
  pinAnnouncement: (announcementId: number) => 
    api.post(`/announcements/${announcementId}/pin`),
  
  // Admin Management
  getAllAnnouncements: (params?: any) => 
    api.get('/announcements/admin/announcements', { params }),
}

// Documents API
export const documentsAPI = {
  // Public
  getDocumentTypes: () => 
    api.get('/documents/types'),
  getDocumentType: (typeId: number) => 
    api.get(`/documents/types/${typeId}`),
  verifyDocument: (code: string) => 
    api.get(`/documents/verify/${code}`),
  
  // Admin
  createDocumentType: (data: any) => 
    api.post('/documents/types', data),
  updateDocumentType: (typeId: number, data: any) => 
    api.put(`/documents/types/${typeId}`, data),
  deleteDocumentType: (typeId: number, data?: any) => 
    api.delete(`/documents/types/${typeId}`, { data }),
  bulkDeleteDocumentTypes: (data: any) => 
    api.post('/documents/types/bulk-delete', data),
  deactivateDocumentType: (typeId: number, data?: any) => 
    api.post(`/documents/types/${typeId}/deactivate`, data),
  reactivateDocumentType: (typeId: number) => 
    api.post(`/documents/types/${typeId}/reactivate`),
  
  // Requests
  createDocumentRequest: (data: any) => 
    api.post('/documents/requests', data),
  getMyDocumentRequests: () => 
    api.get('/documents/requests'),
  getDocumentRequest: (requestId: number) => 
    api.get(`/documents/requests/${requestId}`),
  
  // Admin Requests
  getAllDocumentRequests: () => 
    api.get('/documents/requests'),
  approveDocumentRequest: (requestId: number, data?: any) => 
    api.post(`/documents/requests/${requestId}/approve`, data),
  rejectDocumentRequest: (requestId: number, data: { rejection_reason: string }) => 
    api.post(`/documents/requests/${requestId}/reject`, data),
  completeDocumentRequest: (requestId: number) => 
    api.post(`/documents/requests/${requestId}/complete`),
  
  // File Management
  getDocumentRequestFiles: (requestId: number) => 
    api.get(`/documents/requests/${requestId}/files`),
  deleteDocumentRequestFile: (requestId: number, fileId: number) => 
    api.delete(`/documents/requests/${requestId}/files/${fileId}`),
  downloadFile: (fileId: number) => 
    api.get(`/documents/files/${fileId}/download`),
  getFileInfo: (fileId: number) => 
    api.get(`/documents/files/${fileId}`),
}

// SOS API
export const sosAPI = {
  createSOSRequest: (data: any) => 
    api.post('/sos/requests', data),
  getSOSRequests: () => 
    api.get('/sos/requests'),
  getSOSRequest: (requestId: number) => 
    api.get(`/sos/requests/${requestId}`),
  respondToSOS: (requestId: number, data: any) => 
    api.post(`/sos/requests/${requestId}/respond`, data),
  resolveSOSRequest: (requestId: number, data: any) => 
    api.post(`/sos/requests/${requestId}/resolve`, data),
  cancelSOSRequest: (requestId: number) => 
    api.post(`/sos/requests/${requestId}/cancel`),
}

// Relocation API
export const relocationAPI = {
  createRelocationRequest: (data: any) => 
    api.post('/relocation/requests', data),
  getRelocationRequests: () => 
    api.get('/relocation/requests'),
  getRelocationRequest: (requestId: number) => 
    api.get(`/relocation/requests/${requestId}`),
  approveRelocationRequest: (requestId: number, data?: any) => 
    api.post(`/relocation/requests/${requestId}/approve`, data),
  rejectRelocationRequest: (requestId: number, data: { notes: string }) => 
    api.post(`/relocation/requests/${requestId}/reject`, data),
  completeRelocationRequest: (requestId: number, data?: any) => 
    api.post(`/relocation/requests/${requestId}/complete`, data),
  cancelRelocationRequest: (requestId: number) => 
    api.post(`/relocation/requests/${requestId}/cancel`),
}