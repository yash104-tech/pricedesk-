import { useEffect, useState } from 'react'
import { TrendingUp, RefreshCw, CheckCircle2, IndianRupee, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { fetchOrders } from '@/services/orders-service'
import type { Order, OrderIncentiveDetails } from '@/types'
import { formatCurrency } from '@/lib/utils'

// ─── Quarter helpers ────────────────────────────────────────────────────────

interface Quarter {
  key: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  label: string
  months: string          // display range
  payoutDate: string      // friendly payout label
}

const QUARTERS: Quarter[] = [
  { key: 'Q1', label: 'Q1 (Jan – Mar)', months: 'Jan – Mar', payoutDate: '31st April' },
  { key: 'Q2', label: 'Q2 (Apr – Jun)', months: 'Apr – Jun', payoutDate: '31st July' },
  { key: 'Q3', label: 'Q3 (Jul – Sep)', months: 'Jul – Sep', payoutDate: '31st October' },
  { key: 'Q4', label: 'Q4 (Oct – Dec)', months: 'Oct – Dec', payoutDate: '31st January (next year)' },
]

function getQuarterKey(dateStr: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null {
  if (!dateStr) return null
  const m = new Date(dateStr).getMonth() // 0-indexed
  if (m <= 2) return 'Q1'
  if (m <= 5) return 'Q2'
  if (m <= 8) return 'Q3'
  return 'Q4'
}

// ─── Per-order margin calculation ───────────────────────────────────────────

function calcMargin(order: Order) {
  const revenue = order.items.reduce((s, i) => s + i.quoted_price * i.quantity, 0)
  const cost = order.items.reduce((s, i) => s + i.transfer_price * i.quantity, 0)
  const margin = revenue - cost
  const incentive = margin * 0.05
  return { revenue, cost, margin, incentive }
}

// ─── Checklist completion check ──────────────────────────────────────────────

function isChecklistComplete(order: Order) {
  const c = order.checklist
  const salesDone = [
    c.customer_po_received_sales,
    c.commercials_validated_sales,
    c.supplier_quote_approved_sales,
    c.supplier_po_released_sales,
    c.advance_payment_made_sales,
    c.order_acknowledged_sales,
  ].filter(Boolean).length
  const finDone = [
    c.customer_po_received_finance,
    c.commercials_validated_finance,
    c.supplier_quote_approved_finance,
    c.supplier_po_released_finance,
    c.advance_payment_made_finance,
    c.order_acknowledged_finance,
  ].filter(Boolean).length
  return salesDone === 6 && finDone === 6
}

// ─── Empty incentive details factory ─────────────────────────────────────────

const emptyDetails = (): OrderIncentiveDetails => ({
  aicera_invoice_date: '',
  customer_payment_terms: '',
  aicera_payment_terms: '',
  customer_payment_date: '',
  payment_received: false,
})

// ─── Component ───────────────────────────────────────────────────────────────

export function IncentivePage() {
  const user = useAuthStore((s) => s.user)!
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  // Local editable incentive details keyed by order id
  const [details, setDetails] = useState<Record<string, OrderIncentiveDetails>>({})

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders(user.role, user.id)
      const qualified = data.filter(isChecklistComplete)
      setOrders(qualified)

      // Initialize local details state from stored values
      const init: Record<string, OrderIncentiveDetails> = {}
      qualified.forEach((o) => {
        init[o.id] = o.incentive_details ? { ...o.incentive_details } : emptyDetails()
      })
      setDetails(init)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [user])

  const handleFieldChange = (
    orderId: string,
    field: keyof OrderIncentiveDetails,
    value: string | boolean
  ) => {
    setDetails((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value },
    }))
  }

  // ─── Quarter aggregation ─────────────────────────────────────────────────

  const quarterData: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', { orders: Order[]; total: number }> = {
    Q1: { orders: [], total: 0 },
    Q2: { orders: [], total: 0 },
    Q3: { orders: [], total: 0 },
    Q4: { orders: [], total: 0 },
  }

  orders.forEach((o) => {
    const d = details[o.id]
    const q = d?.customer_payment_date ? getQuarterKey(d.customer_payment_date) : null
    if (q) {
      const { incentive } = calcMargin(o)
      quarterData[q].orders.push(o)
      quarterData[q].total += incentive
    }
  })

  const totalIncentiveEarned = orders.reduce((sum, o) => {
    const d = details[o.id]
    if (d?.customer_payment_date) {
      return sum + calcMargin(o).incentive
    }
    return sum
  }, 0)

  const totalRevenue = orders.reduce((s, o) => s + calcMargin(o).revenue, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Sales Representative · Incentive Dashboard
            </span>
            <h1 className="text-xl font-bold font-display text-foreground mt-0.5">My Incentive</h1>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={loadOrders} title="Refresh" className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Qualified Orders</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{orders.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">6/6 checklist complete</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Across all orders</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm col-span-2 md:col-span-2 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
          <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">My Total Incentive Earned</p>
          <p className="text-2xl font-extrabold text-violet-700 mt-1">{formatCurrency(totalIncentiveEarned)}</p>
          <p className="text-[10px] text-violet-500 mt-0.5">5% of margin · orders with payment date set</p>
        </div>
      </div>

      {/* ── Orders table ── */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg h-72 animate-pulse shadow-sm" />
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm">
          <Clock className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Qualified Orders Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Incentive is unlocked once both Sales and Finance have completed all 6 pre-execution checklist stages for an order.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              My Incentive Earned — Order Details
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase">
                  <th className="p-3 whitespace-nowrap">Customer Name</th>
                  <th className="p-3 whitespace-nowrap">Order Date</th>
                  <th className="p-3 whitespace-nowrap">Aicera Invoice Date</th>
                  <th className="p-3 whitespace-nowrap">Customer Payment Terms</th>
                  <th className="p-3 whitespace-nowrap">Aicera Payment Terms</th>
                  <th className="p-3 whitespace-nowrap text-center">Payment Received</th>
                  <th className="p-3 whitespace-nowrap">Customer Payment Date</th>
                  <th className="p-3 whitespace-nowrap text-right">Margin</th>
                  <th className="p-3 whitespace-nowrap text-right">Incentive (5%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.map((order) => {
                  const d = details[order.id] || emptyDetails()
                  const { margin, incentive } = calcMargin(order)

                  return (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      {/* Customer Name */}
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{order.customer_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{order.order_number}</div>
                      </td>

                      {/* Order Date */}
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Aicera Invoice Date */}
                      <td className="p-3">
                        <Input
                          type="date"
                          value={d.aicera_invoice_date}
                          onChange={(e) => handleFieldChange(order.id, 'aicera_invoice_date', e.target.value)}
                          className="h-8 text-xs w-36 bg-background"
                        />
                      </td>

                      {/* Customer Payment Terms */}
                      <td className="p-3">
                        <Input
                          value={d.customer_payment_terms}
                          onChange={(e) => handleFieldChange(order.id, 'customer_payment_terms', e.target.value)}
                          placeholder="e.g. Net 30"
                          className="h-8 text-xs w-28 bg-background"
                        />
                      </td>

                      {/* Aicera Payment Terms */}
                      <td className="p-3">
                        <Input
                          value={d.aicera_payment_terms}
                          onChange={(e) => handleFieldChange(order.id, 'aicera_payment_terms', e.target.value)}
                          placeholder="e.g. Net 45"
                          className="h-8 text-xs w-28 bg-background"
                        />
                      </td>

                      {/* Payment Received — always Yes */}
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Yes
                        </span>
                      </td>

                      {/* Customer Payment Date */}
                      <td className="p-3">
                        <Input
                          type="date"
                          value={d.customer_payment_date}
                          onChange={(e) => handleFieldChange(order.id, 'customer_payment_date', e.target.value)}
                          className="h-8 text-xs w-36 bg-background"
                        />
                        {d.customer_payment_date && (
                          <span className="block text-[10px] font-bold text-violet-600 mt-0.5">
                            → {getQuarterKey(d.customer_payment_date)}
                          </span>
                        )}
                      </td>

                      {/* Margin */}
                      <td className="p-3 text-right font-semibold text-foreground whitespace-nowrap">
                        {formatCurrency(margin)}
                      </td>

                      {/* Incentive */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded px-2 py-0.5">
                          {formatCurrency(incentive)}
                        </span>
                      </td>


                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Incentive Payment Cycle ── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Incentive Payment Cycle
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
          {QUARTERS.map((q) => {
            const qd = quarterData[q.key]
            const hasData = qd.orders.length > 0

            return (
              <div key={q.key} className={`p-5 space-y-3 ${hasData ? 'bg-violet-50/30' : ''}`}>
                {/* Quarter badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    hasData
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/20'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {q.key}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">{q.months}</span>
                </div>

                {/* Orders count */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Orders</p>
                  <p className={`text-lg font-extrabold mt-0.5 ${hasData ? 'text-violet-700' : 'text-muted-foreground'}`}>
                    {qd.orders.length}
                  </p>
                </div>

                {/* Incentive total */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Incentive Earned</p>
                  <p className={`text-sm font-extrabold mt-0.5 flex items-center gap-0.5 ${hasData ? 'text-violet-700' : 'text-muted-foreground'}`}>
                    <IndianRupee className="h-3.5 w-3.5" />
                    {hasData ? (qd.total / 1).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                  </p>
                </div>

                {/* Payout date */}
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Payout Date</p>
                  <p className={`text-xs font-bold mt-0.5 ${hasData ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                    {q.payoutDate}
                  </p>
                </div>

                {/* Per-order breakdown (if any) */}
                {hasData && (
                  <div className="space-y-1 pt-1">
                    {qd.orders.map((o) => (
                      <div key={o.id} className="flex justify-between text-[10px] text-muted-foreground border-t border-dashed border-border/30 pt-1">
                        <span className="truncate max-w-[110px] font-medium">{o.customer_name}</span>
                        <span className="font-bold text-violet-600">{formatCurrency(calcMargin(o).incentive)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-start gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Incentive Calculation:</span> 5% of margin (Revenue − Cost) per order. Quarter is determined by the Customer Payment Date. Payout is on 31st of the month following the quarter end (Q1→Apr 31, Q2→Jul 31, Q3→Oct 31, Q4→Jan 31).
          </p>
        </div>
      </div>
    </div>
  )
}
