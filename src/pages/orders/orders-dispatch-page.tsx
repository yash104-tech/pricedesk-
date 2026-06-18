import React, { useEffect, useState } from 'react'
import { RefreshCw, ChevronDown, Truck, ShieldAlert, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { fetchOrders, saveOrder } from '@/services/orders-service'
import type { Order, OrderDispatch } from '@/types'
import { toast } from 'sonner'

export function OrdersDispatchPage() {
  const user = useAuthStore((s) => s.user)!
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [editingDispatch, setEditingDispatch] = useState<OrderDispatch | null>(null)

  const isSalesRepOrAdmin = user.role === 'sales_rep' || user.role === 'admin'
  const isFinanceOrAdmin = user.role === 'finance' || user.role === 'admin'
  const isReadOnly = user.role !== 'sales_rep' && user.role !== 'finance' && user.role !== 'admin'

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

  useEffect(() => {
    loadOrders()
  }, [user])

  const toggleExpand = (orderId: string, currentDispatch: OrderDispatch) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      setEditingDispatch(null)
    } else {
      setExpandedOrderId(orderId)
      setEditingDispatch({ ...currentDispatch })
    }
  }

  const handleFieldChange = (key: keyof OrderDispatch, value: any) => {
    if (editingDispatch) {
      setEditingDispatch({
        ...editingDispatch,
        [key]: value
      })
    }
  }

  const handleSaveInlineDispatch = async (order: Order) => {
    if (!editingDispatch) return
    const toastId = toast.loading('Saving dispatch updates...')
    try {
      const updated = await saveOrder({
        ...order,
        dispatch: editingDispatch
      }, user.id)
      setOrders(orders.map((o) => (o.id === order.id ? updated : o)))
      toast.success('Dispatch details saved successfully.', { id: toastId })
      setExpandedOrderId(null)
      setEditingDispatch(null)
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to save dispatch details.', { id: toastId })
    }
  }

  const getDispatchStatus = (order: Order) => {
    const dispatch = order.dispatch
    const milestones = [
      { name: 'Dispatched', val: dispatch.material_dispatched_sales || dispatch.material_dispatched_finance },
      { name: 'Received', val: dispatch.material_received_sales || dispatch.material_received_finance },
      { name: 'Installed', val: dispatch.installation_completed_sales || dispatch.installation_completed_finance },
      { name: 'Accepted', val: dispatch.customer_acceptance_sales || dispatch.customer_acceptance_finance },
      { name: 'Invoiced', val: dispatch.invoice_raised_sales || dispatch.invoice_raised_finance },
      { name: 'Paid', val: dispatch.payment_received_sales || dispatch.payment_received_finance }
    ]
    const completedCount = milestones.filter(m => m.val).length
    return { milestones, completedCount }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fulfillment Tracking</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-bold font-display text-foreground">Dispatch Details</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="icon" onClick={loadOrders} title="Refresh list" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border rounded-lg shadow-sm p-4 text-xs">
        <div>
          <p className="text-muted-foreground font-semibold">Active Shipments</p>
          <p className="font-bold text-foreground mt-1 text-sm">
            {orders.filter((o) => {
              const { completedCount } = getDispatchStatus(o)
              return completedCount > 0 && completedCount < 6
            }).length} order(s)
          </p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold">Fully Completed / Delivered</p>
          <p className="font-bold text-foreground mt-1 text-sm">
            {orders.filter((o) => getDispatchStatus(o).completedCount === 6).length} order(s)
          </p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold">Not Dispatched Yet</p>
          <p className="font-bold text-foreground mt-1 text-sm">
            {orders.filter((o) => getDispatchStatus(o).completedCount === 0).length} order(s)
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg h-96 animate-pulse shadow-sm" />
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Orders Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            There are no active orders in your queue for dispatch tracking.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">OEM</th>
                  <th className="p-4">Milestone Progress</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {orders.map((order) => {
                  const { milestones, completedCount } = getDispatchStatus(order)
                  
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={() => toggleExpand(order.id, order.dispatch)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors group"
                      >
                        <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleExpand(order.id, order.dispatch)}
                            className="p-1 hover:bg-slate-100 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                        <td className="p-4 font-bold text-foreground hover:text-primary transition-colors">
                          {order.order_number}
                        </td>
                        <td className="p-4 font-medium text-foreground">{order.customer_name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {order.oem || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {milestones.map((m, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  m.val
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                {m.val ? (
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                ) : (
                                  <Circle className="h-2.5 w-2.5 text-slate-300" />
                                )}
                                {m.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          {completedCount === 6 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Fulfillment Complete
                            </span>
                          ) : completedCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                              In Progress ({completedCount}/6)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Not Started
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-sky-600 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                      {expandedOrderId === order.id && editingDispatch && (
                        <tr className="bg-slate-50/50 hover:bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                          <td colSpan={7} className="p-4 border-t border-b border-border/60">
                            <div className="bg-card border border-border/60 rounded-lg shadow-sm p-4 space-y-4 max-w-4xl mx-auto">
                              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-sky-600" />
                                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                                    Dispatch Details - {order.order_number}
                                  </span>
                                </div>
                                {isReadOnly && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" />
                                    Read Only
                                  </span>
                                )}
                              </div>

                              <div className="border border-border/50 rounded-md overflow-hidden bg-white">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-muted/30 border-b border-border/40 text-[10px] font-bold text-muted-foreground uppercase">
                                      <th className="p-2.5 w-1/3">Milestone Event</th>
                                      <th className="p-2.5 text-center w-28">Sales Verified</th>
                                      <th className="p-2.5 text-center w-28">Finance Verified</th>
                                      <th className="p-2.5">Fulfillment Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30 font-medium text-xs">
                                    {/* Material Dispatched */}
                                    <tr className="hover:bg-slate-50/45">
                                      <td className="p-2.5 font-semibold text-foreground">Material Dispatched</td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isSalesRepOrAdmin}
                                          checked={editingDispatch.material_dispatched_sales}
                                          onChange={(e) => handleFieldChange('material_dispatched_sales', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isFinanceOrAdmin}
                                          checked={editingDispatch.material_dispatched_finance}
                                          onChange={(e) => handleFieldChange('material_dispatched_finance', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editingDispatch.material_dispatched_remarks}
                                          disabled={isReadOnly}
                                          onChange={(e) => handleFieldChange('material_dispatched_remarks', e.target.value)}
                                          className="w-full h-8 px-2.5 text-xs bg-slate-50/30 border border-slate-200 rounded focus:border-slate-300 focus:outline-none"
                                          placeholder="Remarks / Courier details"
                                        />
                                      </td>
                                    </tr>

                                    {/* Material Received */}
                                    <tr className="hover:bg-slate-50/45">
                                      <td className="p-2.5 font-semibold text-foreground">Material Received</td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isSalesRepOrAdmin}
                                          checked={editingDispatch.material_received_sales}
                                          onChange={(e) => handleFieldChange('material_received_sales', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isFinanceOrAdmin}
                                          checked={editingDispatch.material_received_finance}
                                          onChange={(e) => handleFieldChange('material_received_finance', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editingDispatch.material_received_remarks}
                                          disabled={isReadOnly}
                                          onChange={(e) => handleFieldChange('material_received_remarks', e.target.value)}
                                          className="w-full h-8 px-2.5 text-xs bg-slate-50/30 border border-slate-200 rounded focus:border-slate-300 focus:outline-none"
                                          placeholder="Sign-off details"
                                        />
                                      </td>
                                    </tr>

                                    {/* Installation Completed */}
                                    <tr className="hover:bg-slate-50/45">
                                      <td className="p-2.5 font-semibold text-foreground">Installation Completed</td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isSalesRepOrAdmin}
                                          checked={editingDispatch.installation_completed_sales}
                                          onChange={(e) => handleFieldChange('installation_completed_sales', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isFinanceOrAdmin}
                                          checked={editingDispatch.installation_completed_finance}
                                          onChange={(e) => handleFieldChange('installation_completed_finance', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editingDispatch.installation_completed_remarks}
                                          disabled={isReadOnly}
                                          onChange={(e) => handleFieldChange('installation_completed_remarks', e.target.value)}
                                          className="w-full h-8 px-2.5 text-xs bg-slate-50/30 border border-slate-200 rounded focus:border-slate-300 focus:outline-none"
                                          placeholder="Installation remarks"
                                        />
                                      </td>
                                    </tr>

                                    {/* Customer Acceptance */}
                                    <tr className="hover:bg-slate-50/45">
                                      <td className="p-2.5 font-semibold text-foreground">Customer Acceptance</td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isSalesRepOrAdmin}
                                          checked={editingDispatch.customer_acceptance_sales}
                                          onChange={(e) => handleFieldChange('customer_acceptance_sales', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isFinanceOrAdmin}
                                          checked={editingDispatch.customer_acceptance_finance}
                                          onChange={(e) => handleFieldChange('customer_acceptance_finance', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editingDispatch.customer_acceptance_remarks}
                                          disabled={isReadOnly}
                                          onChange={(e) => handleFieldChange('customer_acceptance_remarks', e.target.value)}
                                          className="w-full h-8 px-2.5 text-xs bg-slate-50/30 border border-slate-200 rounded focus:border-slate-300 focus:outline-none"
                                          placeholder="Acceptance reference"
                                        />
                                      </td>
                                    </tr>

                                    {/* Invoice Raised */}
                                    <tr className="hover:bg-slate-50/45">
                                      <td className="p-2.5 font-semibold text-foreground">Invoice Raised</td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isSalesRepOrAdmin}
                                          checked={editingDispatch.invoice_raised_sales}
                                          onChange={(e) => handleFieldChange('invoice_raised_sales', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isFinanceOrAdmin}
                                          checked={editingDispatch.invoice_raised_finance}
                                          onChange={(e) => handleFieldChange('invoice_raised_finance', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editingDispatch.invoice_raised_remarks}
                                          disabled={isReadOnly}
                                          onChange={(e) => handleFieldChange('invoice_raised_remarks', e.target.value)}
                                          className="w-full h-8 px-2.5 text-xs bg-slate-50/30 border border-slate-200 rounded focus:border-slate-300 focus:outline-none"
                                          placeholder="Invoice number reference"
                                        />
                                      </td>
                                    </tr>

                                    {/* Payment Received */}
                                    <tr className="hover:bg-slate-50/45">
                                      <td className="p-2.5 font-semibold text-foreground">Payment Received</td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isSalesRepOrAdmin}
                                          checked={editingDispatch.payment_received_sales}
                                          onChange={(e) => handleFieldChange('payment_received_sales', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          disabled={!isFinanceOrAdmin}
                                          checked={editingDispatch.payment_received_finance}
                                          onChange={(e) => handleFieldChange('payment_received_finance', e.target.checked)}
                                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={editingDispatch.payment_received_remarks}
                                          disabled={isReadOnly}
                                          onChange={(e) => handleFieldChange('payment_received_remarks', e.target.value)}
                                          className="w-full h-8 px-2.5 text-xs bg-slate-50/30 border border-slate-200 rounded focus:border-slate-300 focus:outline-none"
                                          placeholder="Payment remarks"
                                        />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {!isReadOnly && (
                                <div className="flex justify-end gap-2 text-xs pt-1">
                                  <Button
                                    onClick={() => {
                                      setExpandedOrderId(null)
                                      setEditingDispatch(null)
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 font-semibold text-[11px] cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleSaveInlineDispatch(order)}
                                    className="h-8 font-semibold text-[11px] px-4 bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/10 cursor-pointer"
                                  >
                                    Save Dispatch Details
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
