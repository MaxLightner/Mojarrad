'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAppStore, type AuthUser } from '@/lib/store'
import { formatJalali, toFaDigits } from '@/lib/jalali'
import { ROLE_META } from '@/components/timeline/shared'
import {
  Map, ImageIcon, Layers, FileText, Plus, Loader2, Send, MessageCircle,
  History, FileBox, Paperclip, RotateCcw,
} from 'lucide-react'

type RefMessage = {
  id: string
  authorId: string
  authorName: string
  authorRole: string
  text: string
  createdAt: string
}

type ReferenceItem = {
  id: string
  title: string
  category: string
  description: string
  fileUrl: string | null
  version: number
  status: string
  addedByName: string | null
  createdAt: string
  messages: RefMessage[]
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  map: { label: 'نقشه / پلان', icon: Map, color: '#38bdf8' },
  photo: { label: 'عکس رفرنس', icon: ImageIcon, color: '#a78bfa' },
  material: { label: 'مصالح / برند', icon: Layers, color: '#10b981' },
  other: { label: 'سایر', icon: FileText, color: '#d4a531' },
}

export function ReferencesPanel({ projectId }: { projectId: string }) {
  const user = useAppStore((s) => s.user) as AuthUser | null
  const [items, setItems] = useState<ReferenceItem[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`/api/references?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        setItems(d.references || [])
        setCanManage(!!d.canManage)
      })
      .catch(() => toast.error('خطا در بارگذاری رفرنس‌ها'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const active = items.filter((i) => i.status === 'active')
  const superseded = items.filter((i) => i.status === 'superseded')
  // آیتم تازه دیتابیس — بعد از هر ارسال پیام به‌روز می‌شود
  const threadItem = items.find((i) => i.id === threadId) || null

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="card-lux h-48 animate-pulse bg-muted/40" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-muted-foreground text-xs leading-6 max-w-lg">
          نقشه‌ها، عکس‌های رفرنس و انتخاب مصالحی که مالک و مدیریت تعیین می‌کنند — همه در یک‌جا، بدون واتساپ.
          روی هر کارت می‌توانید سؤال بپرسید یا پاسخ بدهید.
        </p>
        {canManage && (
          <Button onClick={() => setAddOpen(true)} className="gold-btn rounded-full shrink-0">
            <Plus className="size-4" /> افزودن رفرنس
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          هنوز رفرنسی برای این پروژه ثبت نشده است.
          {canManage && ' با دکمه «افزودن رفرنس» اولین نقشه یا عکس رفرنس را اضافه کنید.'}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {active.map((item, i) => (
          <ReferenceCard key={item.id} item={item} index={i} onOpenThread={() => setThreadId(item.id)} />
        ))}
      </div>

      {/* بازنگری‌های قبلی — آرشیو */}
      {superseded.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <History className="size-4 text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground">
              نسخه‌های قبلی ({toFaDigits(superseded.length)}) — بازنگری‌شده
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {superseded.map((item) => (
              <ReferenceCard key={item.id} item={item} index={-1} onOpenThread={() => setThreadId(item.id)} dimmed />
            ))}
          </div>
        </div>
      )}

      {/* پاپ‌آپ پرسش‌وپاسخ */}
      {threadItem && (
        <ThreadDialog
          key={threadItem.id}
          referenceId={threadItem.id}
          title={threadItem.title}
          messages={threadItem.messages}
          canComment={!!user && user.role !== 'supervisor'}
          onPosted={load}
          onClose={() => setThreadId(null)}
        />
      )}

      {/* فرم افزودن */}
      <AddReferenceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        activeItems={active}
        onDone={load}
      />
    </div>
  )
}

/* ================= کارت رفرنس ================= */

function ReferenceCard({
  item: reference,
  index,
  onOpenThread,
  dimmed,
}: {
  item: ReferenceItem
  index: number
  onOpenThread: () => void
  dimmed?: boolean
}) {
  const meta = CATEGORY_META[reference.category] || CATEGORY_META.other
  const Icon = meta.icon
  const isImageFile = !!reference.fileUrl?.match(/\.(jpe?g|png|webp|gif)$/i)

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index >= 0 ? Math.min(index * 0.05, 0.2) : 0 }}
      onClick={onOpenThread}
      className={`card-lux overflow-hidden text-start group ${dimmed ? 'opacity-60 hover:opacity-90' : ''}`}
    >
      <div className="flex gap-0">
        {reference.fileUrl && (
          <div className="relative w-32 sm:w-40 shrink-0 overflow-hidden bg-muted/30">
            {isImageFile ? (
              <img
                src={reference.fileUrl}
                alt={reference.title}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <FileBox className="size-10 text-muted-foreground/50" />
              </div>
            )}
          </div>
        )}
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="gap-1 text-[0.62rem]"
              style={{ background: `${meta.color}1a`, color: meta.color }}
            >
              <Icon className="size-3" />
              {meta.label}
            </Badge>
            {reference.version > 1 && (
              <Badge variant="outline" className="text-[0.6rem] h-5 gap-1 border-gold/40 text-gold">
                نسخه {toFaDigits(reference.version)}
              </Badge>
            )}
            {dimmed && (
              <Badge variant="outline" className="text-[0.6rem] h-5 gap-1 text-muted-foreground">
                <History className="size-2.5" /> بازنگری‌شده
              </Badge>
            )}
            {reference.messages.length > 0 && (
              <Badge variant="secondary" className="text-[0.6rem] h-5 gap-1 ms-auto">
                <MessageCircle className="size-2.5" />
                {toFaDigits(reference.messages.length)}
              </Badge>
            )}
          </div>
          <p className="font-bold text-sm leading-6 mt-2 line-clamp-1">{reference.title}</p>
          <p className="text-muted-foreground text-xs leading-6 mt-1.5 line-clamp-2">{reference.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[0.62rem] text-muted-foreground">
              {reference.addedByName || '—'} · {formatJalali(new Date(reference.createdAt), { short: true })}
            </span>
            <span className="ms-auto text-[0.62rem] text-gold inline-flex items-center gap-1 font-bold">
              <MessageCircle className="size-3" />
              پرسش‌وپاسخ
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

/* ================= پاپ‌آپ پرسش‌وپاسخ ================= */

function ThreadDialog({
  referenceId,
  title,
  messages,
  canComment,
  onPosted,
  onClose,
}: {
  referenceId: string
  title: string
  messages: RefMessage[]
  canComment: boolean
  onPosted: () => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    const text = draft.trim()
    if (!text) return
    setSending(true)
    try {
      const res = await fetch('/api/references/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId, text }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setDraft('')
      toast.success('پیام ثبت شد')
      onPosted()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت پیام')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-xl max-h-[85dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MessageCircle className="size-4 text-gold shrink-0" />
            پرسش‌وپاسخ رفرنس
          </DialogTitle>
          <DialogDescription className="text-[0.7rem] leading-5 text-muted-foreground line-clamp-1">
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-[140px]">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-10">
              هنوز سوالی درباره این رفرنس پرسیده نشده
            </p>
          ) : (
            messages.map((m) => {
              const roleMeta = ROLE_META[m.authorRole]
              const RoleIcon = roleMeta?.icon
              return (
                <div key={m.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-center gap-2">
                    {RoleIcon ? (
                      <span
                        className="size-[18px] grid place-items-center rounded-full border shrink-0"
                        style={{ background: `${roleMeta.color}1f`, borderColor: `${roleMeta.color}55` }}
                      >
                        <RoleIcon className="size-2.5" style={{ color: roleMeta.color }} />
                      </span>
                    ) : (
                      <span className="size-[18px] grid place-items-center rounded-full bg-muted border border-border shrink-0">
                        <Send className="size-2.5 text-muted-foreground" />
                      </span>
                    )}
                    <span className="text-[0.7rem] font-bold">{m.authorName}</span>
                    <span className="ms-auto text-[0.62rem] text-muted-foreground shrink-0">
                      {formatJalali(new Date(m.createdAt), { short: true })}
                    </span>
                  </div>
                  <p className="text-xs leading-6 mt-2">{m.text}</p>
                </div>
              )
            })
          )}
        </div>

        {canComment ? (
          <div className="border-t border-border/60 px-4 py-3 shrink-0 bg-muted/10">
            <div className="flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
                }}
                placeholder="سؤال یا توضیح شما... (Ctrl+Enter)"
                rows={2}
                className="text-xs rounded-xl bg-background resize-none min-h-9"
              />
              <Button
                size="icon"
                onClick={submit}
                disabled={sending || !draft.trim()}
                className="gold-btn rounded-xl size-9 shrink-0 self-end"
                aria-label="ارسال پیام"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border/60 px-4 py-2.5 shrink-0">
            <p className="text-[0.62rem] text-muted-foreground text-center">مشاهده پیام‌ها</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ================= فرم افزودن رفرنس ================= */

function AddReferenceDialog({
  open,
  onOpenChange,
  projectId,
  activeItems,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectId: string
  activeItems: ReferenceItem[]
  onDone: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('photo')
  const [description, setDescription] = useState('')
  const [supersedesId, setSupersedesId] = useState('none')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(''); setCategory('photo'); setDescription('')
      setSupersedesId('none'); setFile(null)
    }
  }, [open])

  const submit = async () => {
    if (!title.trim()) {
      toast.error('عنوان رفرنس را بنویسید')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('title', title.trim())
      fd.append('category', category)
      fd.append('description', description.trim())
      if (supersedesId !== 'none') fd.append('supersedesId', supersedesId)
      if (file) fd.append('file', file)
      const res = await fetch('/api/references', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(supersedesId !== 'none' ? 'بازنگری ثبت شد — نسخه قبلی آرشیو گردید' : 'رفرنس ثبت شد')
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت رفرنس')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-gold" /> افزودن رفرنس
          </DialogTitle>
          <DialogDescription>
            نقشه، عکس رفرنس یا مشخصات مصالح — هر چیزی که تیم اجرا باید طبق آن پیش برود.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label className="text-xs mb-1.5 block">عنوان *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: نقشه بازنگری آشپزخانه واحد ۱"
              className="bg-background rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">دسته</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">توضیحات</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً: سینک زیر پنجره غربی جابجا شد؛ طبق این نسخه اجرا شود."
              rows={3}
              className="bg-background rounded-xl resize-none"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">فایل / عکس</Label>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl w-full border-dashed">
              <Paperclip className="size-4 text-gold" />
              {file ? file.name : 'انتخاب فایل (اختیاری)'}
            </Button>
          </div>

          {activeItems.length > 0 && (
            <div>
              <Label className="text-xs mb-1.5 block">جایگزین نسخه قبلی (بازنگری)</Label>
              <Select value={supersedesId} onValueChange={setSupersedesId}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— رفرنس جدید (بدون جایگزینی)</SelectItem>
                  {activeItems.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                      {r.version > 1 ? ` (نسخه ${toFaDigits(r.version)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supersedesId !== 'none' && (
                <p className="text-[0.65rem] text-muted-foreground mt-1.5 leading-5 flex items-center gap-1">
                  <RotateCcw className="size-3 text-gold shrink-0" />
                  نسخه قبلی آرشیو می‌شود اما حذف نمی‌شود — برای مرجع باقی می‌ماند.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full flex-1">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            ثبت رفرنس
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            انصراف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
