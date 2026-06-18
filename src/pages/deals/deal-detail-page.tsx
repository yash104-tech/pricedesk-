import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Printer, User, Building, Landmark, Percent, CheckSquare, Coins, ListCollapse, Clock, Share2, FileDown, Check } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PipelineTracker } from '@/components/approval/pipeline-tracker'
import { ApprovalActions } from '@/components/deals/approval-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { fetchDealAudit, fetchDealById } from '@/services/deals-service'
import { updateDeal } from '@/store/deals-slice'
import { DEAL_STATUS_LABELS, type Deal, type DealAudit } from '@/types'
import { cn, formatCurrency, formatPercent, formatDate, formatRelative, getMarginColor } from '@/lib/utils'

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const dispatch = useDispatch()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [audit, setAudit] = useState<DealAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'overheads'>('details')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const [d, a] = await Promise.all([
          fetchDealById(id),
          fetchDealAudit(id).catch((err) => {
            console.error('Failed to load deal audit trail:', err)
            return [] // Fallback to empty audit trail so the page doesn't go blank
          }),
        ])
        setDeal(d)
        setAudit(a)
        if (d) dispatch(updateDeal(d))
      } catch (err) {
        console.error('Failed to load deal details:', err)
        toast.error('Failed to load deal details. Check database indexes.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, dispatch])

  const handleUpdate = async (updated: Deal) => {
    setDeal(updated)
    dispatch(updateDeal(updated))
    toast.success(`Status: ${DEAL_STATUS_LABELS[updated.status]}`)
    try {
      const a = await fetchDealAudit(updated.id)
      setAudit(a)
    } catch (e) {
      console.error('Failed to reload audit timeline:', e)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-lg" />
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-lg shadow-sm">
        <p className="text-muted-foreground font-medium">Deal not found</p>
        <Button variant="link" onClick={() => navigate('/deals')} className="mt-2 text-primary font-semibold">
          Back to deals list
        </Button>
      </div>
    )
  }

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    approved: 'success',
    rejected: 'danger',
    changes_requested: 'warning',
    draft: 'default',
  }


  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: deal?.title, text: `Pricing Deal: ${deal?.deal_number}`, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportCSV = () => {
    if (!deal) return
    const rows = [
      ['Deal Number', 'Title', 'Customer', 'Status', 'Total Revenue', 'Total Cost', 'Net Margin %'],
      [deal.deal_number, deal.title, deal.customer_name, deal.status, deal.total_revenue, deal.total_cost, deal.net_margin_pct.toFixed(2)],
      [],
      ['SKU', 'Product Name', 'Qty', 'UoM', 'Transfer Price', 'Quoted Price'],
      ...(deal.items ?? []).map((i) => [i.sku, i.product_name, i.quantity, i.unit_of_measure, i.transfer_price, i.quoted_price]),
    ]
    const csv = rows.map((r) => r.map(String).map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${deal.deal_number}.csv`
    link.click()
    toast.success('CSV exported!')
  }



  return (
    <div className="space-y-6 print:p-0 print-scale">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm !important;
          }
          
          html, body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-scale {
            zoom: 0.82 !important;
          }

          /* Override tailwind gaps and paddings for super compact print */
          .print-scale .space-y-6 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 10px !important;
          }
          .print-scale .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 8px !important;
          }
          .print-scale .p-6 {
            padding: 12px !important;
          }
          .print-scale .pt-6 {
            padding-top: 10px !important;
          }
          .print-scale .pb-4 {
            padding-bottom: 8px !important;
          }
          .print-scale .mt-6 {
            margin-top: 10px !important;
          }
          .print-scale .py-3 {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }
          .print-scale table th {
            padding-bottom: 4px !important;
          }
          .print-scale table td {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }

          /* Page breaks inside tables should be avoided */
          tr, td, th {
            page-break-inside: avoid !important;
          }
          
          /* Remove shadow borders */
          .print-scale .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}} />
      {/* Salesforce Highlight Panel */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pricing Deal</span>
                <Badge variant={statusVariant[deal.status] ?? 'warning'}>
                  {DEAL_STATUS_LABELS[deal.status]}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground mt-0.5">{deal.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="text-xs h-8 gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            {(deal.status === 'draft' || deal.status === 'changes_requested' || deal.status === 'rejected') && (user.role === 'sales_rep' || user.role === 'admin') && (
              <Button size="sm" onClick={() => navigate(`/deals/${deal.id}/edit`)} className="text-xs h-8 bg-primary hover:bg-primary/95 text-white font-semibold">
                Edit Proposal
              </Button>
            )}

            {/* Share button */}
            <Button variant="outline" size="sm" onClick={handleShare} className="text-xs h-8 gap-1">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </Button>

            {/* Export CSV button */}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs h-8 gap-1">
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            {/* Print button */}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs h-8 gap-1">
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>

        {/* Highlight Panel Key Fields */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 text-xs">
          <div className="border-r border-border/50 pr-4 last:border-0">
            <p className="text-muted-foreground font-semibold flex items-center gap-1">
              <Coins className="h-3 w-3" /> Deal Number
            </p>
            <p className="font-mono font-bold text-primary mt-1 text-sm">{deal.deal_number}</p>
          </div>
          <div className="border-r border-border/50 pr-4 last:border-0">
            <p className="text-muted-foreground font-semibold flex items-center gap-1">
              <Building className="h-3 w-3" /> Customer Account
            </p>
            <p className="font-semibold text-foreground mt-1 truncate text-sm" title={deal.customer_name}>
              {deal.customer_name}
            </p>
          </div>
          <div className="border-r border-border/50 pr-4 last:border-0">
            <p className="text-muted-foreground font-semibold flex items-center gap-1">
              <User className="h-3 w-3" /> Deal Owner
            </p>
            <p className="font-semibold text-foreground mt-1 truncate text-sm">
              {deal.creator?.full_name ?? 'System'}
            </p>
          </div>
          <div className="border-r border-border/50 pr-4 last:border-0">
            <p className="text-muted-foreground font-semibold flex items-center gap-1">
              <Landmark className="h-3 w-3" /> Total Revenue
            </p>
            <p className="font-bold text-foreground mt-1 text-sm">
              {formatCurrency(deal.total_revenue, deal.currency)}
            </p>
          </div>
          <div className="border-r border-border/50 pr-4 last:border-0">
            <p className="text-muted-foreground font-semibold flex items-center gap-1">
              <Percent className="h-3 w-3" /> Net Margin
            </p>
            <p className={cn('font-bold mt-1 text-sm', getMarginColor(deal.net_margin_pct))}>
              {formatPercent(deal.net_margin_pct)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold flex items-center gap-1">
              <CheckSquare className="h-3 w-3" /> Technical Review
            </p>
            <p className="font-semibold text-foreground mt-1 text-sm">
              {deal.requires_technical ? (
                <span className="text-primary font-bold">Required</span>
              ) : (
                <span className="text-muted-foreground">Not Required</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Chevron Tracker ("Salesforce Path") */}
      <Card className="shadow-sm border-border bg-card print:hidden">
        <CardContent className="p-3">
          <PipelineTracker currentStatus={deal.status} requiresTechnical={deal.requires_technical} />
        </CardContent>
      </Card>

      {/* Two-Column Split Layout */}
      <div className="grid gap-6 lg:grid-cols-3 print:block">
        {/* Left Columns - Details, Line Items, Overheads Tabs */}
        <div className="lg:col-span-2 space-y-6 print:w-full print:space-y-4">
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            {/* Tabs Selector Header - Hidden on Print */}
            <div className="flex border-b border-border bg-muted/20 print:hidden">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  "px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'details'
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <ListCollapse className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={cn(
                  "px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'items'
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <ListCollapse className="h-4 w-4" />
                Line Items ({(deal.items ?? []).length})
              </button>
              <button
                onClick={() => setActiveTab('overheads')}
                className={cn(
                  "px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'overheads'
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Coins className="h-4 w-4" />
                Overhead Costs ({(deal.overheads ?? []).length})
              </button>
            </div>

            <CardContent className="p-6 print:space-y-8">
              {/* DETAILS SECTION */}
              <div className={cn(activeTab === 'details' ? 'block' : 'hidden print:block', 'space-y-6')}>
                {deal.description && (
                  <div className="bg-muted/30 p-4 rounded border border-border/40">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Deal Scope & Description</h4>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{deal.description}</p>
                  </div>
                )}

                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 text-sm">
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Customer Account</span>
                    <span className="font-semibold text-foreground">{deal.customer_name}</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Currency</span>
                    <span className="font-semibold text-foreground font-mono">{deal.currency}</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Pipeline Status</span>
                    <span className="font-semibold text-foreground">{DEAL_STATUS_LABELS[deal.status]}</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Deal Owner (Sales Rep)</span>
                    <span className="font-semibold text-foreground">{deal.creator?.full_name} ({deal.creator?.email})</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Assigned Reviewer</span>
                    <span className="font-semibold text-foreground">{deal.assigned_to ? 'Assigned' : 'General Queue'}</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Technical Review Required</span>
                    <span className="font-semibold text-foreground">{deal.requires_technical ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Created Date</span>
                    <span className="font-semibold text-foreground">{formatDate(deal.created_at)}</span>
                  </div>
                  <div className="border-b border-border/40 pb-2 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Last Modified Date</span>
                    <span className="font-semibold text-foreground">{formatDate(deal.updated_at)}</span>
                  </div>
                </div>

                {/* Pricing Financial Cards grid inside Details */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 print:grid-cols-4">
                  <div className="bg-muted/20 border border-border p-3.5 rounded text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</p>
                    <p className="text-lg font-bold mt-1 text-foreground">{formatCurrency(deal.total_revenue, deal.currency)}</p>
                  </div>
                  <div className="bg-muted/20 border border-border p-3.5 rounded text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Costs</p>
                    <p className="text-lg font-bold mt-1 text-foreground">{formatCurrency(deal.total_cost, deal.currency)}</p>
                  </div>
                  <div className="bg-muted/20 border border-border p-3.5 rounded text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gross Margin</p>
                    <p className={cn('text-lg font-bold mt-1', getMarginColor(deal.gross_margin_pct))}>{formatPercent(deal.gross_margin_pct)}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 p-3.5 rounded text-center">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Net Margin</p>
                    <p className={cn('text-xl font-extrabold mt-1', getMarginColor(deal.net_margin_pct))}>{formatPercent(deal.net_margin_pct)}</p>
                  </div>
                </div>
              </div>

              {/* LINE ITEMS SECTION */}
              <div className={cn(activeTab === 'items' ? 'block' : 'hidden print:block', 'space-y-4 print:border-t print:pt-6 print:mt-6')}>
                <h3 className="hidden print:block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Line Items ({(deal.items ?? []).length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="pb-2">Product Name / SKU</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2">UoM</th>
                        <th className="pb-2 text-right">Transfer Cost</th>
                        <th className="pb-2 text-right">Quoted Price</th>
                        <th className="pb-2 text-right">Gross Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deal.items ?? []).map((item, i) => {
                        const rev = item.quantity * item.quoted_price
                        const cost = item.quantity * item.transfer_price
                        const margin = rev > 0 ? ((rev - cost) / rev) * 100 : 0
                        return (
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                            <td className="py-3 font-semibold text-foreground">{item.sku}</td>
                            <td className="py-3 text-muted-foreground text-xs italic">{item.product_name}</td>
                            <td className="py-3 text-right">{item.quantity}</td>
                            <td className="py-3 text-muted-foreground text-xs">{item.unit_of_measure}</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(item.transfer_price, deal.currency)}</td>
                            <td className="py-3 text-right font-mono font-medium text-foreground">{formatCurrency(item.quoted_price, deal.currency)}</td>
                            <td className={cn('py-3 text-right font-bold', getMarginColor(margin))}>
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {(deal.items ?? []).length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">No line items configured on this deal.</div>
                  )}
                </div>
              </div>

              {/* OVERHEADS SECTION */}
              <div className={cn(activeTab === 'overheads' ? 'block' : 'hidden print:block', 'space-y-4 print:border-t print:pt-6 print:mt-6')}>
                <h3 className="hidden print:block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Overhead Costs ({(deal.overheads ?? []).length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="pb-2">Overhead Component</th>
                        <th className="pb-2 text-right">Rate / Percentage</th>
                        <th className="pb-2 text-right">Allocated Cost Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deal.overheads ?? []).map((oh, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                          <td className="py-3 font-medium text-foreground">{oh.label}</td>
                          <td className="py-3 text-right font-semibold">
                            {oh.is_percentage ? (
                              <Badge variant="outline" className="font-mono text-xs">{oh.percentage_value}%</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-foreground">
                            {formatCurrency(oh.amount, deal.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(deal.overheads ?? []).length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">No overhead cost factors added.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions Panel & Audit Trail */}
        <div className="space-y-6 print:hidden">
          {/* Approval Actions Panel */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="border-b border-border/50 bg-muted/10 py-3.5 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Approval Console
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {deal.rejection_reason && (
                <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-xs mb-4 text-amber-800 dark:text-amber-300">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <Clock className="h-3.5 w-3.5" /> Reviewer Feedback:
                  </span>
                  &ldquo;{deal.rejection_reason}&rdquo;
                </div>
              )}

              <ApprovalActions
                deal={deal}
                userRole={user.role}
                userId={user.id}
                onUpdate={handleUpdate}
              />
            </CardContent>
          </Card>

          {/* Audit History List */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="border-b border-border/50 bg-muted/10 py-3.5 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
                {audit.map((entry) => (
                  <motion.div
                    key={entry.id}
                    className="relative pl-6 text-xs"
                  >
                    <div className="absolute left-[5px] top-1.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-primary flex items-center justify-center shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="bg-muted/10 border border-border/40 p-2.5 rounded shadow-sm">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-semibold text-foreground capitalize">
                          {entry.action.replace('_', ' ')}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatRelative(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        By {entry.user?.full_name ?? 'System'}
                      </p>
                      {entry.comment && (
                        <p className="text-[11px] mt-1.5 text-foreground italic border-t border-border/30 pt-1.5">
                          &ldquo;{entry.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Initial Creation item */}
                <div className="relative pl-6 text-xs">
                  <div className="absolute left-[5px] top-1.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="bg-muted/10 border border-border/30 p-2.5 rounded">
                    <p className="font-semibold text-muted-foreground">Deal Created</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(deal.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
