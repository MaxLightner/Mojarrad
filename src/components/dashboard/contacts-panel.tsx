'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatJalali, toFaDigits } from '@/lib/jalali'
import { Search, Plus, Loader2, Phone, Trash2, CheckCheck, Clock3, HardHat, Truck, Wrench, UserRound, ShieldAlert } from 'lucide-react'

type Entry = {
  id: string
  name: string
  phone: string
  type: string
  note: string | null
  isTemporary: boolean
  lastCheckedAt: string
  createdAt: string
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  worker: { label: 'کارگر / استادکار', icon: HardHat, color: '#10b981' },
  contractor: { label: 'پیمانکار', icon: Wrench, color: '#f59e0b' },
  supplier: { label: 'تأمین‌کننده', icon: Truck, color: '#38bdf8' },
  other: { label: 'سایر', icon: UserRound, color: '#a78bfa' },
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysLeft(lastChecked: string, temporary: boolean) {
  if (!temporary) return Infinity
  const elapsed = Date.now() - new Date(lastChecked).getTime()
  return Math.max(0, Math.ceil((30 * DAY_MS - elapsed) / DAY_MS))
}

export function ContactsPanel() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', type: 'worker', note: '', isTemporary: true })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setDenied(false)
    fetch('/api/contacts')
      .then(async (r) => {
        if (r.status === 403) {
          setDenied(true)
          return { entries: [] }
        }
        return r.json()
      })
      .then((d) => setEntries(d.entries || []))
      .catch(() => toast.error('خطا در بارگذاری دفترچه تماس'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // جستجو: نتایج منطبق اول لیست
  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    const matched = entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (e.note || '').toLowerCase().includes(q)
    )
    const rest = entries.filter((e) => !matched.includes(e))
    return [...matched, ...rest]
  }, [entries, query])

  const add = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('نام و شماره تماس الزامی است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('مخاطب ثبت شد')
      setAddOpen(false)
      setForm({ name: '', phone: '', type: 'worker', note: '', isTemporary: true })
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت')
    } finally {
      setSubmitting(false)
    }
  }

  const check = async (id: string, makePermanent = false) => {
    setBusy(id)
    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, makePermanent }),
      })
      if (!res.ok) throw new Error()
      toast.success(makePermanent ? 'به لیست دائمی منتقل شد' : 'بررسی ثبت شد — شمارنده ۳۰ روزه ریست شد')
      load()
    } catch {
      toast.error('خطا در ثبت بررسی')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    setBusy(id)
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('مخاطب حذف شد')
      load()
    } catch {
      toast.error('خطا در حذف')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="card-lux h-48 animate-pulse bg-muted/40" />
  }

  if (denied) {
    return (
      <div className="card-lux p-10 text-center text-muted-foreground text-sm">
        دفترچه تماس فقط برای <span className="text-gold font-bold">مجری و مدیر سیستم</span> قابل مشاهده است.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-muted-foreground text-xs leading-6 max-w-xl">
          شماره‌هایی که برای روز مبادا نگه می‌داریم: کارگر، پیمانکار یا تأمین‌کننده‌ای که آمده و رفته.
          شماره‌های موقت اگر تا ۳۰ روز تیک نخورند، خودکار حذف می‌شوند.
        </p>
        <Button onClick={() => setAddOpen(true)} className="gold-btn rounded-full shrink-0">
          <Plus className="size-4" /> ثبت شماره
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-gold" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نام، شماره یا یادداشت... (نتایج ابتدای لیست)"
          className="ps-10 rounded-full bg-background h-11"
        />
        {query && (
          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[0.68rem] text-muted-foreground">
            {toFaDigits(entries.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())).length)} نتیجه
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          دفترچه تماس خالی است — اولین شماره را ثبت کنید.
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((e) => {
            const meta = TYPE_META[e.type] || TYPE_META.other
            const Icon = meta.icon
            const left = daysLeft(e.lastCheckedAt, e.isTemporary)
            const matched =
              query.trim() &&
              (e.name.toLowerCase().includes(query.trim().toLowerCase()) ||
                e.phone.replace(/\D/g, '').includes(query.trim().replace(/\D/g, '')))
            return (
              <div
                key={e.id}
                className={`card-lux p-4 ${matched ? 'border-gold/50 ring-1 ring-gold/20' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="flex size-11 rounded-xl items-center justify-center shrink-0"
                    style={{ background: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm flex items-center gap-2 flex-wrap">
                      {e.name}
                      {e.isTemporary ? (
                        <Badge variant="outline" className="text-[0.6rem] h-5 px-2 gap-1 border-amber-500/50 text-amber-600">
                          <Clock3 className="size-2.5" /> موقت — {toFaDigits(left)} روز مانده
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[0.6rem] h-5 px-2 gap-1 border-emerald-500/50 text-emerald-600">
                          <CheckCheck className="size-2.5" /> دائمی
                        </Badge>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[0.68rem] text-muted-foreground">
                      <a href={`tel:${e.phone}`} className="flex items-center gap-1 hover:text-gold transition-colors font-mono" dir="ltr">
                        <Phone className="size-3 text-gold" />{e.phone}
                      </a>
                      <span style={{ color: meta.color }}>{meta.label}</span>
                      <span className="flex items-center gap-1">
                        <CheckCheck className="size-3 text-gold" />
                        آخرین بررسی: {formatJalali(new Date(e.lastCheckedAt), { short: true })}
                      </span>
                    </div>
                    {e.note && <p className="text-[0.68rem] text-muted-foreground leading-5 mt-1.5">{e.note}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 ms-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => check(e.id)}
                      disabled={busy === e.id}
                      className="rounded-full h-8 px-3 text-xs gap-1"
                      title="تیک بررسی — شمارنده ۳۰ روزه ریست می‌شود"
                    >
                      {busy === e.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3.5 text-gold" />}
                      تیک
                    </Button>
                    {e.isTemporary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => check(e.id, true)}
                        disabled={busy === e.id}
                        className="rounded-full h-8 px-3 text-xs text-emerald-600"
                        title="منتقل به لیست دائمی"
                      >
                        دائمی‌کردن
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(e.id)}
                      disabled={busy === e.id}
                      className="size-8 text-destructive shrink-0"
                      aria-label="حذف مخاطب"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="glass border border-border rounded-2xl p-3.5 mt-6 flex items-start gap-3">
        <ShieldAlert className="size-4 text-gold shrink-0 mt-0.5" />
        <p className="text-[0.68rem] text-muted-foreground leading-6">
          این لیست فقط از پنل مجری و مدیریت دیده می‌شود و بخشی از پروژه‌های عمومی نیست.
          مخاطب موقتی که ۳۰ روز تیک نخورد، هنگام باز شدن دفترچه خودکار حذف می‌شود.
        </p>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-gold" /> ثبت شماره جدید
            </DialogTitle>
            <DialogDescription>شماره کسی که برای همکاری موقت آمده — برای روز مبادا نگهش دارید.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div>
              <Label className="text-xs mb-1.5 block">نام *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="مثلاً: استاد قربان حسینی" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">شماره تماس *</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0915..." inputMode="tel" dir="ltr" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">نوع همکاری</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">یادداشت</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="مثلاً: گچ‌کار؛ برای پروژه نازک‌کاری خبرش کنیم"
                className="bg-background rounded-xl resize-none"
              />
            </div>
            <div className="flex items-center justify-between glass rounded-xl p-3 border border-border">
              <p className="text-xs font-semibold">مخاطب موقت (حذف خودکار بعد از ۳۰ روز بدون تیک)</p>
              <input
                type="checkbox"
                checked={form.isTemporary}
                onChange={(e) => setForm((f) => ({ ...f, isTemporary: e.target.checked }))}
                className="size-4 accent-[color:var(--gold)]"
                aria-label="موقت"
              />
            </div>
          </div>
          <Button onClick={add} disabled={submitting} className="gold-btn rounded-full">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            ثبت مخاطب
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
