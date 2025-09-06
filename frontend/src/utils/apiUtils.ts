// Standardized API response handling utilities (non-React)
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
  pagination?: {
    page: number
    per_page: number
    total: number
    pages: number
  }
  meta?: {
    timestamp: string
    version: string
  }
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface DataState<T> extends LoadingState {
  data: T | null
}

// Standardized error handling
export const handleApiError = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return defaultMessage
}

// Standardized success response handler
export const handleApiSuccess = <T>(response: any): T | null => {
  if (response.data?.success && response.data?.data !== undefined) {
    return response.data.data
  }
  return null
}

// Standardized API call wrapper
export const apiCall = async <T>(
  apiFunction: () => Promise<any>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): Promise<T | null> => {
  try {
    const response = await apiFunction()
    const data = handleApiSuccess<T>(response)
    
    if (data !== null) {
      onSuccess?.(data)
      return data
    } else {
      const error = 'Invalid response format'
      onError?.(error)
      return null
    }
  } catch (error: any) {
    const errorMessage = handleApiError(error)
    onError?.(errorMessage)
    return null
  }
}

// Standardized status colors
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    // Request statuses
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800',
    'ready': 'bg-blue-100 text-blue-800',
    'processing': 'bg-purple-100 text-purple-800',
    
    // User statuses
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'suspended': 'bg-red-100 text-red-800',
    'verified': 'bg-green-100 text-green-800',
    'unverified': 'bg-yellow-100 text-yellow-800',
    
    // Priority levels
    'high': 'bg-red-100 text-red-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-green-100 text-green-800',
    
    // Default
    'default': 'bg-gray-100 text-gray-800'
  }
  
  return statusColors[status.toLowerCase()] || statusColors.default
}

// Standardized date formatting
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options })
}
