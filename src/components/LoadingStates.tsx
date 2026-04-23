import React from 'react'
import { Loader2, GraduationCap } from 'lucide-react'

// Skeleton loader component
export const SkeletonLoader: React.FC<{
  lines?: number
  className?: string
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className="h-4 bg-gray-200 rounded animate-pulse"
        style={{
          animationDelay: `${index * 0.1}s`,
          width: `${Math.random() * 40 + 60}%`
        }}
      />
    ))}
  </div>
)

// Card skeleton loader
export const CardSkeleton: React.FC<{
  count?: number
  className?: string
}> = ({ count = 1, className = '' }) => (
  <div className={`grid gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/3" />
        <div className="space-y-2">
          <SkeletonLoader lines={3} />
        </div>
      </div>
    ))}
  </div>
)

// Table skeleton loader
export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
    <div className="border-b border-gray-200">
      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{
                animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
)

// Form skeleton loader
export const FormSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/5" />
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="flex gap-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
      <div className="h-10 bg-gray-200 rounded animate-pulse w-24" />
    </div>
  </div>
)

// Full page loader
export const FullPageLoader: React.FC<{
  message?: string
  showLogo?: boolean
}> = ({ message = 'Loading...', showLogo = true }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      {showLogo && (
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-blue-600 rounded-full animate-ping opacity-20" />
          </div>
        </div>
      )}
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
      <div className="mt-4 space-y-1">
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
        <p className="text-xs text-gray-500">Please wait...</p>
      </div>
    </div>
  </div>
)

// Inline loader component
export const InlineLoader: React.FC<{
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {message && <span className="text-gray-600 text-sm">{message}</span>}
    </div>
  )
}

// Button loader
export const ButtonLoader: React.FC<{
  loading: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
}> = ({ loading, children, disabled = false, className = '' }) => (
  <button
    className={`relative ${className}`}
    disabled={disabled || loading}
  >
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )}
    <span className={loading ? 'invisible' : ''}>{children}</span>
  </button>
)

// Progress loader
export const ProgressLoader: React.FC<{
  progress: number
  message?: string
  showPercentage?: boolean
  className?: string
}> = ({ progress, message, showPercentage = true, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {message && <p className="text-sm text-gray-600">{message}</p>}
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
    {showPercentage && (
      <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
    )}
  </div>
)

// Staggered content loader
export const StaggeredLoader: React.FC<{
  items: string[]
  className?: string
}> = ({ items, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {items.map((item, index) => (
      <div
        key={index}
        className="flex items-center space-x-3 opacity-0 animate-fade-in"
        style={{
          animationDelay: `${index * 0.1}s`,
          animationFillMode: 'forwards'
        }}
      >
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        <span className="text-sm text-gray-600">{item}</span>
      </div>
    ))}
  </div>
)

// Loading overlay
export const LoadingOverlay: React.FC<{
  loading: boolean
  message?: string
  children: React.ReactNode
  className?: string
}> = ({ loading, message = 'Loading...', children, className = '' }) => (
  <div className={`relative ${className}`}>
    {children}
    {loading && (
      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    )}
  </div>
)
