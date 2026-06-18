export type UserRole =
  | 'sales_rep'
  | 'finance'
  | 'technical'
  | 'sales_head'
  | 'admin'

export type DealStatus =
  | 'draft'
  | 'pending_finance'
  | 'pending_technical'
  | 'pending_sales_head'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

export type AuditAction =
  | 'created'
  | 'updated'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'commented'
  | 'resubmitted'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string | null
  department?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  deal_number: string
  title: string
  customer_name: string
  customer_id?: string | null
  description?: string | null
  status: DealStatus
  created_by: string
  assigned_to?: string | null
  currency: string
  requires_technical: boolean
  oem?: string | null
  quote_number?: string | null
  total_revenue: number
  total_cost: number
  gross_margin_pct: number
  net_margin_pct: number
  rejection_reason?: string | null
  submitted_at?: string | null
  approved_at?: string | null
  created_at: string
  updated_at: string
  creator?: User
  items?: DealItem[]
  overheads?: DealOverhead[]
}

export interface DealItem {
  id?: string
  deal_id?: string
  sku: string
  product_name: string
  quantity: number
  unit_of_measure: string
  transfer_price: number
  quoted_price: number
  line_revenue?: number
  line_cost?: number
  sort_order?: number
}

export interface DealOverhead {
  id?: string
  deal_id?: string
  label: string
  amount: number
  is_percentage: boolean
  percentage_value?: number | null
}

export interface DealAudit {
  id: string
  deal_id: string
  user_id: string
  action: AuditAction
  from_status?: DealStatus | null
  to_status?: DealStatus | null
  comment?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  user?: User
  deal_number?: string
  deal_title?: string
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Deal Created',
  updated: 'Deal Updated',
  submitted: 'Submitted for Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes Requested',
  commented: 'Comment Added',
  resubmitted: 'Resubmitted',
}

export interface Invite {
  id: string
  email: string
  role: UserRole
  invited_by: string
  token: string
  department?: string | null
  expires_at: string
  accepted_at?: string | null
  accepted_by?: string | null
  created_at: string
  inviter?: User
}

export interface InvitePreview {
  email: string
  role: UserRole
  department?: string | null
  expires_at: string
  is_valid: boolean
}

export interface Notification {
  id: string
  user_id: string
  deal_id?: string | null
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface MarginSummary {
  totalRevenue: number
  totalCost: number
  overheadTotal: number
  grossMarginPct: number
  netMarginPct: number
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  draft: 'Draft',
  pending_finance: 'Finance Review',
  pending_technical: 'Technical Review',
  pending_sales_head: 'Sales Head Review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes Requested',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  sales_rep: 'Sales Rep',
  technical: 'Technical',
  finance: 'Finance',
  sales_head: 'Sales Head',
  admin: 'Admin',
}

export const APPROVAL_PIPELINE: DealStatus[] = [
  'draft',
  'pending_technical',
  'pending_finance',
  'pending_sales_head',
  'approved',
]

export interface Customer {
  id: string
  name: string
  created_at: string
}

export interface OrderChecklist {
  customer_po_received_sales: boolean
  customer_po_received_finance: boolean
  customer_po_received_remarks: string

  commercials_validated_sales: boolean
  commercials_validated_finance: boolean
  commercials_validated_remarks: string

  supplier_quote_approved_sales: boolean
  supplier_quote_approved_finance: boolean
  supplier_quote_approved_remarks: string

  supplier_po_released_sales: boolean
  supplier_po_released_finance: boolean
  supplier_po_released_remarks: string

  advance_payment_made_sales: boolean
  advance_payment_made_finance: boolean
  advance_payment_made_remarks: string

  order_acknowledged_sales: boolean
  order_acknowledged_finance: boolean
  order_acknowledged_remarks: string
}

export interface OrderDispatch {
  material_dispatched_sales: boolean
  material_dispatched_finance: boolean
  material_dispatched_remarks: string

  material_received_sales: boolean
  material_received_finance: boolean
  material_received_remarks: string

  installation_completed_sales: boolean
  installation_completed_finance: boolean
  installation_completed_remarks: string

  customer_acceptance_sales: boolean
  customer_acceptance_finance: boolean
  customer_acceptance_remarks: string

  invoice_raised_sales: boolean
  invoice_raised_finance: boolean
  invoice_raised_remarks: string

  payment_received_sales: boolean
  payment_received_finance: boolean
  payment_received_remarks: string
}

export interface Order {
  id: string
  order_number: string
  deal_id: string
  deal_number: string
  title: string
  customer_name: string
  customer_id?: string | null
  sales_rep_id: string
  sales_rep_name: string
  oem: string
  quote_number?: string | null
  created_at: string
  updated_at: string
  
  // Products list
  items: DealItem[]
  
  // Supplier Info
  supplier_name: string
  supplier_invoice: string
  contact_person: string
  email: string
  phone: string
  quoted_value: number
  payment_terms: string
  expected_delivery_date: string

  // Workflow Checklist & Dispatch
  checklist: OrderChecklist
  dispatch: OrderDispatch
}
