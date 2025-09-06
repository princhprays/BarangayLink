import React, { useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

interface FormInputProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  success?: string
  helpText?: string
  min?: number
  max?: number
  step?: number
  rows?: number
  className?: string
  validation?: (value: string | number) => string | null
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  success,
  helpText,
  min,
  max,
  step,
  rows = 3,
  className = '',
  validation
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)

  const handleBlur = () => {
    setTouched(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    onChange(newValue)
  }

  // Ensure value is never undefined
  const safeValue = value ?? (type === 'number' ? 0 : '')

  const validationError = touched && validation ? validation(safeValue) : null
  const displayError = error || validationError
  const hasError = !!displayError
  const hasSuccess = !!success && !hasError

  const inputClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
    ${hasError 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : hasSuccess 
      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
    ${className}
  `

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          value={safeValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={inputClasses}
        />
      )
    }

    if (type === 'password') {
      return (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={safeValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${inputClasses} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      )
    }

    return (
      <input
        type={type}
        value={safeValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={inputClasses}
      />
    )
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {/* Help Text */}
      {helpText && !hasError && !hasSuccess && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {/* Error Message */}
      {hasError && (
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-xs text-red-600">{displayError}</p>
        </div>
      )}
      
      {/* Success Message */}
      {hasSuccess && (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-xs text-green-600">{success}</p>
        </div>
      )}
    </div>
  )
}
