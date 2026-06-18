import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  TrendingUp,
  Wallet,
  Wrench,
  ClipboardCheck,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'

const schema = z.object({
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'sales_rep', 'finance', 'technical', 'sales_head']),
})

type LoginFormValues = z.infer<typeof schema>

const ROLES = [
  { value: 'sales_rep', label: 'Sales Rep', icon: TrendingUp },
  { value: 'technical', label: 'Technical Reviewer', icon: Wrench },
  { value: 'finance', label: 'Finance Reviewer', icon: Wallet },
  { value: 'sales_head', label: 'Sales Head', icon: ClipboardCheck },
  { value: 'admin', label: 'Management', icon: Settings },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginDemo, user, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', role: 'sales_rep' },
  })

  const selectedRole = form.watch('role')

  const onSubmit = async (data: LoginFormValues) => {
    setError(null)
    const toastId = toast.loading('Authenticating corporate credentials...')
    
    try {
      const res = await login(data.email, data.password, data.role)
      if (res && res.redirectWarning) {
        toast.dismiss(toastId)
        toast.warning(res.redirectWarning, { duration: 6000 })
      } else {
        toast.success('Signed in successfully!', { id: toastId })
      }
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.'
      setError(msg)
      toast.error(msg, { id: toastId })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/30 text-slate-900 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden font-sans selection:bg-sky-500/10">
      
      {/* Sleek Dynamic Background Accents */}
      <div className="absolute top-[-30%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-500/5 to-indigo-500/10 blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-500/5 to-purple-500/5 blur-3xl pointer-events-none" />

      {/* Main Unified Login Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex h-14 w-14 rounded-2xl bg-white border border-slate-200/80 items-center justify-center mb-1 shadow-sm"
          >
            <img src="https://framerusercontent.com/images/AlNvsxkJzF8SFWwwytH2xsnL8uM.png" alt="Aicera Logo" width="36" height="36" className="rounded-lg" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold tracking-tight font-display text-slate-900"
          >
            Aicera PriceDesk
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] text-sky-600 font-bold uppercase tracking-widest"
          >
            Enterprise Pricing &amp; Approvals
          </motion.p>
        </div>

        {/* Corporate Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 relative overflow-hidden"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold font-display text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your organizational credentials to access the workflow desk.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Work Email</Label>
              <div className="relative focus-within:ring-1 focus-within:ring-sky-500/50 rounded-md transition-all">
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className="pl-10 h-11 text-sm bg-slate-50/50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:bg-white transition-all"
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              {form.formState.errors.email && (
                <p className="text-[11px] text-destructive font-medium">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
              <div className="relative focus-within:ring-1 focus-within:ring-sky-500/50 rounded-md transition-all">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  className="pl-10 pr-10 h-11 text-sm bg-slate-50/50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:bg-white transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-[11px] text-destructive font-medium">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Role selector below password */}
            <div className="space-y-2 pb-1">
              <Label className="text-xs font-semibold text-slate-700">Access Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((roleOpt) => {
                  const isSelected = selectedRole === roleOpt.value
                  const Icon = roleOpt.icon
                  return (
                    <button
                      key={roleOpt.value}
                      type="button"
                      onClick={() => form.setValue('role', roleOpt.value as any, { shouldValidate: true })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer text-left ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm shadow-sky-500/5'
                          : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      } ${roleOpt.value === 'admin' ? 'col-span-2 justify-center' : ''}`}
                      disabled={isLoading}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>{roleOpt.label}</span>
                    </button>
                  )
                })}
              </div>
              {form.formState.errors.role && (
                <p className="text-[11px] text-destructive font-medium">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-xs text-red-600 flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/10 mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-3 text-right text-xs text-slate-500">
            <Link to="/forgot-password" className="text-sky-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Quick Demo Access Bypass */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Quick Demo Access (No Database Setup Needed)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  loginDemo('sales_rep')
                  navigate('/dashboard')
                  toast.success('Access granted! Entered as Demo Sales Representative.')
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-violet-100 bg-violet-50/50 hover:bg-violet-50 text-violet-700 text-xs font-semibold transition-all duration-200 cursor-pointer text-center"
              >
                <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                <span>Sales Rep</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginDemo('technical')
                  navigate('/dashboard')
                  toast.success('Access granted! Entered as Demo Technical Reviewer.')
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 text-amber-700 text-xs font-semibold transition-all duration-200 cursor-pointer text-center"
              >
                <Wrench className="h-3.5 w-3.5 text-amber-500" />
                <span>Technical</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginDemo('finance')
                  navigate('/dashboard')
                  toast.success('Access granted! Entered as Demo Finance Reviewer.')
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold transition-all duration-200 cursor-pointer text-center"
              >
                <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                <span>Finance</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginDemo('sales_head')
                  navigate('/dashboard')
                  toast.success('Access granted! Entered as Demo Sales Head.')
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-all duration-200 cursor-pointer text-center"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-blue-500" />
                <span>Sales Head</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loginDemo('admin')
                  navigate('/dashboard')
                  toast.success('Access granted! Entered as Demo Workspace Admin.')
                }}
                className="col-span-2 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all duration-200 cursor-pointer text-center"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500" />
                <span>Workspace Administrator</span>
              </button>
            </div>
          </div>

          {/* Quick legal / support footer */}
          <div className="mt-6 text-center text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-sky-600" />
            <span>PriceDesk Identity Protection Active</span>
          </div>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 font-medium z-10 w-full max-w-xs">
        PriceDesk v1.0 — Smarter tech. Sharper minds.
      </div>
    </div>
  )
}
