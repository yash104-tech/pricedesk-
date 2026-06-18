import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Deal, DealStatus } from '@/types'

interface DealsState {
  deals: Deal[]
  selectedDeal: Deal | null
  isLoading: boolean
  filter: {
    status: DealStatus | 'all'
    search: string
  }
}

const initialState: DealsState = {
  deals: [],
  selectedDeal: null,
  isLoading: false,
  filter: { status: 'all', search: '' },
}

const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {
    setDeals: (state, action: PayloadAction<Deal[]>) => {
      state.deals = action.payload
    },
    setSelectedDeal: (state, action: PayloadAction<Deal | null>) => {
      state.selectedDeal = action.payload
    },
    updateDeal: (state, action: PayloadAction<Deal>) => {
      state.deals = state.deals.map((d) =>
        d.id === action.payload.id ? action.payload : d
      )
      if (state.selectedDeal?.id === action.payload.id) {
        state.selectedDeal = action.payload
      }
    },
    addDeal: (state, action: PayloadAction<Deal>) => {
      state.deals = [action.payload, ...state.deals]
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setFilter: (
      state,
      action: PayloadAction<Partial<DealsState['filter']>>
    ) => {
      state.filter = { ...state.filter, ...action.payload }
    },
  },
})

export const {
  setDeals,
  setSelectedDeal,
  updateDeal,
  addDeal,
  setLoading,
  setFilter,
} = dealsSlice.actions
export default dealsSlice.reducer
