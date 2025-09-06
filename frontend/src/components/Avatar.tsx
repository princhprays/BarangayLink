import React from 'react'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  className = '', 
  onClick 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-xs'
      case 'md':
        return 'h-10 w-10 text-sm'
      case 'lg':
        return 'h-12 w-12 text-base'
      case 'xl':
        return 'h-16 w-16 text-lg'
      default:
        return 'h-10 w-10 text-sm'
    }
  }

  const getInitials = (name: string) => {
    // Clean the name to handle undefined values and extra spaces
    const cleanName = name
      .replace(/undefined/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (!cleanName) return 'U'
    
    return cleanName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getBackgroundColor = (name: string) => {
    // Clean the name to ensure consistent color generation
    const cleanName = name
      .replace(/undefined/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Use a fallback if name is empty
    const nameForHash = cleanName || 'User'
    
    // Generate a consistent color based on the cleaned name
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ]
    
    let hash = 0
    for (let i = 0; i < nameForHash.length; i++) {
      hash = nameForHash.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  const sizeClasses = getSizeClasses()
  const initials = getInitials(name)
  const backgroundColor = getBackgroundColor(name)

  return (
    <div 
      className={`
        ${sizeClasses} 
        ${backgroundColor} 
        text-white 
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-semibold 
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = initials
            }
          }}
        />
      ) : (
        initials
      )}
    </div>
  )
}
