import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  FileText,
  Percent,
  Plus,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { StatCard } from '@/components/shared/stat-card'
import { DealsTable } from '@/components/deals/deals-table'
import { DashboardCharts, getQueueDeals } from '@/components/dashboard/charts'
import { useAuthStore } from '@/stores/auth-store'
import { setDeals, setLoading } from '@/store/deals-slice'
import { fetchDeals } from '@/services/deals-service'
import { formatCurrency, getMarginColor } from '@/lib/utils'
import type { RootState } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const dispatch = useDispatch()
  const { deals, isLoading } = useSelector((s: RootState) => s.deals)

  useEffect(() => {
    const load = async () => {
      dispatch(setLoading(true))
      try {
        const data = await fetchDeals(user.role, user.id)
        dispatch(setDeals(data))
      } catch (err: any) {
        console.error('Failed to load dashboard deals:', err)
        toast.error(err.message || 'Failed to load dashboard deals')
      } finally {
        dispatch(setLoading(false))
      }
    }
    load()
  }, [user, dispatch])

  const pending = deals.filter((d) =>
    ['pending_finance', 'pending_technical', 'pending_sales_head'].includes(d.status)
  ).length
  const totalRevenue = deals.reduce((s, d) => s + d.total_revenue, 0)
  const avgMargin =
    deals.length > 0
      ? deals.reduce((s, d) => s + d.net_margin_pct, 0) / deals.length
      : 0

  const queueHref =
    user.role === 'finance'
      ? '/queue/finance'
      : user.role === 'technical'
        ? '/queue/technical'
        : user.role === 'sales_head'
          ? '/queue/sales-head'
          : null

  const queueCount =
    user.role === 'finance'
      ? getQueueDeals(deals, 'finance').length
      : user.role === 'technical'
        ? getQueueDeals(deals, 'technical').length
        : user.role === 'sales_head'
          ? getQueueDeals(deals, 'sales_head').length
          : 0

  return (
    <div className="space-y-6">
      {/* Salesforce Workspace Header Banner */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xl text-primary font-display border border-primary/20 shrink-0">
              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Welcome back</span>
                <Badge variant="outline" className="font-semibold text-[10px] py-0.5 px-2 bg-primary/5 text-primary border-primary/20">
                  {user.role === 'sales_rep' ? 'Sales Representative' : user.role === 'admin' ? 'Admin' : `${user.role.replace('_', ' ')} Reviewer`}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground mt-1">
                Good {getGreeting()}, {user.full_name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {user.role === 'sales_rep' && (
              <Button onClick={() => navigate('/deals/new')} size="sm" className="h-9 px-4 text-xs font-semibold">
                <Plus className="h-4 w-4 mr-1.5" />
                Create New Deal
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Deals"
          value={String(deals.length)}
          change={12}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard
          title="Pending Approval"
          value={String(pending)}
          icon={Clock}
          loading={isLoading}
        />
        <StatCard
          title="Pipeline Revenue"
          value={formatCurrency(totalRevenue)}
          change={8}
          icon={IndianRupee}
          loading={isLoading}
        />
        <StatCard
          title="Avg Net Margin"
          value={`${avgMargin.toFixed(1)}%`}
          icon={Percent}
          loading={isLoading}
          valueColor={getMarginColor(avgMargin)}
        />
      </div>

      {/* Review Queue Alerts block */}
      {queueHref && queueCount > 0 && (
        <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Action Required: Pending Approvals</p>
              <p className="text-xs text-muted-foreground mt-0.5">You have {queueCount} pricing deal{queueCount !== 1 ? 's' : ''} awaiting your review in the approval queue.</p>
            </div>
          </div>
          <Button onClick={() => navigate(queueHref)} size="sm" className="h-8 text-xs font-semibold px-4">
            Go to Review Queue
          </Button>
        </div>
      )}

      {(user.role === 'admin' || user.role === 'sales_head') && <DashboardCharts deals={deals} />}

      {(user.role === 'sales_rep' || user.role === 'admin' || user.role === 'sales_head') && (
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <h2 className="text-lg font-bold font-display text-foreground">Recent Pricing Deals</h2>
        </div>
      )}

      <DealsTable deals={deals.slice(0, (user.role === 'admin' || user.role === 'sales_head') ? 20 : 10)} showCreator={user.role !== 'sales_rep'} />

      {user.role === 'sales_rep' && deals.length === 0 && !isLoading && (
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No active deals found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first B2B pricing approval workflow deal.
            </p>
            <Button onClick={() => navigate('/deals/new')} size="sm">Create First Deal</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
