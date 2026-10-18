'use client'

/* دیالوگ «افزودن پروژه جدید» — فقط مدیر سیستم
 * مدیر پروژه را به سایت اضافه می‌کند و بعد مالک/ناظر را با تخصیص پروژه می‌سازد */

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Loader2, Upload, ImagePlus, CheckCircle2 } from 'lucide-react'

export type CreatedProject = { id: string; slug: string; title: string }

export function AddProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (p: CreatedProject) => void
}) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')
  const [year, setYear] = useState('')
  const [status, setStatus] = useState('در حال اجرا')
  const [progress, setProgress] = useState(0)
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const reset = () => {
    setTitle(''); setSubtitle(''); setLocation(''); setArea(''); setYear('')
    setStatus('در حال اجرا'); setProgress(0); setDescription(''); setCoverUrl(null)
  }

  const uploadCover = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setCoverUrl(d.url)
      toast.success('تصویر کاور آپلود شد')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast.error('عنوان، محل پروژه و توضیحات الزامی است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, subtitle, location, area, year, status, progress, description,
          coverImage: coverUrl || undefined, category: 'in-progress',
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(`پروژه «${d.project.title}» ساخته شد — حالا مالک و ناظر آن را از «کاربر جدید» اضافه کنید`)
      reset()
      onOpenChange(false)
      onCreated(d.project)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ایجاد پروژه')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-gold" /> افزودن پروژه جدید
          </DialogTitle>
          <DialogDescription>
            پروژه با وضعیت «در حال اجرا» در بخش پروژه‌ها و داشبورد اعضا قرار می‌گیرد.
            بعد از ساخت، از «کاربر جدید» مالک و ناظرِ همین پروژه را تعریف کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5 py-1">
          <div>
            <Label className="text-xs mb-1.5 block">عنوان پروژه *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: ویلای دوبلکس فردوسی" className="bg-background rounded-xl" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">زیرعنوان</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="مثلاً: دو واحدی — ۴۰۰ متر زیربنا" className="bg-background rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">محل پروژه *</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مشهد، ..." className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">متراژ</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="۵۰۰ متر مربع زیربنا" className="bg-background rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">سال / شروع</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="شروع ۱۴۰۴" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">وضعیت</Label>
              <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="در حال اجرا — مرحله..." className="bg-background rounded-xl" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">درصد پیشرفت</Label>
              <span className="text-xs font-bold text-gold tabular-nums">{progress}٪</span>
            </div>
            <Slider value={[progress]} onValueChange={([v]) => setProgress(v)} min={0} max={100} step={5} className="py-1" dir="ltr" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">توضیحات *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="معرفی کوتاه پروژه برای سایت عمومی + وضعیت فعلی اجرا..." className="bg-background rounded-xl text-xs leading-6 resize-none" />
          </div>

          {/* کاور */}
          <div>
            <Label className="text-xs mb-1.5 block">تصویر کاور (اختیاری)</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadCover(f)
              e.target.value = ''
            }} />
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full gap-1.5 text-xs">
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                انتخاب تصویر
              </Button>
              {coverUrl && (
                <span className="flex items-center gap-2 text-[0.65rem] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> تصویر انتخاب شد
                  <img src={coverUrl} alt="" className="size-9 rounded-lg object-cover border border-border" />
                </span>
              )}
            </div>
            <p className="text-[0.6rem] text-muted-foreground mt-1.5 leading-4">
              اگر تصویری انتخاب نشود، تصویر پیش‌فرض ساختمانی قرار می‌گیرد.
            </p>
          </div>
        </div>

        <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          ساخت پروژه
        </Button>
      </DialogContent>
    </Dialog>
  )
}
