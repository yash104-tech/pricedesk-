import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Deal } from '@/types'
import { DEAL_STATUS_LABELS } from '@/types'
import { cn, formatCurrency, formatPercent, getMarginColor } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  pending_finance: 'warning',
  pending_technical: 'warning',
  pending_sales_head: 'warning',
  approved: 'success',
  rejected: 'danger',
  changes_requested: 'warning',
}

interface DealsTableProps {
  deals: Deal[]
  showCreator?: boolean
  hideStatusFilter?: boolean
}

export function DealsTable({
  deals,
  showCreator = false,
  hideStatusFilter = false,
}: DealsTableProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter deals by search term (title, customer, deal number) and status pills
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.deal_number && d.deal_number.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && ['pending_technical', 'pending_finance', 'pending_sales_head'].includes(d.status)) ||
        d.status === statusFilter
        
      return matchesSearch && matchesStatus
    })
  }, [deals, searchTerm, statusFilter])

  const columns = useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        accessorKey: 'deal_number',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Deal #
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-primary">{row.original.deal_number}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div>
            <p className="font-medium truncate max-w-[200px]">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">{row.original.customer_name}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status] ?? 'default'}>
            {DEAL_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'total_revenue',
        header: 'Revenue',
        cell: ({ row }) =>
          formatCurrency(row.original.total_revenue, row.original.currency),
      },
      {
        accessorKey: 'net_margin_pct',
        header: 'Net Margin',
        cell: ({ row }) => (
          <span className={cn('font-semibold', getMarginColor(row.original.net_margin_pct))}>
            {formatPercent(row.original.net_margin_pct)}
          </span>
        ),
      },
      ...(showCreator
        ? [
            {
              accessorKey: 'creator.full_name',
              header: 'Rep',
            } as ColumnDef<Deal>,
          ]
        : []),
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) =>
          new Date(row.original.updated_at).toLocaleDateString(),
      },
    ],
    [showCreator]
  )

  const table = useReactTable({
    data: filteredDeals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        {/* Search Input Box */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by title, customer, or deal #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-border text-xs rounded-lg w-full bg-background"
          />
        </div>

        {/* Status Dropdown Filter */}
        {!hideStatusFilter && (
          <div className="w-full md:w-56">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full h-10 border-border bg-background text-xs font-semibold">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="draft" className="text-xs">Drafts</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending Review</SelectItem>
                <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                <SelectItem value="changes_requested" className="text-xs">Changes Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table Element container — horizontally scrollable on mobile */}
      <div className="glass-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border/50 bg-muted/30">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/deals/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {table.getRowModel().rows.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No deals found</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
