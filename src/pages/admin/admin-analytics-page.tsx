import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StatCard } from '@/components/shared/stat-card'
import { DashboardCharts } from '@/components/dashboard/charts'
import { useAuthStore } from '@/stores/auth-store'
import { setDeals, setLoading } from '@/store/deals-slice'
import { fetchDeals } from '@/services/deals-service'
import { formatCurrency } from '@/lib/utils'
import type { RootState } from '@/store'
import { BarChart3, CheckCircle2, IndianRupee, Percent } from 'lucide-react'

export function AdminAnalyticsPage() {
  const user = useAuthStore((s) => s.user)!
  const dispatch = useDispatch()
  const { deals, isLoading } = useSelector((s: RootState) => s.deals)

  useEffect(() => {
    const load = async () => {
      dispatch(setLoading(true))
      const data = await fetchDeals(user.role, user.id)
      dispatch(setDeals(data))
      dispatch(setLoading(false))
    }
    load()
  }, [user, dispatch])

  const approved = deals.filter((d) => d.status === 'approved')
  const totalRevenue = deals.reduce((s, d) => s + d.total_revenue, 0)
  const approvedRevenue = approved.reduce((s, d) => s + d.total_revenue, 0)
  const avgMargin =
    deals.length > 0
      ? deals.reduce((s, d) => s + d.net_margin_pct, 0) / deals.length
      : 0
  const approvalRate =
    deals.length > 0 ? (approved.length / deals.length) * 100 : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Organization-wide pricing performance and pipeline metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pipeline"
          value={formatCurrency(totalRevenue)}
          icon={IndianRupee}
          loading={isLoading}
        />
        <StatCard
          title="Approved Revenue"
          value={formatCurrency(approvedRevenue)}
          change={15}
          icon={BarChart3}
          loading={isLoading}
        />
        <StatCard
          title="Approval Rate"
          value={`${approvalRate.toFixed(0)}%`}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <StatCard
          title="Avg Net Margin"
          value={`${avgMargin.toFixed(1)}%`}
          icon={Percent}
          loading={isLoading}
        />
      </div>

      <DashboardCharts deals={deals} />
    </div>
  )
}
