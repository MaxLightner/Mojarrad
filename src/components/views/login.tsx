'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LogIn, Loader2, ShieldCheck, User, KeyRound } from 'lucide-react'

const DEMO_USERS = [
  { u: 'admin', label: 'مدیر سیستم (همه پروژه‌ها)' },
  { u: 'mojri', label: 'مجری' },
  { u: 'malek', label: 'مالک طرقبه' },
  { u: 'malek2', label: 'مالک دهم شریع' },
  { u: 'nazer', label: 'ناظر طرقبه' },
  { u: 'nazer2', label: 'ناظر دهم شریع' },
  { u: 'peymankar', label: 'پیمانکار' },
]

export function LoginView() {
  const navigate = useAppStore((s) => s.navigate)
  const setUser = useAppStore((s) => s.setUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setUser(d.user)
      toast.success(`خوش آمدید، ${d.user.fullName}`)
      navigate('dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ورود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--hero-grad)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-lux p-7 md:p-9 w-full max-w-sm relative"
      >
        <div className="text-center mb-7">
          <span className="inline-flex size-14 rounded-2xl bg-accent items-center justify-center text-gold mb-4">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="font-extrabold text-xl">ورود اعضای پروژه</h1>
          <p className="text-muted-foreground text-xs leading-6 mt-2">
            دسترسی به تایم‌لاین، اسناد و ابزارهای پروژه
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">نام کاربری</Label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری"
                autoComplete="username"
                className="ps-9 bg-background rounded-xl"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">رمز عبور</Label>
            <div className="relative">
              <KeyRound className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="ps-9 bg-background rounded-xl"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <p className="text-destructive text-xs glass rounded-xl px-3 py-2.5 border border-destructive/30" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="gold-btn rounded-full w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            ورود به حساب
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-[0.68rem] text-muted-foreground leading-6">
            حساب کاربری فقط توسط مدیر سیستم ساخته می‌شود و اطلاعات ورود مستقیماً به افراد داده می‌شود.
            (ثبت‌نام آزاد وجود ندارد)
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DEMO_USERS.map((d) => (
              <button
                key={d.u}
                type="button"
                onClick={() => {
                  setUsername(d.u)
                  setPassword('12345678')
                }}
                className="rounded-full bg-muted/60 border border-border px-2.5 py-1 text-[0.65rem] text-muted-foreground hover:text-gold hover:border-gold/50 transition-colors"
                title={`کاربر دمو: ${d.u} / 12345678`}
              >
                دمو: {d.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
