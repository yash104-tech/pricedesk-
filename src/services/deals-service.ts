import type { Deal, DealAudit, DealItem, DealOverhead, DealStatus, UserRole } from '@/types'
import { calculateMargins } from '@/lib/margins'
import { getNextStatus } from '@/lib/workflow'
import { DEMO_USERS, MOCK_AUDIT_LOG, MOCK_DEALS, addMockDeal, appendMockAudit, updateMockDeal, appendMockNotification } from '@/lib/mock-data'
import type { AuditAction, User } from '@/types'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { sendWorkflowEmail } from '@/services/email-service'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore'

function filterDealsByRole(deals: Deal[], role: UserRole, userId: string): Deal[] {
  switch (role) {
    case 'sales_rep':
      return deals.filter((d) => d.created_by === userId)
    case 'technical':
      return deals.filter(
        (d) =>
          d.requires_technical &&
          d.status !== 'draft'
      )
    case 'finance':
      return deals.filter(
        (d) =>
          d.status !== 'draft' &&
          (!d.requires_technical || d.status !== 'pending_technical')
      )
    case 'sales_head':
      return deals.filter((d) =>
        ['pending_sales_head', 'approved', 'rejected'].includes(d.status)
      )
    case 'admin':
      return deals
    default:
      return deals
  }
}

export async function fetchDeals(role: UserRole, userId: string): Promise<Deal[]> {
  if (useAuthStore.getState().isDemo) {
    return filterDealsByRole([...MOCK_DEALS], role, userId)
  }
  
  const dealsCol = collection(db, 'deals')
  const q = query(dealsCol, orderBy('updated_at', 'desc'))
  const snap = await getDocs(q)
  const list: Deal[] = []
  
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as Deal)
  })
  
  return filterDealsByRole(list, role, userId)
}

export async function fetchDealById(id: string): Promise<Deal | null> {
  if (useAuthStore.getState().isDemo) {
    const deal = MOCK_DEALS.find((d) => d.id === id)
    return deal ?? null
  }
  
  const docSnap = await getDoc(doc(db, 'deals', id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as Deal
}

export async function fetchDealAudit(dealId: string): Promise<DealAudit[]> {
  if (useAuthStore.getState().isDemo) {
    return MOCK_AUDIT_LOG.filter((a) => a.deal_id === dealId)
  }
  
  const auditCol = collection(db, 'deal_audit')
  const q = query(auditCol, where('deal_id', '==', dealId))
  const snap = await getDocs(q)
  const list: DealAudit[] = []
  
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as DealAudit)
  })
  
  return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export async function saveDeal(
  deal: Partial<Deal> & {
    items: DealItem[]
    overheads: DealOverhead[]
  },
  userId: string
): Promise<Deal> {
  const margins = calculateMargins(deal.items ?? [], deal.overheads ?? [])
  
  if (useAuthStore.getState().isDemo) {
    const id = deal.id ?? `deal-${Date.now()}`
    const creatorUser = Object.values(DEMO_USERS).find((u) => u.id === userId)
    const saved: Deal = {
      id,
      deal_number:
        deal.deal_number ??
        `PD-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      title: deal.title ?? 'Untitled Deal',
      customer_name: deal.customer_name ?? '',
      customer_id: deal.customer_id,
      description: deal.description,
      status: deal.status ?? 'draft',
      created_by: userId,
      currency: deal.currency ?? 'INR',
      requires_technical: deal.requires_technical ?? false,
      oem: deal.oem ?? null,
      quote_number: deal.quote_number ?? null,
      total_revenue: margins.totalRevenue,
      total_cost: margins.totalCost,
      gross_margin_pct: margins.grossMarginPct,
      net_margin_pct: margins.netMarginPct,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: deal.items,
      overheads: deal.overheads,
      creator: creatorUser,
    }
    if (deal.id) {
      updateMockDeal(id, saved)
      if (saved.status === 'pending_technical') {
        appendMockNotification({
          user_id: 'demo-technical',
          deal_id: id,
          title: 'New deal awaiting review',
          message: `${saved.deal_number} — ${saved.title} has been submitted and is awaiting Technical Review.`,
          type: 'approval',
        })
      } else if (saved.status === 'pending_finance') {
        appendMockNotification({
          user_id: 'demo-finance',
          deal_id: id,
          title: 'New deal awaiting review',
          message: `${saved.deal_number} — ${saved.title} has been submitted and is awaiting Finance Review.`,
          type: 'approval',
        })
      }
    } else {
      addMockDeal(saved)
      appendMockAudit({
        deal_id: id,
        user_id: userId,
        action: (['pending_finance', 'pending_technical'].includes(deal.status ?? '') ? 'submitted' : 'created') as any,
        to_status: deal.status ?? 'draft',
        user: creatorUser,
      })
      if (saved.status === 'pending_technical') {
        appendMockNotification({
          user_id: 'demo-technical',
          deal_id: id,
          title: 'New deal awaiting review',
          message: `${saved.deal_number} — ${saved.title} has been submitted by ${creatorUser?.full_name ?? 'Sales Rep'} and is awaiting Technical Review.`,
          type: 'approval',
        })
      } else if (saved.status === 'pending_finance') {
        appendMockNotification({
          user_id: 'demo-finance',
          deal_id: id,
          title: 'New deal awaiting review',
          message: `${saved.deal_number} — ${saved.title} has been submitted by ${creatorUser?.full_name ?? 'Sales Rep'} and is awaiting Finance Review.`,
          type: 'approval',
        })
      }
    }
    return saved
  }

  // Live Firebase database save
  const id = deal.id ?? `deal-${Date.now()}`
  
  // Fetch creator user details to cache inside the deal doc
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const creatorUser = userSnap.exists() ? { id: userId, ...userSnap.data() } as User : undefined

  const saved: Deal = {
    id,
    deal_number:
      deal.deal_number ??
      `PD-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    title: deal.title ?? 'Untitled Deal',
    customer_name: deal.customer_name ?? '',
    customer_id: deal.customer_id,
    description: deal.description ?? '',
    status: deal.status ?? 'draft',
    created_by: userId,
    currency: deal.currency ?? 'INR',
    requires_technical: deal.requires_technical ?? false,
    oem: deal.oem ?? null,
    quote_number: deal.quote_number ?? null,
    total_revenue: margins.totalRevenue,
    total_cost: margins.totalCost,
    gross_margin_pct: margins.grossMarginPct,
    net_margin_pct: margins.netMarginPct,
    created_at: deal.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: deal.items,
    overheads: deal.overheads,
    creator: creatorUser,
  }

  await setDoc(doc(db, 'deals', id), saved)

  // Write audit entry
  const auditId = `audit-${Date.now()}`
  await setDoc(doc(db, 'deal_audit', auditId), {
    deal_id: id,
    user_id: userId,
    deal_number: saved.deal_number,
    deal_title: saved.title,
    action: (['pending_finance', 'pending_technical'].includes(deal.status ?? '') ? 'submitted' : 'created') as any,
    to_status: saved.status,
    created_at: new Date().toISOString(),
    user: creatorUser,
  })

  // Write notifications
  if (saved.status === 'pending_technical' || saved.status === 'pending_finance') {
    const isTech = saved.status === 'pending_technical'
    const targetRole = isTech ? 'technical' : 'finance'
    const reviewerLabel = isTech ? 'Technical Review' : 'Finance Review'
    if (useAuthStore.getState().isDemo) {
      const notifId = `notif-${Date.now()}`
      await setDoc(doc(db, 'notifications', notifId), {
        user_id: isTech ? 'demo-technical' : 'demo-finance',
        deal_id: id,
        title: 'New deal awaiting review',
        message: `${saved.deal_number} — ${saved.title} has been submitted by ${creatorUser?.full_name ?? 'Sales Rep'} and is awaiting ${reviewerLabel}.`,
        type: 'approval',
        is_read: false,
        created_at: new Date().toISOString(),
      })
    } else {
      try {
        const reviewers = await fetchUsersByRole(targetRole)
        const actionUrl = `${window.location.origin}/deals/${id}`
        for (const reviewer of reviewers) {
          const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`
          await setDoc(doc(db, 'notifications', notifId), {
            user_id: reviewer.id,
            deal_id: id,
            title: 'New deal awaiting review',
            message: `${saved.deal_number} — ${saved.title} has been submitted by ${creatorUser?.full_name ?? 'Sales Rep'} and is awaiting ${reviewerLabel}.`,
            type: 'approval',
            is_read: false,
            created_at: new Date().toISOString(),
          })

          if (reviewer.email) {
            sendWorkflowEmail({
              to_email: reviewer.email,
              recipient_name: reviewer.full_name || `${reviewerLabel} Team Member`,
              subject: 'New deal awaiting review',
              message: `${saved.deal_number} — ${saved.title} has been submitted by ${creatorUser?.full_name ?? 'Sales Rep'} and is awaiting ${reviewerLabel}.`,
              deal_number: saved.deal_number,
              deal_title: saved.title,
              action_url: actionUrl,
            }).catch(err => console.error('Failed to send submit email:', err))
          }
        }
      } catch (err) {
        console.error('Failed to write submit notifications:', err)
      }
    }
  }

  return saved
}

export async function submitDealForApproval(dealId: string, userId: string, comment?: string): Promise<Deal> {
  const deal = await fetchDealById(dealId)
  if (!deal) throw new Error('Deal not found')
  const toStatus = deal.requires_technical ? 'pending_technical' : 'pending_finance'
  return transitionDeal(dealId, toStatus, 'submitted', userId, comment || 'Submitted for approval')
}

export async function approveDeal(
  dealId: string,
  userId: string,
  currentStatus: DealStatus,
  requiresTechnical: boolean,
  comment?: string
): Promise<Deal> {
  const next = getNextStatus(currentStatus, requiresTechnical)
  if (!next) throw new Error('Cannot approve from current status')
  return transitionDeal(dealId, next, 'approved', userId, comment || 'Approved')
}

export async function rejectDeal(
  dealId: string,
  userId: string,
  comment: string
): Promise<Deal> {
  return transitionDeal(dealId, 'rejected', 'rejected', userId, comment)
}

export async function requestChanges(
  dealId: string,
  userId: string,
  comment: string
): Promise<Deal> {
  return transitionDeal(dealId, 'draft', 'changes_requested', userId, comment)
}

async function fetchUsersByRole(role: UserRole): Promise<User[]> {
  const usersCol = collection(db, 'users')
  const q = query(usersCol, where('role', '==', role))
  const snap = await getDocs(q)
  const list: User[] = []
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as User)
  })
  return list
}

async function fetchUserById(userId: string): Promise<User | null> {
  const userSnap = await getDoc(doc(db, 'users', userId))
  if (!userSnap.exists()) return null
  return { id: userId, ...userSnap.data() } as User
}

async function sendWorkflowEmailAlert(
  dealId: string,
  dealNumber: string,
  dealTitle: string,
  targetRoleOrUserId: string,
  subject: string,
  message: string
) {
  const actionUrl = `${window.location.origin}/deals/${dealId}`
  const isRole = ['finance', 'technical', 'sales_head', 'sales_rep', 'admin'].includes(targetRoleOrUserId)
  const isDirectEmail = targetRoleOrUserId.includes('@')

  if (useAuthStore.getState().isDemo) {
    console.log(`[DEMO MODE] Would send email to: ${targetRoleOrUserId} | Subject: ${subject}`)
    return
  }

  try {
    if (isDirectEmail) {
      await sendWorkflowEmail({
        to_email: targetRoleOrUserId,
        recipient_name: 'Sales Rep',
        subject,
        message,
        deal_number: dealNumber,
        deal_title: dealTitle,
        action_url: actionUrl,
      })
      return
    }

    if (isRole) {
      const reviewers = await fetchUsersByRole(targetRoleOrUserId as UserRole)
      for (const reviewer of reviewers) {
        if (reviewer.email) {
          await sendWorkflowEmail({
            to_email: reviewer.email,
            recipient_name: reviewer.full_name || 'Reviewer',
            subject,
            message,
            deal_number: dealNumber,
            deal_title: dealTitle,
            action_url: actionUrl,
          })
        }
      }
    } else {
      const targetUser = await fetchUserById(targetRoleOrUserId)
      if (targetUser && targetUser.email) {
        await sendWorkflowEmail({
          to_email: targetUser.email,
          recipient_name: targetUser.full_name || 'Team Member',
          subject,
          message,
          deal_number: dealNumber,
          deal_title: dealTitle,
          action_url: actionUrl,
        })
      } else {
        console.warn(`Unable to send workflow email: sales rep user not found for id ${targetRoleOrUserId}`)
      }
    }
  } catch (err) {
    console.error('Failed to trigger workflow email:', err)
  }
}

async function transitionDeal(
  dealId: string,
  toStatus: DealStatus,
  action: string,
  userId: string,
  comment: string
): Promise<Deal> {
  if (useAuthStore.getState().isDemo) {
    const deal = MOCK_DEALS.find((d) => d.id === dealId)
    if (!deal) throw new Error('Deal not found')
    const fromStatus = deal.status
    const updated = {
      ...deal,
      status: toStatus,
      updated_at: new Date().toISOString(),
      ...(toStatus === 'approved' ? { approved_at: new Date().toISOString() } : {}),
      ...(action === 'rejected' || action === 'changes_requested'
        ? { rejection_reason: comment }
        : {}),
    }
    const actorUser = Object.values(DEMO_USERS).find((u) => u.id === userId)
    updateMockDeal(dealId, updated)
    appendMockAudit({
      deal_id: dealId,
      user_id: userId,
      action: action as AuditAction,
      from_status: fromStatus,
      to_status: toStatus,
      comment: comment || undefined,
      user: actorUser,
    })

    // Generate notifications dynamically based on target status
    const reviewerName = actorUser?.full_name ?? 'Reviewer'
    const salesRepId = updated.created_by || 'demo-sales'

    if (toStatus === 'pending_technical') {
      appendMockNotification({
        user_id: 'demo-technical',
        deal_id: dealId,
        title: 'Technical review required',
        message: `${updated.deal_number} — ${updated.title} requires technical feasibility sign-off.`,
        type: 'approval',
      })
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, 'technical', 'Technical review required', `${updated.deal_number} — ${updated.title} requires technical feasibility sign-off.`)
    } else if (toStatus === 'pending_finance') {
      appendMockNotification({
        user_id: 'demo-finance',
        deal_id: dealId,
        title: 'New deal awaiting review',
        message: `${updated.deal_number} — ${updated.title} has passed preliminary steps and is awaiting Finance Review.`,
        type: 'approval',
      })
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, 'finance', 'New deal awaiting review', `${updated.deal_number} — ${updated.title} has passed preliminary steps and is awaiting Finance Review.`)
      if (fromStatus === 'pending_technical') {
        appendMockNotification({
          user_id: salesRepId,
          deal_id: dealId,
          title: 'Deal passed Technical Review',
          message: `Your deal ${updated.deal_number} — ${updated.title} has passed Technical Review and is routed to Finance Review.`,
          type: 'status_update',
        })
        await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepId, 'Deal passed Technical Review', `Your deal ${updated.deal_number} — ${updated.title} has passed Technical Review and is routed to Finance Review.`)
      }
    } else if (toStatus === 'pending_sales_head') {
      appendMockNotification({
        user_id: 'demo-head',
        deal_id: dealId,
        title: 'Final approval pending',
        message: `${updated.deal_number} — ${updated.title} is ready for Sales Head final gate review.`,
        type: 'approval',
      })
      appendMockNotification({
        user_id: salesRepId,
        deal_id: dealId,
        title: 'Deal routed to Sales Head',
        message: `Your deal ${updated.deal_number} — ${updated.title} has passed preliminary reviews and is awaiting Sales Head final sign-off.`,
        type: 'status_update',
      })
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, 'sales_head', 'Final approval pending', `${updated.deal_number} — ${updated.title} is ready for Sales Head final gate review.`)
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepId, 'Deal routed to Sales Head', `Your deal ${updated.deal_number} — ${updated.title} has passed preliminary reviews and is awaiting Sales Head final sign-off.`)
    } else if (toStatus === 'approved') {
      appendMockNotification({
        user_id: salesRepId,
        deal_id: dealId,
        title: 'Deal Fully Approved 🎉',
        message: `Congratulations! Your deal ${updated.deal_number} — ${updated.title} has been fully approved and is ready for contracting.`,
        type: 'status_update',
      })
      appendMockNotification({
        user_id: 'demo-finance',
        deal_id: dealId,
        title: 'Deal Approved',
        message: `${updated.deal_number} — ${updated.title} has been fully approved by the Sales Head.`,
        type: 'status_update',
      })
      appendMockNotification({
        user_id: 'demo-technical',
        deal_id: dealId,
        title: 'Deal Approved',
        message: `${updated.deal_number} — ${updated.title} has been fully approved by the Sales Head.`,
        type: 'status_update',
      })
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepId, 'Deal Fully Approved 🎉', `Congratulations! Your deal ${updated.deal_number} — ${updated.title} has been fully approved and is ready for contracting.`)
    } else if (toStatus === 'rejected') {
      appendMockNotification({
        user_id: salesRepId,
        deal_id: dealId,
        title: 'Deal Rejected ❌',
        message: `Your deal ${updated.deal_number} — ${updated.title} has been rejected by ${reviewerName}. Feedback: "${comment}"`,
        type: 'rejection',
      })
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepId, 'Deal Rejected ❌', `Your deal ${updated.deal_number} — ${updated.title} has been rejected by ${reviewerName}. Feedback: "${comment}"`)
    } else if (toStatus === 'draft' && action === 'changes_requested') {
      appendMockNotification({
        user_id: salesRepId,
        deal_id: dealId,
        title: 'Revision Requested 📝',
        message: `Your deal ${updated.deal_number} — ${updated.title} requires modifications. Feedback: "${comment}"`,
        type: 'revision',
      })
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepId, 'Revision Requested 📝', `Your deal ${updated.deal_number} — ${updated.title} requires modifications. Feedback: "${comment}"`)
    }

    // Always notify System Admin of every transition
    appendMockNotification({
      user_id: 'demo-admin',
      deal_id: dealId,
      title: `Deal ${updated.deal_number} Updated`,
      message: `${updated.deal_number} — "${updated.title}" status is now ${updated.status.replace(/_/g, ' ').toUpperCase()} (updated by ${reviewerName}).`,
      type: 'status_update',
    })

    return updated
  }

  // Live Firebase transition
  const dealRef = doc(db, 'deals', dealId)
  const dealSnap = await getDoc(dealRef)
  if (!dealSnap.exists()) throw new Error('Deal not found')

  const deal = { id: dealId, ...dealSnap.data() } as Deal
  const fromStatus = deal.status

  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const actorUser = userSnap.exists() ? { id: userId, ...userSnap.data() } as User : undefined

  const updated: Deal = {
    ...deal,
    status: toStatus,
    updated_at: new Date().toISOString(),
    ...(toStatus === 'approved' ? { approved_at: new Date().toISOString() } : {}),
    ...(action === 'rejected' || action === 'changes_requested'
      ? { rejection_reason: comment }
      : {}),
  }

  await setDoc(dealRef, updated)

  // Write audit entry
  const auditId = `audit-${Date.now()}`
  await setDoc(doc(db, 'deal_audit', auditId), {
    deal_id: dealId,
    user_id: userId,
    deal_number: deal.deal_number,
    deal_title: deal.title,
    action: action as AuditAction,
    from_status: fromStatus,
    to_status: toStatus,
    comment: comment || undefined,
    created_at: new Date().toISOString(),
    user: actorUser,
  })

  // Generate Firestore notifications dynamically
  const reviewerName = actorUser?.full_name ?? 'Reviewer'
  const salesRepId = updated.created_by || deal.created_by || ''
  const salesRepEmail = updated.creator?.email || deal.creator?.email
  const salesRepTarget = salesRepId || salesRepEmail || ''

  const triggerNotif = async (targetRoleOrUserId: string, title: string, message: string, type: 'approval' | 'status_update' | 'rejection' | 'revision') => {
    const isDemoMode = useAuthStore.getState().isDemo
    
    // In demo mode, use the targetRoleOrUserId directly (like demo-finance, etc.)
    if (isDemoMode) {
      const demoIdMap: Record<string, string> = {
        finance: 'demo-finance',
        technical: 'demo-technical',
        sales_head: 'demo-head',
        admin: 'demo-admin',
      }
      const mappedId = demoIdMap[targetRoleOrUserId] || targetRoleOrUserId
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      await setDoc(doc(db, 'notifications', notifId), {
        user_id: mappedId,
        deal_id: dealId,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      return
    }

    // In live Firestore mode, write notifications for roles dynamically
    const rolesList = ['finance', 'technical', 'sales_head', 'admin']
    const isRole = rolesList.includes(targetRoleOrUserId)
    
    try {
      if (isRole) {
        const users = await fetchUsersByRole(targetRoleOrUserId as UserRole)
        for (const u of users) {
          const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`
          await setDoc(doc(db, 'notifications', notifId), {
            user_id: u.id,
            deal_id: dealId,
            title,
            message,
            type,
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }
      } else {
        const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        await setDoc(doc(db, 'notifications', notifId), {
          user_id: targetRoleOrUserId,
          deal_id: dealId,
          title,
          message,
          type,
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error('Failed to trigger Firestore notifications:', err)
    }
  }

  if (toStatus === 'pending_technical') {
    await triggerNotif('technical', 'Technical review required', `${updated.deal_number} — ${updated.title} requires technical feasibility sign-off.`, 'approval')
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, 'technical', 'Technical review required', `${updated.deal_number} — ${updated.title} requires technical feasibility sign-off.`)
  } else if (toStatus === 'pending_finance') {
    await triggerNotif('finance', 'New deal awaiting review', `${updated.deal_number} — ${updated.title} has passed preliminary steps and is awaiting Finance Review.`, 'approval')
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, 'finance', 'New deal awaiting review', `${updated.deal_number} — ${updated.title} has passed preliminary steps and is awaiting Finance Review.`)
    if (fromStatus === 'pending_technical') {
      await triggerNotif(salesRepId, 'Deal passed Technical Review', `Your deal ${updated.deal_number} — ${updated.title} has passed Technical Review and is routed to Finance Review.`, 'status_update')
      await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepTarget, 'Deal passed Technical Review', `Your deal ${updated.deal_number} — ${updated.title} has passed Technical Review and is routed to Finance Review.`)
    }
  } else if (toStatus === 'pending_sales_head') {
    await triggerNotif('sales_head', 'Final approval pending', `${updated.deal_number} — ${updated.title} is ready for Sales Head final gate review.`, 'approval')
    await triggerNotif(salesRepId, 'Deal routed to Sales Head', `Your deal ${updated.deal_number} — ${updated.title} has passed preliminary reviews and is awaiting Sales Head final sign-off.`, 'status_update')
    
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, 'sales_head', 'Final approval pending', `${updated.deal_number} — ${updated.title} is ready for Sales Head final gate review.`)
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepTarget, 'Deal routed to Sales Head', `Your deal ${updated.deal_number} — ${updated.title} has passed preliminary reviews and is awaiting Sales Head final sign-off.`)
  } else if (toStatus === 'approved') {
    await triggerNotif(salesRepId, 'Deal Fully Approved 🎉', `Congratulations! Your deal ${updated.deal_number} — ${updated.title} has been fully approved and is ready for contracting.`, 'status_update')
    await triggerNotif('finance', 'Deal Approved', `${updated.deal_number} — ${updated.title} has been fully approved by the Sales Head.`, 'status_update')
    await triggerNotif('technical', 'Deal Approved', `${updated.deal_number} — ${updated.title} has been fully approved by the Sales Head.`, 'status_update')
    
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepTarget, 'Deal Fully Approved 🎉', `Congratulations! Your deal ${updated.deal_number} — ${updated.title} has been fully approved and is ready for contracting.`)
  } else if (toStatus === 'rejected') {
    await triggerNotif(salesRepId, 'Deal Rejected ❌', `Your deal ${updated.deal_number} — ${updated.title} has been rejected by ${reviewerName}. Feedback: "${comment}"`, 'rejection')
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepTarget, 'Deal Rejected ❌', `Your deal ${updated.deal_number} — ${updated.title} has been rejected by ${reviewerName}. Feedback: "${comment}"`)
  } else if (toStatus === 'draft' && action === 'changes_requested') {
    await triggerNotif(salesRepId, 'Revision Requested 📝', `Your deal ${updated.deal_number} — ${updated.title} requires modifications. Feedback: "${comment}"`, 'revision')
    await sendWorkflowEmailAlert(dealId, updated.deal_number, updated.title, salesRepTarget, 'Revision Requested 📝', `Your deal ${updated.deal_number} — ${updated.title} requires modifications. Feedback: "${comment}"`)
  }

  // Notify System Admin
  await triggerNotif('admin', `Deal ${updated.deal_number} Updated`, `${updated.deal_number} — "${updated.title}" status is now ${updated.status.replace(/_/g, ' ').toUpperCase()} (updated by ${reviewerName}).`, 'status_update')

  return updated
}
