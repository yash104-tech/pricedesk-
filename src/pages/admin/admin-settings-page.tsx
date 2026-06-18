import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { DEFAULT_CURRENCY, setGlobalCurrency, formatCurrency } from '@/lib/currency'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AdminSettingsPage() {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  const handleSave = () => {
    setGlobalCurrency(currency)
    toast.success('Settings and currency formatting saved!')
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Organization configuration and approval policies
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Configure the active global currency format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select active currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹ · Indian Rupee)</SelectItem>
                <SelectItem value="USD">USD ($ · US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (€ · Euro)</SelectItem>
                <SelectItem value="GBP">GBP (£ · British Pound)</SelectItem>
                <SelectItem value="JPY">JPY (¥ · Japanese Yen)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-muted/20 border border-border/40 p-2.5 rounded-lg">
              <span className="font-semibold text-foreground">Preview:</span>
              <span>15,000 becomes</span>
              <span className="font-mono font-medium text-foreground bg-background px-1.5 py-0.5 rounded border border-border/40">
                {formatCurrency(15000, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Units of measure</CardTitle>
            <CardDescription>Available UoM for line items</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {['EA', 'KG', 'LB', 'HR', 'LOT', 'BOX'].map((u) => (
              <span
                key={u}
                className="rounded-lg border px-3 py-1.5 text-sm font-mono bg-muted/30"
              >
                {u}
              </span>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval policies</CardTitle>
            <CardDescription>Workflow thresholds and rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require comment on rejection</Label>
                <p className="text-xs text-muted-foreground">Mandatory feedback for sales reps</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-route technical deals</Label>
                <p className="text-xs text-muted-foreground">When technical flag is enabled</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <Label>Minimum net margin threshold (%)</Label>
              <Input type="number" defaultValue={10} className="mt-1.5 max-w-[120px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit & compliance</CardTitle>
            <CardDescription>Export and retention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Audit log retention (days)</Label>
              <Input type="number" defaultValue={2555} className="mt-1.5 max-w-[160px]" />
            </div>
            <Button
              variant="outline"
              onClick={() => toast.success('Export queued — download from Audit Log page')}
            >
              Open Audit Log exports
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  )
}
