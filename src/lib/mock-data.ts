import type { Deal, DealAudit, Notification, User } from '@/types'

export const DEMO_USERS: Record<string, User> = {
  sales: {
    id: 'demo-sales',
    email: 'arjun.mehta@pricedesk.in',
    full_name: 'Arjun Mehta',
    role: 'sales_rep',
    department: 'Enterprise Sales',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  finance: {
    id: 'demo-finance',
    email: 'priya.sharma@pricedesk.in',
    full_name: 'Priya Sharma',
    role: 'finance',
    department: 'Finance',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  technical: {
    id: 'demo-technical',
    email: 'vikram.patel@pricedesk.in',
    full_name: 'Vikram Patel',
    role: 'technical',
    department: 'Solutions Engineering',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  sales_head: {
    id: 'demo-head',
    email: 'ananya.iyer@pricedesk.in',
    full_name: 'Ananya Iyer',
    role: 'sales_head',
    department: 'Sales Leadership',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: 'demo-admin',
    email: 'admin@pricedesk.in',
    full_name: 'Rahul Kapoor',
    role: 'admin',
    department: 'IT Administration',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

const now = Date.now()

export const MOCK_DEALS: Deal[] = [
  {
    id: 'deal-1',
    deal_number: 'PD-2026-001042',
    quote_number: 'QT-2026-001042',
    title: 'Global Logistics Platform — Year 1',
    customer_name: 'Tata Logistics Ltd.',
    customer_id: 'CUST-8842',
    description: 'Enterprise SaaS + implementation services for logistics optimization.',
    status: 'pending_finance',
    created_by: 'demo-sales',
    currency: 'INR',
    requires_technical: true,
    total_revenue: 40250000,
    total_cost: 25896000,
    gross_margin_pct: 35.67,
    net_margin_pct: 28.45,
    submitted_at: new Date(now - 86400000 * 2).toISOString(),
    created_at: new Date(now - 86400000 * 5).toISOString(),
    updated_at: new Date(now - 86400000).toISOString(),
    creator: DEMO_USERS.sales,
    items: [
      { sku: 'PD-ENT-001', product_name: 'Enterprise Platform License', quantity: 1, unit_of_measure: 'LOT', transfer_price: 9960000, quoted_price: 15355000 },
      { sku: 'PD-IMP-200', product_name: 'Implementation Services', quantity: 400, unit_of_measure: 'HR', transfer_price: 14525, quoted_price: 29050 },
      { sku: 'PD-SUP-050', product_name: 'Premium Support (Annual)', quantity: 1, unit_of_measure: 'EA', transfer_price: 3735000, quoted_price: 6225000 },
    ],
    overheads: [
      { label: 'Partner Commission', amount: 0, is_percentage: true, percentage_value: 5 },
      { label: 'Travel & Expenses', amount: 996000, is_percentage: false },
    ],
  },
  {
    id: 'deal-2',
    deal_number: 'PD-2026-001038',
    quote_number: 'QT-2026-001038',
    title: 'Healthcare Analytics Suite',
    customer_name: 'Apollo Hospitals Enterprise',
    status: 'pending_technical',
    created_by: 'demo-sales',
    currency: 'INR',
    requires_technical: true,
    total_revenue: 18260000,
    total_cost: 14774000,
    gross_margin_pct: 19.09,
    net_margin_pct: 14.2,
    submitted_at: new Date(now - 86400000 * 4).toISOString(),
    created_at: new Date(now - 86400000 * 7).toISOString(),
    updated_at: new Date(now - 86400000 * 2).toISOString(),
    creator: DEMO_USERS.sales,
    items: [
      { sku: 'PD-HC-100', product_name: 'Analytics Core Module', quantity: 1, unit_of_measure: 'EA', transfer_price: 95000, quoted_price: 120000 },
      { sku: 'PD-HC-200', product_name: 'Compliance Add-on', quantity: 1, unit_of_measure: 'EA', transfer_price: 38000, quoted_price: 55000 },
      { sku: 'PD-TRN-010', product_name: 'Training Package', quantity: 80, unit_of_measure: 'HR', transfer_price: 225, quoted_price: 350 },
    ],
    overheads: [{ label: 'Regulatory Review Fee', amount: 8500, is_percentage: false }],
  },
  {
    id: 'deal-3',
    deal_number: 'PD-2026-001035',
    quote_number: 'QT-2026-001035',
    title: 'Retail POS Rollout — APAC',
    customer_name: 'Reliance Retail Ltd.',
    status: 'pending_sales_head',
    created_by: 'demo-sales',
    currency: 'INR',
    requires_technical: false,
    total_revenue: 73870000,
    total_cost: 51460000,
    gross_margin_pct: 30.34,
    net_margin_pct: 26.8,
    submitted_at: new Date(now - 86400000 * 8).toISOString(),
    created_at: new Date(now - 86400000 * 12).toISOString(),
    updated_at: new Date(now - 86400000 * 3).toISOString(),
    creator: DEMO_USERS.sales,
    items: [
      { sku: 'PD-POS-500', product_name: 'POS Terminal Bundle', quantity: 2500, unit_of_measure: 'EA', transfer_price: 180, quoted_price: 280 },
      { sku: 'PD-CLD-100', product_name: 'Cloud Management Portal', quantity: 1, unit_of_measure: 'EA', transfer_price: 85000, quoted_price: 140000 },
    ],
    overheads: [],
  },
  {
    id: 'deal-4',
    deal_number: 'PD-2026-001029',
    quote_number: 'QT-2026-001029',
    title: 'Manufacturing IoT Starter',
    customer_name: 'Titan Manufacturing Ltd.',
    status: 'approved',
    created_by: 'demo-sales',
    currency: 'INR',
    requires_technical: true,
    total_revenue: 12948000,
    total_cost: 8134000,
    gross_margin_pct: 37.18,
    net_margin_pct: 32.5,
    submitted_at: new Date(now - 86400000 * 15).toISOString(),
    approved_at: new Date(now - 86400000 * 10).toISOString(),
    created_at: new Date(now - 86400000 * 20).toISOString(),
    updated_at: new Date(now - 86400000 * 10).toISOString(),
    creator: DEMO_USERS.sales,
    items: [
      { sku: 'PD-IOT-200', product_name: 'IoT Sensor Kit', quantity: 500, unit_of_measure: 'BOX', transfer_price: 120, quoted_price: 195 },
      { sku: 'PD-IOT-300', product_name: 'Edge Gateway Appliance', quantity: 25, unit_of_measure: 'EA', transfer_price: 1800, quoted_price: 2800 },
    ],
    overheads: [],
  },
  {
    id: 'deal-5',
    deal_number: 'PD-2026-001025',
    quote_number: 'QT-2026-001025',
    title: 'FinServ Data Migration',
    customer_name: 'HDFC Capital Partners',
    status: 'draft',
    created_by: 'demo-sales',
    currency: 'INR',
    requires_technical: false,
    total_revenue: 5976000,
    total_cost: 4814000,
    gross_margin_pct: 19.44,
    net_margin_pct: 15.2,
    created_at: new Date(now - 86400000).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
    creator: DEMO_USERS.sales,
    items: [
      { sku: 'PD-MIG-100', product_name: 'Migration Toolkit', quantity: 1, unit_of_measure: 'EA', transfer_price: 28000, quoted_price: 42000 },
      { sku: 'PD-CON-050', product_name: 'Consulting Hours', quantity: 120, unit_of_measure: 'HR', transfer_price: 200, quoted_price: 250 },
    ],
    overheads: [{ label: 'Third-party License Pass-through', amount: 5000, is_percentage: false }],
  },
  {
    id: 'deal-6',
    deal_number: 'PD-2026-001020',
    quote_number: 'QT-2026-001020',
    title: 'Energy Grid Monitoring',
    customer_name: 'Adani Grid Solutions',
    status: 'changes_requested',
    created_by: 'demo-sales',
    currency: 'INR',
    requires_technical: true,
    total_revenue: 28220000,
    total_cost: 24485000,
    gross_margin_pct: 13.24,
    net_margin_pct: 8.5,
    rejection_reason: 'Net margin below threshold. Please revise quoted pricing on line items.',
    submitted_at: new Date(now - 86400000 * 6).toISOString(),
    created_at: new Date(now - 86400000 * 9).toISOString(),
    updated_at: new Date(now - 86400000).toISOString(),
    creator: DEMO_USERS.sales,
    items: [
      { sku: 'PD-ENG-400', product_name: 'Grid Monitoring Suite', quantity: 1, unit_of_measure: 'EA', transfer_price: 210000, quoted_price: 240000 },
      { sku: 'PD-ENG-410', product_name: 'Sensor Network Deployment', quantity: 200, unit_of_measure: 'EA', transfer_price: 350, quoted_price: 400 },
    ],
    overheads: [],
  },
]

function auditEntry(
  partial: Omit<DealAudit, 'id' | 'created_at'> & { daysAgo: number }
): DealAudit {
  const deal = MOCK_DEALS.find((d) => d.id === partial.deal_id)
  return {
    id: `audit-${partial.deal_id}-${partial.action}-${partial.daysAgo}`,
    created_at: new Date(now - 86400000 * partial.daysAgo).toISOString(),
    deal_number: deal?.deal_number,
    deal_title: deal?.title,
    ...partial,
  }
}

export const MOCK_AUDIT_LOG: DealAudit[] = [
  auditEntry({ deal_id: 'deal-1', user_id: 'demo-sales', action: 'created', to_status: 'draft', daysAgo: 5, user: DEMO_USERS.sales }),
  auditEntry({ deal_id: 'deal-1', user_id: 'demo-sales', action: 'updated', from_status: 'draft', to_status: 'draft', comment: 'Revised line items after customer workshop', daysAgo: 4, user: DEMO_USERS.sales }),
  auditEntry({ deal_id: 'deal-1', user_id: 'demo-sales', action: 'submitted', from_status: 'draft', to_status: 'pending_technical', comment: 'Submitted for Q1 close — strategic account.', daysAgo: 3, user: DEMO_USERS.sales }),
  auditEntry({ deal_id: 'deal-1', user_id: 'demo-technical', action: 'approved', from_status: 'pending_technical', to_status: 'pending_finance', comment: 'Technical sizing verified. Routed to Finance Review.', daysAgo: 2, user: DEMO_USERS.technical }),
  auditEntry({ deal_id: 'deal-2', user_id: 'demo-sales', action: 'created', to_status: 'draft', daysAgo: 7, user: DEMO_USERS.sales }),
  auditEntry({ deal_id: 'deal-2', user_id: 'demo-sales', action: 'submitted', from_status: 'draft', to_status: 'pending_technical', daysAgo: 5, user: DEMO_USERS.sales }),
  auditEntry({ deal_id: 'deal-3', user_id: 'demo-sales', action: 'submitted', from_status: 'draft', to_status: 'pending_finance', daysAgo: 9, user: DEMO_USERS.sales }),
  auditEntry({ deal_id: 'deal-3', user_id: 'demo-finance', action: 'approved', from_status: 'pending_finance', to_status: 'pending_sales_head', comment: 'Margin and overhead compliant. Routed to Sales Head.', daysAgo: 6, user: DEMO_USERS.finance }),
  auditEntry({ deal_id: 'deal-4', user_id: 'demo-head', action: 'approved', from_status: 'pending_sales_head', to_status: 'approved', comment: 'Approved for contract execution.', daysAgo: 10, user: DEMO_USERS.sales_head }),
  auditEntry({ deal_id: 'deal-6', user_id: 'demo-technical', action: 'changes_requested', from_status: 'pending_technical', to_status: 'changes_requested', comment: 'Integration complexity requires scoping update.', daysAgo: 1, user: DEMO_USERS.technical }),
  auditEntry({ deal_id: 'deal-5', user_id: 'demo-sales', action: 'created', to_status: 'draft', daysAgo: 1, user: DEMO_USERS.sales }),
]

/** @deprecated use MOCK_AUDIT_LOG */
export const MOCK_AUDIT = MOCK_AUDIT_LOG

const LOCAL_STORAGE_DEALS_KEY = 'pricedesk_mock_deals'
const LOCAL_STORAGE_AUDIT_KEY = 'pricedesk_mock_audit_log'

export function persistMockDeals() {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEALS_KEY, JSON.stringify(MOCK_DEALS))
  } catch (e) {
    console.error('Error persisting deals to localStorage:', e)
  }
}

export function persistMockAudit() {
  try {
    localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(MOCK_AUDIT_LOG))
  } catch (e) {
    console.error('Error persisting audit log to localStorage:', e)
  }
}

export function appendMockAudit(entry: Omit<DealAudit, 'id' | 'created_at' | 'deal_number' | 'deal_title'>) {
  const deal = MOCK_DEALS.find((d) => d.id === entry.deal_id)
  const row: DealAudit = {
    ...entry,
    id: `audit-${Date.now()}`,
    created_at: new Date().toISOString(),
    deal_number: deal?.deal_number,
    deal_title: deal?.title,
  }
  MOCK_AUDIT_LOG.unshift(row)
  persistMockAudit()
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'welcome-sales',
    user_id: 'demo-sales',
    title: 'Workspace Active 🚀',
    message: 'Welcome Arjun Mehta! Your Enterprise Sales workspace is ready. You can create pricing proposals and track margins.',
    type: 'welcome',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'welcome-finance',
    user_id: 'demo-finance',
    title: 'Cost & Margin Queue Active 📈',
    message: 'Welcome Priya Sharma! Review commercial deals for margin thresholds and approve or request revisions.',
    type: 'welcome',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'welcome-technical',
    user_id: 'demo-technical',
    title: 'Solutions Scoping Enabled ⚙️',
    message: 'Welcome Vikram Patel! Validate solution scope complexity, integration hours, and provide technical feasibility approvals.',
    type: 'welcome',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'welcome-head',
    user_id: 'demo-head',
    title: 'Deal Desk Executive Gate Active 👑',
    message: 'Welcome Ananya Iyer! You hold final gate approval authority. Approve, reject, or request revisions for strategic accounts.',
    type: 'welcome',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'welcome-admin',
    user_id: 'demo-admin',
    title: 'Workspace Control Ready 🛡️',
    message: 'Welcome Back, Admin! Directly create login accounts, manage workspace settings, and inspect system audit logs.',
    type: 'welcome',
    is_read: false,
    created_at: new Date().toISOString(),
  },
]

export function updateMockDeal(id: string, updates: Partial<Deal>) {
  const index = MOCK_DEALS.findIndex((d) => d.id === id)
  if (index !== -1) {
    MOCK_DEALS[index] = { ...MOCK_DEALS[index], ...updates }
  }
  persistMockDeals()
}

export function addMockDeal(deal: Deal) {
  MOCK_DEALS.unshift(deal)
  persistMockDeals()
}

const LOCAL_STORAGE_NOTIFS_KEY = 'pricedesk_notifications'

export function persistMockNotifications() {
  localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(MOCK_NOTIFICATIONS))
}

export function appendMockNotification(notif: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
  const newNotif: Notification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    is_read: false,
    created_at: new Date().toISOString(),
  }
  MOCK_NOTIFICATIONS.unshift(newNotif)
  persistMockNotifications()
}

// Customers Mock definitions
export interface Customer {
  id: string
  name: string
  created_at: string
}

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST-8842', name: 'Tata Logistics Ltd.', created_at: new Date().toISOString() },
  { id: 'CUST-3942', name: 'Apollo Hospitals Enterprise', created_at: new Date().toISOString() },
  { id: 'CUST-5291', name: 'Reliance Retail Ltd.', created_at: new Date().toISOString() },
  { id: 'CUST-1029', name: 'Titan Manufacturing Ltd.', created_at: new Date().toISOString() },
  { id: 'CUST-9285', name: 'HDFC Capital Partners', created_at: new Date().toISOString() },
  { id: 'CUST-1920', name: 'Adani Grid Solutions', created_at: new Date().toISOString() },
  { id: 'CUST-3041', name: 'Infosys Technologies', created_at: new Date().toISOString() },
  { id: 'CUST-4921', name: 'Wipro Enterprises', created_at: new Date().toISOString() },
  { id: 'CUST-5510', name: 'L&T Construction', created_at: new Date().toISOString() },
]

const LOCAL_STORAGE_CUSTOMERS_KEY = 'pricedesk_mock_customers'

export function persistMockCustomers() {
  localStorage.setItem(LOCAL_STORAGE_CUSTOMERS_KEY, JSON.stringify(MOCK_CUSTOMERS))
}

// Schema versioning to clear out messy or outdated test data on first load
const SCHEMA_VERSION = 'v1.4'
const LOCAL_STORAGE_VERSION_KEY = 'pricedesk_schema_version'

try {
  const currentVersion = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY)
  if (currentVersion !== SCHEMA_VERSION) {
    localStorage.removeItem(LOCAL_STORAGE_DEALS_KEY)
    localStorage.removeItem(LOCAL_STORAGE_AUDIT_KEY)
    localStorage.removeItem(LOCAL_STORAGE_NOTIFS_KEY)
    localStorage.removeItem(LOCAL_STORAGE_CUSTOMERS_KEY)
    localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, SCHEMA_VERSION)
    // Force write clean initial mock data to localStorage
    persistMockDeals()
    persistMockAudit()
    persistMockNotifications()
    persistMockCustomers()
  }
} catch (e) {
  console.error('Failed to handle schema version check:', e)
}

// Load initial values from localStorage if they exist
try {
  const storedDeals = localStorage.getItem(LOCAL_STORAGE_DEALS_KEY)
  if (storedDeals) {
    const parsed = JSON.parse(storedDeals)
    MOCK_DEALS.length = 0
    MOCK_DEALS.push(...parsed)
  }
} catch (e) {
  console.error('Failed to parse stored deals:', e)
}

try {
  const storedAudit = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY)
  if (storedAudit) {
    const parsed = JSON.parse(storedAudit)
    MOCK_AUDIT_LOG.length = 0
    MOCK_AUDIT_LOG.push(...parsed)
  }
} catch (e) {
  console.error('Failed to parse stored audit log:', e)
}

try {
  const storedNotifs = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY)
  if (storedNotifs) {
    const parsed = JSON.parse(storedNotifs)
    MOCK_NOTIFICATIONS.length = 0
    MOCK_NOTIFICATIONS.push(...parsed)
  }
} catch (e) {
  console.error('Failed to parse stored notifications:', e)
}

try {
  const storedCustomers = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS_KEY)
  if (storedCustomers) {
    const parsed = JSON.parse(storedCustomers)
    MOCK_CUSTOMERS.length = 0
    MOCK_CUSTOMERS.push(...parsed)
  }
} catch (e) {
  console.error('Failed to parse stored customers:', e)
}
