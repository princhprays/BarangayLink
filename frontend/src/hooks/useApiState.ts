import { useState } from 'react'

export interface DataState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

export const useApiState = <T>(initialData: T | null = null) => {
  const [state, setState] = useState<DataState<T>>({
    data: initialData,
    isLoading: false,
    error: null
  })

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }

  const setData = (data: T | null) => {
    setState(prev => ({ ...prev, data, isLoading: false, error: null }))
  }

  const reset = () => {
    setState({ data: initialData, isLoading: false, error: null })
  }

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset
  }
}
