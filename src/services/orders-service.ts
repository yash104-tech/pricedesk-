import type { Order, DealItem, UserRole, OrderIncentiveDetails } from '@/types'
import { useAuthStore } from '@/stores/auth-store'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'

const LOCAL_STORAGE_ORDERS_KEY = 'pricedesk_mock_orders'

// Initial mock order derived from the approved deal 'Manufacturing IoT Starter'
const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    order_number: 'ORD-2026-000219',
    deal_id: 'deal-4',
    deal_number: 'PD-2026-001029',
    title: 'Manufacturing IoT Starter',
    customer_name: 'Titan Manufacturing Ltd.',
    customer_id: 'CUST-1029',
    sales_rep_id: 'demo-sales',
    sales_rep_name: 'Arjun Mehta',
    oem: 'Aicera Devices',
    quote_number: 'QT-2026-001029',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { sku: 'PD-IOT-200', product_name: 'IoT Sensor Kit', quantity: 500, unit_of_measure: 'BOX', transfer_price: 120, quoted_price: 195 },
      { sku: 'PD-IOT-300', product_name: 'Edge Gateway Appliance', quantity: 25, unit_of_measure: 'EA', transfer_price: 1800, quoted_price: 2800 },
    ],
    supplier_name: 'India Electronics Corp',
    supplier_invoice: 'INV-2026-98124',
    contact_person: 'Amit Sharma',
    email: 'amit@indiaelections.com',
    phone: '+91 98765 43210',
    quoted_value: 12000000,
    payment_terms: 'Net 30',
    expected_delivery_date: '2026-07-15',
    checklist: {
      customer_po_received_sales: true,
      customer_po_received_finance: true,
      customer_po_received_remarks: 'PO-994103 received via email',

      commercials_validated_sales: true,
      commercials_validated_finance: true,
      commercials_validated_remarks: 'Validated margins match approved quote',

      supplier_quote_approved_sales: true,
      supplier_quote_approved_finance: false,
      supplier_quote_approved_remarks: 'Awaiting finance approval of distributor terms',

      supplier_po_released_sales: false,
      supplier_po_released_finance: false,
      supplier_po_released_remarks: '',

      advance_payment_made_sales: false,
      advance_payment_made_finance: false,
      advance_payment_made_remarks: '',

      order_acknowledged_sales: false,
      order_acknowledged_finance: false,
      order_acknowledged_remarks: '',
    },
    dispatch: {
      material_dispatched_sales: false,
      material_dispatched_finance: false,
      material_dispatched_remarks: '',

      material_received_sales: false,
      material_received_finance: false,
      material_received_remarks: '',

      installation_completed_sales: false,
      installation_completed_finance: false,
      installation_completed_remarks: '',

      customer_acceptance_sales: false,
      customer_acceptance_finance: false,
      customer_acceptance_remarks: '',

      invoice_raised_sales: false,
      invoice_raised_finance: false,
      invoice_raised_remarks: '',

      payment_received_sales: false,
      payment_received_finance: false,
      payment_received_remarks: '',
    }
  }
]

// Fetch helper to read local storage mock orders list
function getMockOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_MOCK_ORDERS))
      return [...INITIAL_MOCK_ORDERS]
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load mock orders from localStorage:', e)
    return [...INITIAL_MOCK_ORDERS]
  }
}

// Persist orders list helper
function saveMockOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders))
  } catch (e) {
    console.error('Failed to save mock orders to localStorage:', e)
  }
}

export async function fetchOrders(role: UserRole, userId: string): Promise<Order[]> {
  if (useAuthStore.getState().isDemo) {
    const orders = getMockOrders()
    if (role === 'sales_rep') {
      return orders.filter((o) => o.sales_rep_id === userId)
    }
    return orders // Finance sees all orders
  }

  // Live Firestore fetch
  try {
    const ordersCol = collection(db, 'orders')
    const q = query(ordersCol, orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const list: Order[] = []
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Order)
    })
    if (role === 'sales_rep') {
      return list.filter((o) => o.sales_rep_id === userId)
    }
    return list
  } catch (e) {
    console.error('Failed to fetch orders from firestore:', e)
    return []
  }
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  if (useAuthStore.getState().isDemo) {
    const orders = getMockOrders()
    return orders.find((o) => o.id === id) || null
  }

  // Live Firestore fetch
  try {
    const docSnap = await getDoc(doc(db, 'orders', id))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Order
  } catch (e) {
    console.error('Failed to fetch order by id from firestore:', e)
    return null
  }
}

export async function saveOrder(order: Partial<Order> & { items: DealItem[] }, userId: string): Promise<Order> {
  const isDemo = useAuthStore.getState().isDemo
  const id = order.id || `order-${Date.now()}`
  const authUser = useAuthStore.getState().user

  const newOrder: Order = {
    id,
    order_number: order.order_number || `ORD-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    deal_id: order.deal_id || '',
    deal_number: order.deal_number || '',
    title: order.title || 'Untitled Order',
    customer_name: order.customer_name || '',
    customer_id: order.customer_id || null,
    sales_rep_id: order.sales_rep_id || userId,
    sales_rep_name: order.sales_rep_name || authUser?.full_name || 'Sales Rep',
    oem: order.oem || '',
    quote_number: order.quote_number || null,
    created_at: order.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: order.items,
    supplier_name: order.supplier_name || '',
    supplier_invoice: order.supplier_invoice || '',
    contact_person: order.contact_person || '',
    email: order.email || '',
    phone: order.phone || '',
    quoted_value: order.quoted_value || 0,
    payment_terms: order.payment_terms || '',
    expected_delivery_date: order.expected_delivery_date || '',
    checklist: order.checklist || {
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
    },
    dispatch: order.dispatch || {
      material_dispatched_sales: false,
      material_dispatched_finance: false,
      material_dispatched_remarks: '',

      material_received_sales: false,
      material_received_finance: false,
      material_received_remarks: '',

      installation_completed_sales: false,
      installation_completed_finance: false,
      installation_completed_remarks: '',

      customer_acceptance_sales: false,
      customer_acceptance_finance: false,
      customer_acceptance_remarks: '',

      invoice_raised_sales: false,
      invoice_raised_finance: false,
      invoice_raised_remarks: '',

      payment_received_sales: false,
      payment_received_finance: false,
      payment_received_remarks: '',
    },
    incentive_details: order.incentive_details ?? null,
  }

  if (isDemo) {
    const list = getMockOrders()
    const index = list.findIndex((o) => o.id === id)
    if (index !== -1) {
      list[index] = newOrder
    } else {
      list.unshift(newOrder)
    }
    saveMockOrders(list)
    return newOrder
  }

  // Live Firestore save
  try {
    await setDoc(doc(db, 'orders', id), newOrder)
    return newOrder
  } catch (e) {
    console.error('Failed to save order to firestore:', e)
    throw e
  }
}

export async function saveIncentiveDetails(
  orderId: string,
  details: OrderIncentiveDetails
): Promise<void> {
  const isDemo = useAuthStore.getState().isDemo

  if (isDemo) {
    const list = getMockOrders()
    const index = list.findIndex((o) => o.id === orderId)
    if (index !== -1) {
      list[index] = { ...list[index], incentive_details: details, updated_at: new Date().toISOString() }
      saveMockOrders(list)
    }
    return
  }

  // Live Firestore update
  try {
    const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore')
    await updateDoc(firestoreDoc(db, 'orders', orderId), {
      incentive_details: details,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Failed to save incentive details to firestore:', e)
    throw e
  }
}
