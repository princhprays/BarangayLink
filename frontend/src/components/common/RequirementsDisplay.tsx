import React from 'react'
import { CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface RequirementsDisplayProps {
  requirements: string
  uploadedFiles?: File[]
  className?: string
}

export const RequirementsDisplay: React.FC<RequirementsDisplayProps> = ({
  requirements,
  uploadedFiles = [],
  className = ''
}) => {
  const parseRequirements = (requirements: string): string[] => {
    try {
      const parsed = JSON.parse(requirements)
      return Array.isArray(parsed) ? parsed : [requirements]
    } catch {
      // If it's not JSON, treat as comma-separated string
      return requirements.split(',').map(req => req.trim()).filter(req => req)
    }
  }

  const requirementsList = parseRequirements(requirements)

  const getRequirementStatus = () => {
    // Simple check: if we have uploaded files, assume requirements are met
    // In a real app, you'd want more sophisticated matching
    const hasFiles = uploadedFiles.length > 0
    return hasFiles ? 'completed' : 'pending'
  }

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-2 rounded-lg flex-shrink-0">
          <FileText className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-900 mb-3 text-sm">Required Documents</h3>
          <div className="space-y-2">
            {requirementsList.map((requirement, index) => {
              const status = getRequirementStatus()
              return (
                <div key={index} className="flex items-center space-x-2 p-2 bg-white/60 rounded-lg border border-amber-100">
                  <div className="flex-shrink-0">
                    {status === 'completed' ? (
                      <div className="bg-green-100 p-1 rounded-full">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-amber-100 p-1 rounded-full">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    status === 'completed' ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    {requirement}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 p-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-2">
              <div className="bg-amber-200 p-1 rounded">
                <svg className="h-3 w-3 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <p className="text-xs text-amber-800 font-semibold">
                Please upload all required documents below
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
