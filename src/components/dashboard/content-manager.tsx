'use client'

/* پنل کنترل محتوا — مدیریت اخبار و مطالب وبلاگ (مدیر سیستم)
 * ساخت / ویرایش / حذف + آپلود کاور؛ بدون نیاز به کد زدن */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatJalali } from '@/lib/jalali'
import { Plus, Loader2, Pencil, Trash2, ImagePlus, CheckCircle2, X } from 'lucide-react'

type ContentItem = {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  coverImage: string | null
  date: string
  slug?: string
  readMinutes?: number
}

const NEWS_CATEGORIES = [
  { id: 'occasion', label: 'مناسبت (بنر بالای اخبار)' },
  { id: 'prices', label: 'قیمت مصالح' },
  { id: 'policy', label: 'قوانین و سیاست‌ها' },
  { id: 'company', label: 'خبر گروه' },
]

const BLOG_CATEGORIES = ['مصالح', 'برق و تاسیسات', 'ایزولاسیون', 'سازه', 'نازک‌کاری']

export function ContentManager({ type }: { type: 'news' | 'blog' }) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/${type}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setItems(d.news || d.posts || []) })
      .catch(() => toast.error('خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [type])

  useEffect(() => {
    const t = setTimeout(() => load(), 0)
    return () => clearTimeout(t)
  }, [load])

  const remove = async (id: string) => {
    if (!window.confirm('این مورد حذف شود؟ این عمل قابل بازگشت نیست.')) return
    const res = await fetch(`/api/admin/${type}?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('خطا در حذف')
      return
    }
    toast.success('حذف شد')
    setItems((p) => p.filter((i) => i.id !== id))
  }

  const isBlog = type === 'blog'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] text-muted-foreground leading-5">
          {isBlog
            ? 'مطالب تخصصی وبلاگ؛ همان‌هایی که در صفحه «وبلاگ» سایت دیده می‌شوند.'
            : 'اخبار و مناسبت‌ها؛ مناسبت‌ها به‌صورت بنر عکس‌دار چرخان بالای صفحه اخبار نمایش داده می‌شوند.'}
        </p>
        <Button size="sm" onClick={() => setCreating(true)} className="gold-btn rounded-full shrink-0">
          <Plus className="size-4" /> {isBlog ? 'مطلب جدید' : 'خبر جدید'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="card-lux h-20 animate-pulse bg-muted/40" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card-lux p-8 text-center text-muted-foreground text-xs">هنوز موردی ثبت نشده است.</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => (
            <div key={n.id} className="card-lux p-3.5 flex items-center gap-3">
              {n.coverImage ? (
                <img src={n.coverImage} alt="" className="size-14 rounded-xl object-cover border border-border shrink-0" />
              ) : (
                <span className="size-14 rounded-xl bg-accent grid place-items-center text-gold text-[0.6rem] font-bold shrink-0">بدون عکس</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs leading-5 line-clamp-1">{n.title}</p>
                <p className="text-[0.6rem] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className={`rounded-full px-1.5 py-0.5 border ${
                    n.category === 'occasion' ? 'border-gold/40 text-gold bg-gold/10' : 'border-border text-muted-foreground'
                  }`}>
                    {isBlog ? n.category : NEWS_CATEGORIES.find((c) => c.id === n.category)?.label || n.category}
                  </span>
                  <span>{formatJalali(new Date(n.date), { short: true })}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="icon" variant="outline" onClick={() => setEditing(n)} className="rounded-full size-8" aria-label="ویرایش">
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => remove(n.id)} className="rounded-full size-8 text-destructive hover:bg-destructive/10" aria-label="حذف">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContentEditor
        type={type}
        open={creating || !!editing}
        item={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSaved={() => {
          setCreating(false)
          setEditing(null)
          load()
        }}
      />
    </div>
  )
}

/* ===== دیالوگ ساخت/ویرایش ===== */
function ContentEditor({
  type, open, item, onClose, onSaved,
}: {
  type: 'news' | 'blog'
  open: boolean
  item: ContentItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const isBlog = type === 'blog'
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(isBlog ? BLOG_CATEGORIES[0] : 'company')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [readMinutes, setReadMinutes] = useState(4)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  /* پر کردن فرم هنگام باز شدن — با تأخیر ری‌اکت-فرندلی */
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      setTitle(item?.title || '')
      setCategory(item?.category || (isBlog ? BLOG_CATEGORIES[0] : 'company'))
      setExcerpt(item?.excerpt || '')
      setContent(item?.content || '')
      setReadMinutes(item?.readMinutes || 4)
      setCoverUrl(item?.coverImage || null)
    }, 0)
    return () => clearTimeout(t)
  }, [open, item, isBlog])

  const uploadCover = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setCoverUrl(d.url)
      toast.success('تصویر آپلود شد')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در آپلود')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('عنوان و متن الزامی است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/${type}`, {
        method: item ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(item ? { id: item.id } : {}),
          title, category, excerpt, content, coverImage: coverUrl,
          ...(isBlog ? { readMinutes } : {}),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(item ? 'تغییرات ذخیره شد' : 'با موفقیت ساخته شد')
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ذخیره')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'ویرایش' : 'ساخت'} {isBlog ? 'مطلب وبلاگ' : 'خبر'}</DialogTitle>
          <DialogDescription>
            {isBlog ? 'مطلب در صفحه وبلاگ سایت نمایش داده می‌شود.' : 'خبر در صفحه اخبار نمایش داده می‌شود؛ دسته «مناسبت» در بنر چرخان بالای صفحه قرار می‌گیرد.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5 py-1">
          <div>
            <Label className="text-xs mb-1.5 block">عنوان *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">دسته</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isBlog
                    ? BLOG_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    : NEWS_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isBlog && (
              <div>
                <Label className="text-xs mb-1.5 block">زمان مطالعه (دقیقه)</Label>
                <Input type="number" min={1} max={60} value={readMinutes} onChange={(e) => setReadMinutes(Number(e.target.value) || 4)} dir="ltr" className="bg-background rounded-xl text-start" />
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">خلاصه (نمایش در کارت)</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="bg-background rounded-xl text-xs leading-6 resize-none" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">متن کامل *</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={7} className="bg-background rounded-xl text-xs leading-6 resize-y" />
          </div>

          {/* کاور */}
          <div>
            <Label className="text-xs mb-1.5 block">تصویر کاور</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadCover(f)
              e.target.value = ''
            }} />
            <div className="flex items-center gap-3 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full gap-1.5 text-xs">
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                انتخاب تصویر
              </Button>
              {coverUrl && (
                <>
                  <img src={coverUrl} alt="" className="size-10 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setCoverUrl(null)} className="text-destructive text-[0.62rem] inline-flex items-center gap-1">
                    <X className="size-3" /> حذف تصویر
                  </button>
                </>
              )}
            </div>
            {!isBlog && category === 'occasion' && (
              <p className="text-[0.6rem] text-gold mt-1.5 leading-4">
                عکس مناسبت به‌صورت بنر تمام‌عرض کوتاه با متن روی آن نمایش داده می‌شود — عکس افقی انتخاب کنید.
              </p>
            )}
          </div>
        </div>

        <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {item ? 'ذخیره تغییرات' : 'انتشار'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
