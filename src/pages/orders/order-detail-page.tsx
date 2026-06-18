import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { fetchOrderById, saveOrder } from '@/services/orders-service'
import type { Order, OrderChecklist } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ShieldAlert, ClipboardCheck, FileSpreadsheet, Package, ArrowLeft } from 'lucide-react'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'commercials' | 'checklist' | 'dispatch'>('commercials')
  const [saving, setSaving] = useState(false)

  // Local state for editing checklist
  const [checklist, setChecklist] = useState<OrderChecklist>({
    customer_po_received_sales: false,
    customer_po_received_finance: false,
    customer_po_received_remarks: '',

    commercials_validated_sales: false,
    commercials_validated_finance: false,
    commercials_validated_remarks: '',

    supplier_quote_approved_sales: false,
    supplier_quote_approved_finance: false,
    supplier_quote_approved_remarks: '',

    supplier_po_released_sales: false,
    supplier_po_released_finance: false,
    supplier_po_released_remarks: '',

    advance_payment_made_sales: false,
    advance_payment_made_finance: false,
    advance_payment_made_remarks: '',

    order_acknowledged_sales: false,
    order_acknowledged_finance: false,
    order_acknowledged_remarks: '',
  })

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await fetchOrderById(id)
        if (data) {
          setOrder(data)
          setChecklist(data.checklist)
        } else {
          toast.error('Order not found')
          navigate('/orders')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id])

  const handleSaveChecklist = async () => {
    if (!order) return
    setSaving(true)
    const toastId = toast.loading('Saving checklist changes...')
    try {
      const updated = await saveOrder({
        ...order,
        checklist
      }, user.id)
      setOrder(updated)
      toast.success('Pre-execution checklist updated successfully.', { id: toastId })
      navigate('/orders/dispatch')
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to save checklist.', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="bg-card border border-border rounded-lg h-96 animate-pulse shadow-sm" />
  }

  if (!order) return null

  // Role gating variables
  const isSalesRepOrAdmin = user.role === 'sales_rep' || user.role === 'admin'
  const isFinanceOrAdmin = user.role === 'finance' || user.role === 'admin'
  const isReadOnly = user.role !== 'sales_rep' && user.role !== 'finance' && user.role !== 'admin'

  return (
    <div className="space-y-6">
      {/* Back to list */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/orders')} className="h-8 text-xs font-semibold">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Orders
        </Button>
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Order Identity: {order.order_number}
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Order worksheet • {order.customer_name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-bold font-display text-foreground">{order.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list (custom local state implementation for extreme safety and style) */}
      <div className="flex border-b border-border/60 gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('commercials')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold transition-all rounded-t-lg border-b-2 hover:bg-muted/30 cursor-pointer ${
            activeTab === 'commercials'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>1. Commercial Order worksheet</span>
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold transition-all rounded-t-lg border-b-2 hover:bg-muted/30 cursor-pointer ${
            activeTab === 'checklist'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>2. Pre-Execution Checklist</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4 transition-all duration-300">
        
        {/* Tab 1: Commercial Details */}
        {activeTab === 'commercials' && (
          <div className="space-y-6">
            {/* Meta values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quote Commercials</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Quote Number:</span>
                    <span className="font-bold text-foreground">{order.quote_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Deal Reference:</span>
                    <span className="font-semibold text-muted-foreground font-mono text-[10px]">{order.deal_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">OEM Partner:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded text-[10px]">
                      {order.oem || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Sales Rep Account:</span>
                    <span className="font-semibold text-foreground">{order.sales_rep_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Initialized:</span>
                    <span className="font-semibold text-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Supplier &amp; Distributor Details</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Supplier Name:</span>
                    <span className="font-semibold text-foreground">{order.supplier_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Supplier Invoice:</span>
                    <span className="font-semibold text-foreground">{order.supplier_invoice || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-semibold text-foreground">{order.contact_person || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold text-foreground truncate max-w-[150px]">{order.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-semibold text-foreground">{order.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Quoted Value:</span>
                    <span className="font-semibold text-foreground">{order.quoted_value ? formatCurrency(order.quoted_value) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span className="font-semibold text-foreground">{order.payment_terms || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Delivery:</span>
                    <span className="font-semibold text-foreground">{order.expected_delivery_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Commercial Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(order.items.reduce((sum, item) => sum + item.quoted_price * item.quantity, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5">
                    <span className="text-muted-foreground">Total Cost Structure:</span>
                    <span className="font-semibold text-muted-foreground">
                      {formatCurrency(order.items.reduce((sum, item) => sum + item.transfer_price * item.quantity, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fulfillment Status:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                      Operational
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Order Items List</h3>
              <div className="border border-border/50 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase">
                      <th className="p-3">Product Name / SKU *</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3 text-right">Transfer Price (TP)</th>
                      <th className="p-3 text-right">Quoted Price (QP)</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {order.items.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="p-3">
                          <span className="font-bold text-foreground">{item.product_name}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">SKU: {item.sku}</span>
                        </td>
                        <td className="p-3 text-foreground">{item.quantity}</td>
                        <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.transfer_price)}</td>
                        <td className="p-3 text-right text-foreground">{formatCurrency(item.quoted_price)}</td>
                        <td className="p-3 text-right text-foreground font-bold">
                          {formatCurrency(item.quoted_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pr-1">
              <Button onClick={() => setActiveTab('checklist')} size="sm" className="h-9 font-semibold text-xs px-4">
                Proceed to Checklist
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Pre-Execution Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/50 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Order Commercial Check-list</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Dual-authorization requirements for order validation before purchase release.</p>
                </div>
                {isReadOnly && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded flex items-center gap-1.5 shrink-0">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Read Only (Authorized for Sales Rep / Finance)
                  </span>
                )}
              </div>

              {/* Grid table */}
              <div className="border border-border/50 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase">
                      <th className="p-3 w-1/3">Checklist Item</th>
                      <th className="p-3 text-center w-24">Sales</th>
                      <th className="p-3 text-center w-24">Finance</th>
                      <th className="p-3">Remarks / References</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium text-xs">
                    {/* Item 1: Customer PO Received */}
                    <tr className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">Customer PO Received</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSalesRepOrAdmin}
                          checked={checklist.customer_po_received_sales}
                          onChange={(e) => setChecklist({ ...checklist, customer_po_received_sales: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isFinanceOrAdmin}
                          checked={checklist.customer_po_received_finance}
                          onChange={(e) => setChecklist({ ...checklist, customer_po_received_finance: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={checklist.customer_po_received_remarks}
                          disabled={isReadOnly}
                          onChange={(e) => setChecklist({ ...checklist, customer_po_received_remarks: e.target.value })}
                          className="h-8 text-xs bg-slate-50/50"
                          placeholder="e.g. PO Number references"
                        />
                      </td>
                    </tr>

                    {/* Item 2: Commercials Validated */}
                    <tr className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">Commercials Validated</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSalesRepOrAdmin}
                          checked={checklist.commercials_validated_sales}
                          onChange={(e) => setChecklist({ ...checklist, commercials_validated_sales: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isFinanceOrAdmin}
                          checked={checklist.commercials_validated_finance}
                          onChange={(e) => setChecklist({ ...checklist, commercials_validated_finance: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={checklist.commercials_validated_remarks}
                          disabled={isReadOnly}
                          onChange={(e) => setChecklist({ ...checklist, commercials_validated_remarks: e.target.value })}
                          className="h-8 text-xs bg-slate-50/50"
                          placeholder="e.g. Approved"
                        />
                      </td>
                    </tr>

                    {/* Item 3: Supplier Quote Approved */}
                    <tr className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">Supplier Quote Approved</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSalesRepOrAdmin}
                          checked={checklist.supplier_quote_approved_sales}
                          onChange={(e) => setChecklist({ ...checklist, supplier_quote_approved_sales: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isFinanceOrAdmin}
                          checked={checklist.supplier_quote_approved_finance}
                          onChange={(e) => setChecklist({ ...checklist, supplier_quote_approved_finance: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={checklist.supplier_quote_approved_remarks}
                          disabled={isReadOnly}
                          onChange={(e) => setChecklist({ ...checklist, supplier_quote_approved_remarks: e.target.value })}
                          className="h-8 text-xs bg-slate-50/50"
                          placeholder="Remarks"
                        />
                      </td>
                    </tr>

                    {/* Item 4: Supplier PO Released */}
                    <tr className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">Supplier PO Released</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSalesRepOrAdmin}
                          checked={checklist.supplier_po_released_sales}
                          onChange={(e) => setChecklist({ ...checklist, supplier_po_released_sales: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isFinanceOrAdmin}
                          checked={checklist.supplier_po_released_finance}
                          onChange={(e) => setChecklist({ ...checklist, supplier_po_released_finance: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={checklist.supplier_po_released_remarks}
                          disabled={isReadOnly}
                          onChange={(e) => setChecklist({ ...checklist, supplier_po_released_remarks: e.target.value })}
                          className="h-8 text-xs bg-slate-50/50"
                          placeholder="e.g. PO Number reference"
                        />
                      </td>
                    </tr>

                    {/* Item 5: Advance Payment Made */}
                    <tr className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">Advance Payment Made</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSalesRepOrAdmin}
                          checked={checklist.advance_payment_made_sales}
                          onChange={(e) => setChecklist({ ...checklist, advance_payment_made_sales: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isFinanceOrAdmin}
                          checked={checklist.advance_payment_made_finance}
                          onChange={(e) => setChecklist({ ...checklist, advance_payment_made_finance: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={checklist.advance_payment_made_remarks}
                          disabled={isReadOnly}
                          onChange={(e) => setChecklist({ ...checklist, advance_payment_made_remarks: e.target.value })}
                          className="h-8 text-xs bg-slate-50/50"
                          placeholder="e.g. Payment terms details"
                        />
                      </td>
                    </tr>

                    {/* Item 6: Order Acknowledged by Supplier */}
                    <tr className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">Order Acknowledged by Supplier</td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSalesRepOrAdmin}
                          checked={checklist.order_acknowledged_sales}
                          onChange={(e) => setChecklist({ ...checklist, order_acknowledged_sales: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!isFinanceOrAdmin}
                          checked={checklist.order_acknowledged_finance}
                          onChange={(e) => setChecklist({ ...checklist, order_acknowledged_finance: e.target.checked })}
                          className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={checklist.order_acknowledged_remarks}
                          disabled={isReadOnly}
                          onChange={(e) => setChecklist({ ...checklist, order_acknowledged_remarks: e.target.value })}
                          className="h-8 text-xs bg-slate-50/50"
                          placeholder="Remarks"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save checklist button */}
            {!isReadOnly && (
              <div className="flex justify-end pr-1 gap-2">
                <Button
                  onClick={handleSaveChecklist}
                  disabled={saving}
                  className="h-10 text-xs font-semibold px-5 bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md shadow-sky-600/10"
                >
                  {saving ? 'Saving...' : 'Save & Proceed to Dispatch'}
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
