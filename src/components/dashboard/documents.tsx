'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { toFaDigits } from '@/lib/jalali'
import { FileCheck, FileText, ScrollText, Ruler, FileStack, Plus, Loader2, Download, Paperclip } from 'lucide-react'

type Doc = {
  id: string
  title: string
  category: string
  note: string | null
  fileUrl: string | null
  createdAt: string
}

const DOC_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  permit: { label: 'مجوز ساخت', icon: FileCheck, color: '#a78bfa' },
  completion: { label: 'پایان‌کار', icon: ScrollText, color: '#10b981' },
  contract: { label: 'قرارداد', icon: FileText, color: '#d4a531' },
  drawing: { label: 'نقشه', icon: Ruler, color: '#14b8a6' },
  other: { label: 'سایر اسناد', icon: FileStack, color: '#f59e0b' },
}

export function DocumentsPanel({ projectId, readOnly = false }: { projectId: string; readOnly?: boolean }) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('permit')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/documents?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setDocs(d.documents || []))
      .catch(() => toast.error('خطا در بارگذاری اسناد'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const submit = async () => {
    if (!title.trim()) {
      toast.error('عنوان سند را بنویسید')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('title', title.trim())
      fd.append('category', category)
      fd.append('note', note.trim())
      if (file) fd.append('file', file)
      const res = await fetch('/api/documents', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('سند ثبت شد')
      setAddOpen(false); setTitle(''); setNote(''); setFile(null); setCategory('permit')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت سند')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-muted-foreground text-xs leading-6 max-w-lg">
          مجوز ساخت، پایان‌کار، قراردادها و نقشه‌های هر پروژه — همه در یک جا، دسته‌بندی‌شده و قابل پیوست فایل.
        </p>
        {!readOnly && (
          <Button onClick={() => setAddOpen(!addOpen)} className="gold-btn rounded-full shrink-0">
            {addOpen ? 'بستن فرم' : <><Plus className="size-4" /> افزودن سند</>}
          </Button>
        )}
      </div>

      {addOpen && (
        <div className="card-lux p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">عنوان سند *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: پروانه ساخت فاز ۲" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">دسته سند</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1.5 block">توضیح / شماره سند</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختیاری — مثلاً شماره و مرجع صدور" className="bg-background rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1.5 block">فایل (اختیاری، حداکثر ۸ مگابایت)</Label>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl w-full border-dashed">
                <Paperclip className="size-4 text-gold" />
                {file ? file.name : 'انتخاب فایل'}
              </Button>
            </div>
          </div>
          <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full mt-4">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            ثبت سند
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-lux h-20 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          هنوز سندی ثبت نشده است.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {docs.map((doc) => {
            const meta = DOC_CATEGORIES[doc.category] || DOC_CATEGORIES.other
            const Icon = meta.icon
            return (
              <div key={doc.id} className="card-lux p-4 flex items-center gap-4">
                <span
                  className="flex size-11 rounded-xl items-center justify-center shrink-0"
                  style={{ background: `${meta.color}18`, color: meta.color }}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[0.65rem] rounded-full px-2 py-0.5" style={{ background: `${meta.color}18`, color: meta.color }}>
                      {meta.label}
                    </span>
                    {doc.note && <span className="text-muted-foreground text-[0.65rem] truncate">{doc.note}</span>}
                  </div>
                </div>
                {doc.fileUrl ? (
                  <Button asChild size="icon" variant="outline" className="rounded-full size-9 shrink-0">
                    <a href={doc.fileUrl} download aria-label={`دانلود ${doc.title}`}>
                      <Download className="size-4 text-gold" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-[0.62rem] text-muted-foreground shrink-0">بدون فایل</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[0.68rem] text-muted-foreground mt-5">
        {toFaDigits(docs.length)} سند ثبت شده است
      </p>
    </div>
  )
}
