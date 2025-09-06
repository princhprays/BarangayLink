import React from 'react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  action, 
  className = '' 
}) => (
  <div className={`text-center py-12 ${className}`}>
    {icon && (
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {action && action}
  </div>
)
