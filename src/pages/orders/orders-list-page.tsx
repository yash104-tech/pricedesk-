import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, RefreshCw, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { fetchOrders } from '@/services/orders-service'
import type { Order } from '@/types'

export function OrdersListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders(user.role, user.id)
      setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (order.order_number || '').toLowerCase().includes(q) ||
      (order.title || '').toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.oem || '').toLowerCase().includes(q) ||
      (order.sales_rep_name || '').toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    loadOrders()
  }, [user])

  // Calculate checklists progress
  const getChecklistCount = (order: Order) => {
    const checklist = order.checklist
    const salesDone = [
      checklist.customer_po_received_sales,
      checklist.commercials_validated_sales,
      checklist.supplier_quote_approved_sales,
      checklist.supplier_po_released_sales,
      checklist.advance_payment_made_sales,
      checklist.order_acknowledged_sales,
    ].filter(Boolean).length

    const finDone = [
      checklist.customer_po_received_finance,
      checklist.commercials_validated_finance,
      checklist.supplier_quote_approved_finance,
      checklist.supplier_po_released_finance,
      checklist.advance_payment_made_finance,
      checklist.order_acknowledged_finance,
    ].filter(Boolean).length

    return { salesDone, finDone }
  }

  const getDispatchCount = (order: Order) => {
    const dispatch = order.dispatch
    const completed = [
      dispatch.material_dispatched_sales || dispatch.material_dispatched_finance,
      dispatch.material_received_sales || dispatch.material_received_finance,
      dispatch.installation_completed_sales || dispatch.installation_completed_finance,
      dispatch.customer_acceptance_sales || dispatch.customer_acceptance_finance,
      dispatch.invoice_raised_sales || dispatch.invoice_raised_finance,
      dispatch.payment_received_sales || dispatch.payment_received_finance,
    ].filter(Boolean).length

    return completed
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Order Management Workspace</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-bold font-display text-foreground">My Orders</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="icon" onClick={loadOrders} title="Refresh list" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {(user.role === 'sales_rep' || user.role === 'finance') && (
            <Button onClick={() => navigate('/orders/new')} size="sm" className="h-9 text-xs font-semibold px-4">
              <Plus className="h-4 w-4 mr-1.5" />
              New Order Setup
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-card border border-border rounded-lg shadow-sm p-4 text-xs">
        <div>
          <p className="text-muted-foreground font-semibold">Total Orders</p>
          <p className="font-bold text-foreground mt-1 text-sm">{orders.length} record(s)</p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold">Awaiting Execution</p>
          <p className="font-bold text-foreground mt-1 text-sm">
            {orders.filter((o) => getChecklistCount(o).salesDone < 6 || getChecklistCount(o).finDone < 6).length} order(s)
          </p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold">In Dispatch Details</p>
          <p className="font-bold text-foreground mt-1 text-sm">
            {orders.filter((o) => getChecklistCount(o).salesDone === 6 && getChecklistCount(o).finDone === 6).length} order(s)
          </p>
        </div>
      </div>

      {/* Search Bar */}
      {!loading && orders.length > 0 && (
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex items-center gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, title, customer, OEM, or sales rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-border text-xs rounded-lg w-full bg-background"
            />
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg h-96 animate-pulse shadow-sm" />
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Orders Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {user.role === 'sales_rep' || user.role === 'finance'
              ? 'You have not drafted any orders. Create an order from your fully approved quotes/deals.'
              : 'There are no active orders routed to the finance queue.'}
          </p>
          {(user.role === 'sales_rep' || user.role === 'finance') && (
            <Button onClick={() => navigate('/orders/new')} size="sm" className="mt-4">
              Create New Order
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Deal Title</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">OEM</th>
                  {user.role !== 'sales_rep' && <th className="p-4">Sales Rep</th>}
                  <th className="p-4">Pre-Execution Checklist</th>
                  <th className="p-4">Dispatch Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === 'sales_rep' ? 7 : 8} className="p-8 text-center text-muted-foreground italic bg-muted/5">
                      No orders matching your search query.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const { salesDone, finDone } = getChecklistCount(order)
                    const dispatchDone = getDispatchCount(order)
                    const totalChecklist = salesDone + finDone
                    
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors group"
                      >
                        <td className="p-4 font-bold text-foreground">{order.order_number}</td>
                        <td className="p-4 font-medium text-foreground">{order.title}</td>
                        <td className="p-4 text-muted-foreground">{order.customer_name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {order.oem || 'N/A'}
                          </span>
                        </td>
                        {user.role !== 'sales_rep' && (
                          <td className="p-4 text-muted-foreground font-medium">{order.sales_rep_name}</td>
                        )}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground font-semibold">Sales:</span>
                              <span className={`font-bold ${salesDone === 6 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {salesDone}/6
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">Finance:</span>
                              <span className={`font-bold ${finDone === 6 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {finDone}/6
                              </span>
                            </div>
                            <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${(totalChecklist / 12) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${dispatchDone === 6 ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {dispatchDone}/6 stages
                            </span>
                            {dispatchDone > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                Shipped
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
