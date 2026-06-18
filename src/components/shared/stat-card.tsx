import { motion } from 'framer-motion'
import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value: string
  change?: number
  icon: LucideIcon
  loading?: boolean
  className?: string
  valueColor?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  loading,
  className,
  valueColor,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  const isPositive = change !== undefined && change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('glass-card gradient-border p-6 group hover:shadow-xl transition-shadow', className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('mt-2 text-3xl font-bold tracking-tight font-display', valueColor)}>{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                isPositive ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)}% vs last month
            </div>
          )}
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
