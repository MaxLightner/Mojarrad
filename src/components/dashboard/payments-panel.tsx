'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatJalali, todayJalali, JALALI_MONTHS, toFaDigits, formatToman } from '@/lib/jalali'
import { Wallet, Receipt, Plus, Loader2, Trash2, Paperclip, TrendingUp } from 'lucide-react'

type Payment = {
  id: string
  date: string
  amount: string
  description: string
  receiptImage: string | null
  addedByName: string | null
  createdAt: string
}

export function PaymentsPanel({ projectId }: { projectId: string }) {
  const [receipts, setReceipts] = useState<Payment[]>([])
  const [canAdd, setCanAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [preview, setPreview] = useState<Payment | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setDenied(false)
    fetch(`/api/payments?projectId=${projectId}`)
      .then(async (r) => {
        if (r.status === 403) {
          setDenied(true)
          return { receipts: [] }
        }
        return r.json()
      })
      .then((d) => {
        setReceipts(d.receipts || [])
        setCanAdd(!!d.canAdd)
      })
      .catch(() => toast.error('خطا در بارگذاری پرداخت‌ها'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/payments?id=${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('رسید حذف شد')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در حذف')
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="card-lux h-40 animate-pulse bg-muted/40" />
        ))}
      </div>
    )
  }

  if (denied) {
    return (
      <div className="card-lux p-10 text-center text-muted-foreground text-sm">
        این بخش فقط برای <span className="text-gold font-bold">مالک، مدیر و مجری</span> قابل مشاهده است.
      </div>
    )
  }

  const total = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-muted-foreground text-xs leading-6 max-w-lg">
          رسید پرداخت‌های پروژه — هر پرداخت به‌صورت خودکار در تایم‌لاین هم ثبت می‌شود.
        </p>
        {canAdd && (
          <Button onClick={() => setAddOpen(true)} className="gold-btn rounded-full shrink-0">
            <Plus className="size-4" /> ثبت پرداخت
          </Button>
        )}
      </div>

      {/* جمع کل */}
      <div className="card-lux p-5 mb-5 border-gold/30 flex items-center gap-4 flex-wrap">
        <span className="inline-flex size-11 rounded-2xl gold-btn items-center justify-center shrink-0">
          <Wallet className="size-5" />
        </span>
        <div>
          <p className="text-[0.7rem] text-muted-foreground">جمع پرداختی ثبت‌شده ({toFaDigits(receipts.length)} رسید)</p>
          <p className="gold-text font-extrabold text-xl mt-0.5">{formatToman(total)} تومان</p>
        </div>
        <TrendingUp className="size-5 text-gold/60 ms-auto" />
      </div>

      {receipts.length === 0 && (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          هنوز پرداختی برای این پروژه ثبت نشده است.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {receipts.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.2) }}
            className="card-lux overflow-hidden"
          >
            <div className="flex gap-0">
              {r.receiptImage && (
                <button
                  onClick={() => setPreview(r)}
                  className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-muted/30"
                  aria-label="نمایش عکس رسید"
                >
                  <img
                    src={r.receiptImage}
                    alt="عکس رسید"
                    className="absolute inset-0 size-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </button>
              )}
              <div className="p-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1 text-[0.62rem] bg-emerald-500/10 text-emerald-600">
                    <Receipt className="size-3" />
                    رسید پرداخت
                  </Badge>
                  <span className="text-[0.62rem] text-muted-foreground">
                    {formatJalali(new Date(r.date))}
                  </span>
                </div>
                <p className="font-extrabold text-sm mt-2 text-emerald-600 dark:text-emerald-400">
                  {formatToman(r.amount)} تومان
                </p>
                <p className="text-muted-foreground text-xs leading-6 mt-1.5 line-clamp-2">{r.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[0.62rem] text-muted-foreground">
                    ثبت: {r.addedByName || '—'}
                  </span>
                  {canAdd && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(r.id)}
                      className="text-[0.65rem] h-6 px-2 ms-auto text-destructive hover:text-destructive"
                      title="حذف رسید و رویداد تایم‌لاین مربوطه"
                    >
                      <Trash2 className="size-3" />
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* پیش‌نمایش عکس رسید */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent dir="rtl" className="bg-card border-border max-w-lg p-0 overflow-hidden">
          {preview && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>عکس رسید</DialogTitle>
                <DialogDescription>{preview.description}</DialogDescription>
              </DialogHeader>
              <img src={preview.receiptImage as string} alt="عکس رسید" className="w-full object-contain max-h-[70dvh]" />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* فرم ثبت */}
      <AddPaymentDialog open={addOpen} onOpenChange={setAddOpen} projectId={projectId} onDone={load} />
    </div>
  )
}

/* ================= فرم ثبت پرداخت ================= */

function AddPaymentDialog({
  open,
  onOpenChange,
  projectId,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectId: string
  onDone: () => void
}) {
  const t = todayJalali()
  const [jy, setJy] = useState(t.jy)
  const [jm, setJm] = useState(t.jm)
  const [jd, setJd] = useState(t.jd)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const tt = todayJalali()
      setJy(tt.jy); setJm(tt.jm); setJd(tt.jd)
      setAmount(''); setDescription(''); setImage(null)
    }
  }, [open])

  const maxDay = jm <= 6 ? 31 : jm <= 11 ? 30 : 30

  // نمایش زنده مبلغ با جداکننده
  const prettyAmount = amount ? formatToman(amount) : ''

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('مبلغ را وارد کنید')
      return
    }
    if (!description.trim()) {
      toast.error('شرح پرداخت را بنویسید')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('amount', amount)
      fd.append('description', description.trim())
      fd.append('jy', String(jy))
      fd.append('jm', String(jm))
      fd.append('jd', String(jd))
      if (image) fd.append('image', image)
      const res = await fetch('/api/payments', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('پرداخت ثبت شد و به تایم‌لاین اضافه گردید')
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت پرداخت')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-gold" /> ثبت پرداخت
          </DialogTitle>
          <DialogDescription>
            رسید پرداخت به‌صورت خودکار در تایم‌لاین پروژه ثبت می‌شود — قابل مشاهده برای مالک، مدیر و مجری.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label className="text-xs mb-1.5 block">مبلغ (تومان) *</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 15))}
              inputMode="numeric"
              placeholder="500000000"
              className="bg-background rounded-xl tabular-nums"
            />
            {prettyAmount && (
              <p className="text-[0.68rem] text-gold font-bold mt-1.5">{prettyAmount} تومان</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs mb-1.5 block">روز</Label>
              <Select value={String(jd)} onValueChange={(v) => setJd(Number(v))}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>{toFaDigits(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">ماه</Label>
              <Select value={String(jm)} onValueChange={(v) => { setJm(Number(v)); if (jd > 30 && Number(v) > 6) setJd(30) }}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JALALI_MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">سال</Label>
              <Select value={String(jy)} onValueChange={(v) => setJy(Number(v))}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => t.jy - 4 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{toFaDigits(y)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">شرح پرداخت *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً: پیش‌پرداخت قرارداد / صورت‌وضعیت فنداسیون / تسویه پیمانکار برق"
              rows={2}
              className="bg-background rounded-xl resize-none"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">عکس رسید (اختیاری)</Label>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            <Button type="button" variant="outline" onClick={() => imageRef.current?.click()} className="rounded-xl w-full border-dashed">
              <Paperclip className="size-4 text-gold" />
              {image ? image.name : 'انتخاب عکس رسید'}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full flex-1">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            ثبت پرداخت
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            انصراف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
