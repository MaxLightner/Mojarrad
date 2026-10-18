'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Loader2, Phone, UserRound, CheckCircle2, XCircle } from 'lucide-react'

type Worker = {
  id: string
  fullName: string
  job: string
  phone: string | null
  active: boolean
}

function initials(name: string) {
  const parts = name.replace('استاد ', '').split(' ')
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

export function WorkersPanel({ projectId }: { projectId: string }) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [job, setJob] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/workers?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setWorkers(d.workers || []))
      .catch(() => toast.error('خطا در بارگذاری کارگران'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const submit = async () => {
    if (!fullName.trim() || !job.trim()) {
      toast.error('نام و شغل کارگر الزامی است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, fullName, job, phone }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('کارگر ثبت شد')
      setAddOpen(false); setFullName(''); setJob(''); setPhone('')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (worker: Worker) => {
    setToggling(worker.id)
    try {
      const res = await fetch('/api/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: worker.id, active: !worker.active }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در تغییر وضعیت')
    } finally {
      setToggling(null)
    }
  }

  const removeWorker = async (worker: Worker) => {
    setToggling(worker.id)
    try {
      const res = await fetch(`/api/workers?id=${worker.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('حذف شد')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در حذف')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-muted-foreground text-xs leading-6 max-w-lg">
          نیروهای هر پروژه — لیست ساده و کاربردی: نام، شغل و شماره تماس.
        </p>
        <Button onClick={() => setAddOpen(true)} className="gold-btn rounded-full shrink-0">
          <Plus className="size-4" /> ثبت کارگر
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-lux h-16 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          هنوز نیرویی برای این پروژه ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-2.5">
          {workers.map((w) => (
            <div key={w.id} className="card-lux p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-11 rounded-xl gold-btn items-center justify-center font-bold text-sm shrink-0">
                  {initials(w.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">{w.fullName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[0.68rem] text-muted-foreground">
                    <span className="flex items-center gap-1"><UserRound className="size-3 text-gold" />{w.job}</span>
                    {w.phone && (
                      <a href={`tel:${w.phone.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))}`} className="flex items-center gap-1 hover:text-gold transition-colors" dir="ltr">
                        <Phone className="size-3 text-gold" />{w.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ms-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(w)}
                    disabled={toggling === w.id}
                    className={`rounded-full h-8 px-3 text-xs gap-1 ${
                      w.active ? 'border-emerald-500/60 text-emerald-600 bg-emerald-500/10' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {toggling === w.id ? <Loader2 className="size-3 animate-spin" /> : w.active ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                    {w.active ? 'فعال' : 'غیرفعال'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWorker(w)}
                    disabled={toggling === w.id}
                    className="rounded-full h-8 px-3 text-xs text-destructive"
                  >
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-gold" /> ثبت کارگر جدید
            </DialogTitle>
            <DialogDescription>اطلاعات پایه نیروی کار پروژه</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div>
              <Label className="text-xs mb-1.5 block">نام و نام خانوادگی *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثلاً: استاد حسن رحیمی" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">شغل / تخصص *</Label>
              <Input value={job} onChange={(e) => setJob(e.target.value)} placeholder="مثلاً: بنّا، جوشکار، آرماتوربند" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">شماره تماس</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="اختیاری" inputMode="tel" dir="ltr" className="bg-background rounded-xl" />
            </div>
          </div>
          <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            ثبت کارگر
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
