import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { fetchDeals } from '@/services/deals-service'
import { saveOrder } from '@/services/orders-service'
import type { Deal } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export function OrderNewPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const [approvedDeals, setApprovedDeals] = useState<Deal[]>([])
  const [loadingDeals, setLoadingDeals] = useState(true)
  
  // Selected deal details
  const [selectedDealId, setSelectedDealId] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  
  // Input fields
  const [oem, setOem] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [supplierInvoice, setSupplierInvoice] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [quotedValue, setQuotedValue] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadApprovedDeals = async () => {
      setLoadingDeals(true)
      try {
        const deals = await fetchDeals(user.role, user.id)
        // Filter only approved deals that don't already have an order
        const approved = deals.filter((d) => d.status === 'approved')
        setApprovedDeals(approved)
      } catch (e) {
        console.error('Failed to load deals:', e)
      } finally {
        setLoadingDeals(false)
      }
    }
    loadApprovedDeals()
  }, [user])

  const handleDealChange = (dealId: string) => {
    setSelectedDealId(dealId)
    const deal = approvedDeals.find((d) => d.id === dealId) || null
    setSelectedDeal(deal)
    // Auto-fill OEM from the deal if available
    if (deal?.oem) {
      setOem(deal.oem)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDeal) {
      toast.error('Please select an approved quote/deal first.')
      return
    }

    if (!supplierName.trim()) {
      toast.error('Please enter supplier name.')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading('Initializing order sheet...')

    try {
      const order = await saveOrder({
        deal_id: selectedDeal.id,
        deal_number: selectedDeal.deal_number,
        title: selectedDeal.title,
        customer_name: selectedDeal.customer_name,
        customer_id: selectedDeal.customer_id,
        sales_rep_id: selectedDeal.created_by || user.id,
        sales_rep_name: selectedDeal.creator?.full_name || user.full_name,
        oem: oem.trim(),
        quote_number: selectedDeal.quote_number || null,
        supplier_name: supplierName.trim(),
        supplier_invoice: supplierInvoice.trim(),
        contact_person: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        quoted_value: Number(quotedValue) || 0,
        payment_terms: paymentTerms.trim(),
        expected_delivery_date: expectedDeliveryDate.trim(),
        items: selectedDeal.items || []
      }, user.id)

      toast.success('Order Worksheet initialized successfully!', { id: toastId })
      // Navigate to order detail page (checklist step)
      navigate(`/orders/${order.id}`)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Failed to create order.', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/orders')}
          className="h-8 text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Orders
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Object Creation</span>
          <h1 className="text-xl font-bold font-display text-foreground mt-0.5">Initialize Commercial Order</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal selection */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-5 md:p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 uppercase tracking-wider">
            1. Select Approved Quote/Deal
          </h3>
          <div>
            <Label htmlFor="dealSelect" className="text-xs font-semibold text-muted-foreground">Approved Quote Number</Label>
            {loadingDeals ? (
              <div className="h-10 bg-slate-100 animate-pulse rounded border border-slate-200 mt-1.5" />
            ) : approvedDeals.length === 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mt-1.5 flex items-center gap-2">
                <span>No approved deals available. Make sure you have deals that are **Fully Approved** in your pipeline.</span>
              </div>
            ) : (
              <select
                id="dealSelect"
                value={selectedDealId}
                onChange={(e) => handleDealChange(e.target.value)}
                className="w-full mt-1.5 h-10 px-3 border border-border rounded-md bg-slate-50/50 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-white focus:outline-none"
              >
                <option value="">-- Choose Approved Quote --</option>
                {approvedDeals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.quote_number ? `${deal.quote_number} (Ref: ${deal.deal_number})` : deal.deal_number} — {deal.title} ({deal.customer_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedDeal && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 border border-border/50 rounded-lg p-4 text-xs mt-4">
              <div>
                <span className="text-muted-foreground font-semibold">Customer Name</span>
                <p className="font-bold text-foreground mt-0.5">{selectedDeal.customer_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Sales rep</span>
                <p className="font-bold text-foreground mt-0.5">{user.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Total Revenue</span>
                <p className="font-bold text-foreground mt-0.5">{formatCurrency(selectedDeal.total_revenue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Deal Date</span>
                <p className="font-bold text-foreground mt-0.5">{new Date(selectedDeal.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {selectedDeal && (
          <>
            {/* Supplier / Distributor details */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 md:p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 uppercase tracking-wider">
                2. Supplier &amp; Distributor Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="supplierName" className="text-xs font-semibold text-muted-foreground">Supplier Name *</Label>
                  <Input
                    id="supplierName"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="e.g. Cisco Systems, India Electronics"
                    required
                  />
                </div>
                <div className="lg:col-span-2">
                  <Label htmlFor="supplierInvoice" className="text-xs font-semibold text-muted-foreground">Supplier Invoice</Label>
                  <Input
                    id="supplierInvoice"
                    value={supplierInvoice}
                    onChange={(e) => setSupplierInvoice(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="Invoice reference number"
                  />
                </div>
                <div>
                  <Label htmlFor="contact" className="text-xs font-semibold text-muted-foreground">Contact Person</Label>
                  <Input
                    id="contact"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="contact@supplier.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="Contact number"
                  />
                </div>
                <div>
                  <Label htmlFor="oem" className="text-xs font-semibold text-muted-foreground">OEM</Label>
                  <Input
                    id="oem"
                    value={oem}
                    onChange={(e) => setOem(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="e.g. Cisco, Aicera"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Label htmlFor="quotedValue" className="text-xs font-semibold text-muted-foreground">Quoted Value (INR)</Label>
                  <Input
                    id="quotedValue"
                    type="number"
                    value={quotedValue}
                    onChange={(e) => setQuotedValue(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms" className="text-xs font-semibold text-muted-foreground">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                    placeholder="e.g. Net 30, 50% Advance"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedDeliveryDate" className="text-xs font-semibold text-muted-foreground">Expected Delivery Date</Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="mt-1.5 h-10 text-xs bg-slate-50/50 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Order worksheet table */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-5 md:p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 uppercase tracking-wider">
                3. Order Work Sheet
              </h3>
              <div className="border border-border/60 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase">
                      <th className="p-3">Product Name / SKU *</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3 text-right">Transfer Price (TP)</th>
                      <th className="p-3 text-right">Quoted Price (QP)</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {(selectedDeal.items || []).map((item, i) => (
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

              {/* Commercial Order Summary */}
              <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-foreground">Commercial Order Summary</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Aggregates calculated based on approved line pricing.</p>
                </div>
                <div className="flex gap-6 font-semibold">
                  <div>
                    <span className="text-muted-foreground">Total Revenue</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(selectedDeal.total_revenue)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gross Margin %</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">{selectedDeal.gross_margin_pct}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net Margin %</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">{selectedDeal.net_margin_pct}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next button */}
            <div className="flex justify-end pr-2">
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 font-semibold text-xs px-6 bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md shadow-sky-600/10 transition-all duration-200"
              >
                {submitting ? 'Initializing...' : 'Next: Initialize Checklist'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
