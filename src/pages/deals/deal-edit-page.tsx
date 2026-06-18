import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DealBuilder } from '@/components/deals/deal-builder'
import { useAuthStore } from '@/stores/auth-store'
import { fetchDealById, saveDeal } from '@/services/deals-service'
import { useDispatch } from 'react-redux'
import { updateDeal } from '@/store/deals-slice'
import { FileEdit, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Deal } from '@/types'

export function DealEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)!
  const dispatch = useDispatch()
  
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const d = await fetchDealById(id)
        if (d) {
          // Check authorization: only creator (sales_rep) or admin can edit
          if (d.created_by !== user.id && user.role !== 'admin') {
            toast.error('You do not have permission to edit this deal')
            navigate(`/deals/${id}`)
            return
          }
          // Check state: only draft, changes_requested or rejected can be edited
          if (d.status !== 'draft' && d.status !== 'changes_requested' && d.status !== 'rejected') {
            toast.error('Only drafts, change requests, or rejected deals can be edited')
            navigate(`/deals/${id}`)
            return
          }
          setDeal(d)
        } else {
          toast.error('Deal not found')
          navigate('/deals')
        }
      } catch (e) {
        console.error(e)
        toast.error('Failed to load deal')
        navigate('/deals')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user, navigate])

  const handleSubmit = async (data: any, submitType: 'draft' | 'submit') => {
    setSaving(true)
    const isDraft = submitType === 'draft'
    try {
      const updated = await saveDeal(
        {
          ...data,
          id: id,
          deal_number: deal?.deal_number,
          status: isDraft ? 'draft' : (data.requires_technical ? 'pending_technical' : 'pending_finance'),
        },
        user.id
      )
      dispatch(updateDeal(updated))
      if (isDraft) {
        toast.success('Pricing request updated and saved as draft')
      } else {
        toast.success(data.requires_technical ? 'Pricing request resubmitted for Technical approval' : 'Pricing request resubmitted for Finance approval')
      }
      navigate(`/deals/${updated.id}`)
    } catch {
      toast.error(isDraft ? 'Failed to update pricing request' : 'Failed to resubmit pricing request')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!deal) return null

  return (
    <div className="space-y-6">
      {/* Salesforce Workspace Highlight Header Panel */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <FileEdit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pricing Revision Portal</span>
                <Badge variant="warning" className="text-[9px] py-0 px-2 font-semibold">
                  Edit Proposal ({deal.deal_number})
                </Badge>
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground mt-0.5">
                Modify Pricing Proposal
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revise pricing worksheet configurations, adjust overhead charges, and resubmit for reviews.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="text-xs h-8">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Cancel & Back
            </Button>
          </div>
        </div>
      </div>

      {/* Reworked Deal Builder Form prefilled with initialDeal */}
      <DealBuilder initialDeal={deal} onSubmit={handleSubmit} isSubmitting={saving} />
    </div>
  )
}
