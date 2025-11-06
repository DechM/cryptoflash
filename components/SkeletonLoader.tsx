'use client'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  height?: string
}

export function SkeletonLoader({ className = '', lines = 1, height = '1rem' }: SkeletonLoaderProps) {
  if (lines === 1) {
    return <div className={`skeleton ${className}`} style={{ height }} />
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{ height, width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="w-full glass-card rounded-xl p-4 md:p-6">
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="skeleton h-4 w-12" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-3 md:p-4 border border-white/10">
      <div className="skeleton h-4 w-24 mb-2" />
      <div className="skeleton h-8 w-16" />
    </div>
  )
}

