'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { HardHat, CalendarDays, Wallet, Scale, Pencil, Loader2, Check, Building2 } from 'lucide-react'

type ContractInfo = {
  contractorName: string
  startDate: string
  endDate: string
  financialStatus: string
  totalPaid: string
  note: string | null
}

const STATUS_META: Record<string, { label: string; class: string }> = {
  balanced: { label: 'حساب تراز است', class: 'border-emerald-500/60 text-emerald-600 bg-emerald-500/10' },
  debtor: { label: 'کارفرما بدهکار', class: 'border-amber-500/60 text-amber-600 bg-amber-500/10' },
  creditor: { label: 'پیمانکار بدهکار', class: 'border-destructive/60 text-destructive bg-destructive/10' },
}

export function ContractPanel({ projectId }: { projectId: string }) {
  const [info, setInfo] = useState<ContractInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ContractInfo>({
    contractorName: '',
    startDate: '',
    endDate: '',
    financialStatus: 'balanced',
    totalPaid: '',
    note: '',
  })

  const load = useCallback(() => {
    setLoading(true)
    setDenied(false)
    fetch(`/api/contract?projectId=${projectId}`)
      .then(async (r) => {
        if (r.status === 403) {
          setDenied(true)
          return { info: null }
        }
        return r.json()
      })
      .then((d) => {
        setInfo(d.info || null)
        if (d.info) setForm({ ...d.info, note: d.info.note || '' })
      })
      .catch(() => toast.error('خطا در بارگذاری وضعیت پیمانکاری'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/contract', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...form }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('وضعیت پیمانکاری ذخیره شد')
      setEditing(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card-lux h-48 animate-pulse bg-muted/40" />
  }

  if (denied) {
    return (
      <div className="card-lux p-10 text-center text-muted-foreground text-sm">
        این بخش فقط برای <span className="text-gold font-bold">مجری و مدیر سیستم</span> قابل مشاهده است.
      </div>
    )
  }

  if (editing) {
    return (
      <div className="card-lux p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <HardHat className="size-5 text-gold" />
          <h3 className="font-extrabold text-sm">ویرایش وضعیت پیمانکاری</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="text-xs mb-1.5 block">پیمانکار / شرکت مجری</Label>
            <Input
              value={form.contractorName}
              onChange={(e) => setForm((f) => ({ ...f, contractorName: e.target.value }))}
              placeholder="نام پیمانکار"
              className="bg-background rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">تاریخ شروع (شمسی)</Label>
            <Input
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              placeholder="۱۴۰۴/۰۲/۱۵"
              className="bg-background rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">تاریخ اتمام (شمسی)</Label>
            <Input
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              placeholder="۱۴۰۵/۰۶/۳۰"
              className="bg-background rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">وضعیت حساب</Label>
            <Select value={form.financialStatus} onValueChange={(v) => setForm((f) => ({ ...f, financialStatus: v }))}>
              <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">تراز</SelectItem>
                <SelectItem value="debtor">کارفرما بدهکار</SelectItem>
                <SelectItem value="creditor">پیمانکار بدهکار</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">جمع پرداختی</Label>
            <Input
              value={form.totalPaid}
              onChange={(e) => setForm((f) => ({ ...f, totalPaid: e.target.value }))}
              placeholder="۲٬۴۵۰٬۰۰۰٬۰۰۰ تومان"
              className="bg-background rounded-xl"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs mb-1.5 block">یادداشت</Label>
            <Textarea
              value={form.note || ''}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="مثلاً: پرداخت‌ها طبق صورت‌وضعیت ماهانه..."
              className="bg-background rounded-xl resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button onClick={save} disabled={saving} className="gold-btn rounded-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            ذخیره
          </Button>
          <Button variant="outline" onClick={() => setEditing(false)} className="rounded-full">
            انصراف
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-muted-foreground text-xs leading-6 max-w-lg">
          خلاصه وضعیت پیمانکاری پروژه — فقط برای مجری و مدیر سیستم.
        </p>
        <Button onClick={() => setEditing(true)} variant="outline" className="rounded-full glass shrink-0">
          <Pencil className="size-3.5 text-gold" /> ویرایش
        </Button>
      </div>

      {!info ? (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          هنوز وضعیت پیمانکاری برای این پروژه ثبت نشده است.
          <Button onClick={() => setEditing(true)} className="gold-btn rounded-full mt-4 block mx-auto">
            ثبت اطلاعات
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-lux p-5 md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 rounded-2xl gold-btn items-center justify-center shrink-0">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-[0.68rem] text-muted-foreground">پیمانکار / شرکت مجری</p>
                <p className="font-extrabold text-sm mt-0.5">{info.contractorName}</p>
              </div>
              <Badge variant="outline" className={`ms-auto ${STATUS_META[info.financialStatus]?.class || ''}`}>
                <Scale className="size-3" />
                {STATUS_META[info.financialStatus]?.label || info.financialStatus}
              </Badge>
            </div>
          </div>

          <div className="card-lux p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <CalendarDays className="size-4 text-gold" />
              <p className="text-[0.7rem] text-muted-foreground">تاریخ شروع</p>
            </div>
            <p className="font-bold text-sm">{info.startDate}</p>
          </div>

          <div className="card-lux p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <CalendarDays className="size-4 text-gold" />
              <p className="text-[0.7rem] text-muted-foreground">تاریخ اتمام</p>
            </div>
            <p className="font-bold text-sm">{info.endDate}</p>
          </div>

          <div className="card-lux p-5 md:col-span-2 border-gold/30">
            <div className="flex items-center gap-2.5 mb-2">
              <Wallet className="size-4 text-gold" />
              <p className="text-[0.7rem] text-muted-foreground">جمع پرداختی</p>
            </div>
            <p className="gold-text font-extrabold text-lg">{info.totalPaid}</p>
            {info.note && <p className="text-muted-foreground text-xs leading-6 mt-3">{info.note}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
