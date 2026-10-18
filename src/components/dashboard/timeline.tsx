'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAppStore, type AuthUser } from '@/lib/store'
import { formatJalali, todayJalali, JALALI_MONTHS, toFaDigits, formatToman } from '@/lib/jalali'
import {
  Hammer, Package, AlertTriangle, Eye, FileCheck, FileText, ChevronDown,
  ImagePlus, Send, Plus, Loader2, FileBadge, Paperclip, PenLine, MousePointer2, Trash2,
  Undo2, X, Upload, Download, MessageCircle, Wallet, Bookmark, Shield, Ruler,
  HardHat, Crown, Truck, CheckCircle2, Camera, Clock, ArrowLeft,
} from 'lucide-react'

type EventComment = {
  id: string
  text: string
  image: string | null
  authorId: string
  authorName: string
  authorRole: string
  authorRoleLabel: string
  visibility: string
  needsFollowUp: boolean
  resolvedAt: string | null
  createdAt: string
}

type EventFile = { name: string; url: string }

type TimelineEvent = {
  id: string
  date: string
  category: string
  title: string
  description: string
  isReport: boolean
  images: string[]
  files: EventFile[]
  authorName: string | null
  comments: EventComment[]
  paymentAmount: string | null
}

type Viewer = {
  role: string
  roleLabel: string
  seesComments: boolean
  canComment: boolean
  reportOnly: boolean
}

export const EVENT_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  execution: { label: 'اجرا', icon: Hammer, color: '#10b981' },
  supply: { label: 'تأمین', icon: Package, color: '#14b8a6' },
  delay: { label: 'تأخیر', icon: AlertTriangle, color: '#ef4444' },
  visit: { label: 'بازدید ناظر', icon: Eye, color: '#f59e0b' },
  decision: { label: 'تصمیم / مجوز', icon: FileCheck, color: '#a78bfa' },
  report: { label: 'گزارش دوره‌ای', icon: FileText, color: '#d4a531' },
  payment: { label: 'پرداخت', icon: Wallet, color: '#22c55e' },
  reference: { label: 'رفرنس', icon: Bookmark, color: '#38bdf8' },
}

// دسته‌هایی که کاربر می‌تواند دستی ثبت کند (پرداخت و رفرنس خودکار ساخته می‌شوند)
const ADDABLE_CATEGORIES = ['execution', 'supply', 'delay', 'visit', 'decision', 'report']

const TEAM_ROLES = ['admin', 'executor', 'engineer', 'foreman']

/* آواتار نقش‌ها در گفتگو — هر نقش یک آیکون و رنگ ثابت */
export const ROLE_META: Record<string, { icon: React.ElementType; color: string }> = {
  admin: { icon: Shield, color: '#8b5cf6' },
  executor: { icon: Hammer, color: '#10b981' },
  engineer: { icon: Ruler, color: '#38bdf8' },
  foreman: { icon: HardHat, color: '#f59e0b' },
  supervisor: { icon: Eye, color: '#f59e0b' },
  owner: { icon: Crown, color: '#d4a531' },
  contractor: { icon: Truck, color: '#14b8a6' },
}

const VIS_TARGET_LABELS: Record<string, string> = {
  management: 'مدیریت و مجری',
  team: 'تیم اجرا',
  owner: 'مالک',
  contractor: 'پیمانکار',
}

/** برچسب مخاطب پیام برای نویسنده‌های غیر از مدیریت */
const AUTHOR_TARGET_LABELS: Record<string, string> = {
  owner: 'مدیریت و مجری',
  contractor: 'مدیریت و مجری',
  engineer: 'تیم اجرا',
  foreman: 'تیم اجرا',
}

function RoleAvatar({ role, size = 'md' }: { role: string; size?: 'sm' | 'md' }) {
  const meta = ROLE_META[role] || ROLE_META.admin
  const Icon = meta.icon
  return (
    <span
      className={`grid place-items-center rounded-full border shrink-0 ${size === 'sm' ? 'size-[18px]' : 'size-8'}`}
      style={{ background: `${meta.color}1f`, borderColor: `${meta.color}55` }}
      aria-hidden
    >
      <Icon className={size === 'sm' ? 'size-2.5' : 'size-4'} style={{ color: meta.color }} />
    </span>
  )
}

/* ================= چیپ گفتگو روی هر رویداد ================= */
/* آواتار کوچک نویسنده‌ها + تعداد پیام؛ کلیک → پاپ‌آپ گفتگو */

function CommentChip({
  comments,
  onOpen,
}: {
  comments: EventComment[]
  onOpen: () => void
}) {
  // نقش‌های یکتای نویسنده‌ها (نهایتاً ۳ آواتار)
  const roles: string[] = []
  for (const c of comments) {
    if (!roles.includes(c.authorRole)) roles.push(c.authorRole)
  }
  const pendingFollowUp = comments.some((c) => c.needsFollowUp && !c.resolvedAt)
  const shown = roles.slice(0, 3)

  const authorsHint = roles
    .map((r) => (ROLE_META[r] ? r : null))
    .filter(Boolean)
    .join(' و')

  if (comments.length === 0) {
    return (
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.68rem] text-muted-foreground border border-border/70 hover:border-gold/50 hover:text-gold transition-colors"
        title="گفتگو درباره این رویداد"
      >
        <MessageCircle className="size-3.5" />
        گفتگو
      </button>
    )
  }

  return (
    <button
      onClick={onOpen}
      className={`relative inline-flex items-center gap-2 h-7 ps-2 pe-3 rounded-full border transition-colors ${
        pendingFollowUp
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-600'
          : 'border-gold/40 bg-gold/5 text-gold hover:bg-gold/15'
      }`}
      title={`گفتگو — ${toFaDigits(comments.length)} پیام`}
    >
      <span className="flex -space-x-1" dir="rtl">
        {shown.map((r) => (
          <RoleAvatar key={r} role={r} size="sm" />
        ))}
        {roles.length > 3 && (
          <span className="size-[18px] grid place-items-center rounded-full bg-muted border border-border text-[0.55rem] font-bold text-muted-foreground">
            +{toFaDigits(roles.length - 3)}
          </span>
        )}
      </span>
      <span className="text-[0.68rem] font-bold tabular-nums">{toFaDigits(comments.length)}</span>
      {pendingFollowUp && <Clock className="size-3 animate-pulse" />}
    </button>
  )
}

/* ================= پاپ‌آپ گفتگوی رویداد ================= */

function CommentsDialog({
  event,
  viewer,
  user,
  pendingImage,
  onSetImage,
  onClearImage,
  onAnnotate,
  onImageClick,
  onPosted,
  onClose,
}: {
  event: TimelineEvent
  viewer: Viewer
  user: AuthUser
  pendingImage: string | null
  onSetImage: (dataUrl: string) => void
  onClearImage: () => void
  onAnnotate: () => void
  onImageClick: (img: string) => void
  onPosted: () => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [visibility, setVisibility] = useState('management')
  const [followUp, setFollowUp] = useState(false)
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  const canChooseVis = viewer.role === 'admin' || viewer.role === 'executor'
  const fixedTarget = AUTHOR_TARGET_LABELS[viewer.role] || 'مدیریت و مجری'

  const pickPhoto = (f: File | undefined) => {
    if (!f) return
    if (f.size > 3 * 1024 * 1024) {
      toast.error('حجم عکس کمتر از ۳ مگابایت باشد')
      return
    }
    const r = new FileReader()
    r.onload = () => onSetImage(String(r.result))
    r.readAsDataURL(f)
  }

  const submit = async () => {
    const text = draft.trim()
    if (!text && !pendingImage) return
    if (!text) {
      toast.error('متن پیام را بنویسید')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          text,
          imageDataUrl: pendingImage,
          visibility,
          needsFollowUp: followUp,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setDraft('')
      setFollowUp(false)
      onClearImage()
      toast.success('پیام ثبت شد')
      onPosted()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت پیام')
    } finally {
      setSending(false)
    }
  }

  const resolve = async (commentId: string) => {
    setResolving(commentId)
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      if (!res.ok) throw new Error()
      toast.success('پیگیری انجام‌شده علامت خورد')
      onPosted()
    } catch {
      toast.error('خطا در به‌روزرسانی')
    } finally {
      setResolving(null)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-xl max-h-[88dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MessageCircle className="size-4 text-gold shrink-0" />
            گفتگوی رویداد
          </DialogTitle>
          <DialogDescription className="text-[0.7rem] leading-5 text-muted-foreground line-clamp-1">
            {event.title} — {formatJalali(new Date(event.date), { short: true })}
          </DialogDescription>
        </DialogHeader>

        {/* پیام‌ها */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-[140px]">
          {event.comments.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-10">
              هنوز پیامی رد و بدل نشده — اولین نفر باشید
            </p>
          )}
          {event.comments.map((c) => {
            const pendingFollowUp = c.needsFollowUp && !c.resolvedAt
            const canResolve =
              pendingFollowUp &&
              (viewer.role === 'admin' || viewer.role === 'executor' || c.authorId === user.id)
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-3 ${
                  pendingFollowUp
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-border/60 bg-background/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RoleAvatar role={c.authorRole} size="sm" />
                  <span className="text-[0.7rem] font-bold">{c.authorName}</span>
                  <span className="text-[0.62rem] text-muted-foreground">{c.authorRoleLabel}</span>
                  <span className="ms-auto text-[0.62rem] text-muted-foreground shrink-0">
                    {formatJalali(new Date(c.createdAt), { short: true })}
                  </span>
                </div>
                <p className="text-xs leading-6 mt-2">{c.text}</p>
                {c.image && (
                  <button
                    onClick={() => onImageClick(c.image as string)}
                    className="mt-2 rounded-lg overflow-hidden border border-border/60 block"
                    aria-label="نمایش عکس پیام"
                  >
                    <img src={c.image} alt="عکس پیام" className="h-24 object-cover hover:scale-[1.03] transition-transform" />
                  </button>
                )}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {c.visibility !== 'management' && (
                    <span className="inline-flex items-center gap-1 text-[0.6rem] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                      <ArrowLeft className="size-2.5" />
                      {VIS_TARGET_LABELS[c.visibility] || c.visibility}
                    </span>
                  )}
                  {pendingFollowUp && (
                    <>
                      <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/40 rounded-full px-2 py-0.5">
                        <Clock className="size-2.5" />
                        منتظر پیگیری
                      </span>
                      {canResolve && (
                        <button
                          onClick={() => resolve(c.id)}
                          disabled={resolving === c.id}
                          className="text-[0.62rem] font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                        >
                          {resolving === c.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                          انجام شد
                        </button>
                      )}
                    </>
                  )}
                  {c.needsFollowUp && c.resolvedAt && (
                    <span className="inline-flex items-center gap-1 text-[0.6rem] text-emerald-600 bg-emerald-500/10 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="size-2.5" />
                      پیگیری انجام شد
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* فرم ارسال */}
        {viewer.canComment ? (
          <div className="border-t border-border/60 px-4 py-3 space-y-2 shrink-0 bg-muted/10">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickPhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            {pendingImage && (
              <div className="flex items-center gap-2.5 glass rounded-xl p-2 border border-border">
                <img src={pendingImage} alt="عکس پیوست" className="size-10 rounded-lg object-cover border border-border" />
                <p className="text-[0.65rem] text-muted-foreground flex-1">این عکس همراه پیام ارسال می‌شود</p>
                <Button size="icon" variant="ghost" onClick={onClearImage} className="size-7 shrink-0" aria-label="حذف عکس">
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) submit()
                }}
                placeholder="پیام شما... (Ctrl+Enter)"
                rows={2}
                className="text-xs rounded-xl bg-background resize-none min-h-9"
              />
              <Button
                size="icon"
                onClick={submit}
                disabled={sending || (!draft.trim() && !pendingImage)}
                className="gold-btn rounded-xl size-9 shrink-0 self-end"
                aria-label="ارسال پیام"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {canChooseVis ? (
                <div className="flex items-center gap-1" role="group" aria-label="مخاطب پیام">
                  {(['management', 'team', 'owner', 'contractor'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      title={`این پیام برای ${VIS_TARGET_LABELS[v]} قابل مشاهده است`}
                      className={`text-[0.62rem] font-bold rounded-full px-2.5 py-1 border transition-colors ${
                        visibility === v
                          ? 'border-gold/60 bg-gold/15 text-gold'
                          : 'border-border/70 text-muted-foreground hover:border-gold/40'
                      }`}
                    >
                      {v === 'management' ? 'داخلی' : VIS_TARGET_LABELS[v]}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[0.62rem] text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                  <ArrowLeft className="size-2.5" />
                  به: {fixedTarget}
                </span>
              )}

              <button
                onClick={() => setFollowUp(!followUp)}
                title="مخاطب پیام باید این مورد را پیگیری و انجام دهد"
                className={`text-[0.62rem] font-bold rounded-full px-2.5 py-1 border inline-flex items-center gap-1 transition-colors ${
                  followUp
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-600'
                    : 'border-border/70 text-muted-foreground hover:border-amber-500/40'
                }`}
              >
                <Clock className="size-2.5" />
                درخواست پیگیری
              </button>

              <span className="ms-auto flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => photoInputRef.current?.click()}
                  className="size-7 rounded-full text-muted-foreground hover:text-gold"
                  title="ارسال عکس همراه پیام"
                  aria-label="ارسال عکس همراه پیام"
                >
                  <Camera className="size-3.5" />
                </Button>
                {event.images.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onAnnotate}
                    className="size-7 rounded-full text-muted-foreground hover:text-gold"
                    title="خط و فلش روی عکس رویداد بکشید و همراه پیام بفرستید"
                    aria-label="خط و فلش روی عکس"
                  >
                    <PenLine className="size-3.5" />
                  </Button>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="border-t border-border/60 px-4 py-2.5 shrink-0">
            <p className="text-[0.62rem] text-muted-foreground text-center">
              مشاهده پیام‌ها — برای گفتگو با مدیریت هماهنگ کنید
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ================= تایم‌لاین ================= */

export function Timeline({ projectId }: { projectId: string }) {
  const user = useAppStore((s) => s.user) as AuthUser | null
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dialogEventId, setDialogEventId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ eventId: string; images: string[]; index: number } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  // عکس مشروح‌شده در انتظار ارسال با پیام (در پاپ‌آپ گفتگو)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const uploadTarget = useRef<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetch(`/api/timeline?projectId=${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        setEvents(d.events || [])
        setViewer(d.viewer || null)
      })
      .catch(() => setError('خطا در بارگذاری تایم‌لاین'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const proposePhoto = async (eventId: string, file: File) => {
    setUploading(eventId)
    try {
      const fd = new FormData()
      fd.append('eventId', eventId)
      fd.append('image', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(
        d.status === 'pending'
          ? 'عکس ثبت شد — بعد از تأیید مدیر در گالری رویداد نمایش داده می‌شود'
          : 'عکس به رویداد اضافه شد'
      )
      if (d.status === 'approved') load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در آپلود عکس')
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 py-8" aria-busy>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse bg-muted/40" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-lux p-8 text-center text-muted-foreground text-sm">
        {error}
        <Button onClick={load} variant="outline" className="mt-4 block mx-auto rounded-full">
          تلاش مجدد
        </Button>
      </div>
    )
  }

  const canAdd = user ? TEAM_ROLES.includes(user.role) : false
  const dialogEvent = events.find((e) => e.id === dialogEventId) || null

  return (
    <div>
      {viewer?.reportOnly && (
        <div className="glass border border-gold/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Eye className="size-5 text-gold shrink-0" />
          <p className="text-xs leading-6 text-muted-foreground">
            شما در حال مشاهده <span className="text-gold font-bold">گزارش‌های رسمی پروژه</span> هستید.
            جزئیات داخلی اجرا و مباحث فنی فقط برای تیم اجرا نمایش داده می‌شود.
          </p>
        </div>
      )}

      {events.length === 0 && (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          هنوز رویدادی برای این پروژه ثبت نشده است.
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          const target = uploadTarget.current
          if (f && target) proposePhoto(target, f)
          e.target.value = ''
        }}
      />

      <div className="relative">
        <div className="timeline-rail start-[9px] md:start-[11px]" />

        {events.map((e, i) => {
          const meta = EVENT_CATEGORIES[e.category] || EVENT_CATEGORIES.execution
          const Icon = meta.icon
          const isOpen = expanded === e.id
          const isLatest = i === 0
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.35 }}
              className="relative ps-8 md:ps-11 pb-4 last:pb-0"
            >
              {/* گره */}
              <span
                className="absolute start-[4px] md:start-[6px] top-3.5 size-[11px] md:size-3 rounded-full border-2 z-10"
                style={{ borderColor: meta.color, background: 'var(--background)', boxShadow: `0 0 10px ${meta.color}66` }}
                aria-hidden
              />

              <div className="rounded-2xl border border-border/70 bg-card/60 hover:bg-card transition-colors overflow-hidden">
                {/* سربرگ نازک */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pt-3 pb-2">
                  <span className="text-gold text-[0.72rem] font-bold tabular-nums">
                    {formatJalali(new Date(e.date))}
                  </span>
                  <span className="size-1 rounded-full" style={{ background: meta.color }} aria-hidden />
                  <span
                    className="inline-flex items-center gap-1 text-[0.68rem] font-bold"
                    style={{ color: meta.color }}
                  >
                    <Icon className="size-3" />
                    {meta.label}
                  </span>
                  {e.paymentAmount && (
                    <span className="inline-flex items-center gap-1 text-[0.72rem] font-extrabold text-emerald-600 dark:text-emerald-400">
                      <Wallet className="size-3" />
                      {formatToman(e.paymentAmount)} تومان
                    </span>
                  )}
                  {e.isReport && (
                    <Badge variant="outline" className="text-gold border-gold/40 gap-1 text-[0.6rem] h-5 px-2">
                      <FileBadge className="size-2.5" /> گزارش
                    </Badge>
                  )}
                  <span className="ms-auto text-[0.65rem] text-muted-foreground/80 hidden sm:block">
                    {e.authorName || '—'}
                  </span>
                </div>

                <button
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="w-full text-start px-4 pb-2 group"
                  aria-expanded={isOpen}
                >
                  <h3 className={`font-bold text-[0.83rem] md:text-sm leading-6 ${isLatest ? 'text-gold' : ''}`}>
                    {e.title}
                    <ChevronDown
                      className={`inline size-3.5 ms-1.5 align-middle text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </h3>
                  {!isOpen && e.description && (
                    <p className="text-muted-foreground text-[0.72rem] md:text-xs leading-6 line-clamp-2 mt-1">
                      {e.description}
                    </p>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3">
                        <p className="text-muted-foreground text-xs md:text-[0.83rem] leading-7 whitespace-pre-line">
                          {e.description}
                        </p>

                        {/* فایل‌های پیوست */}
                        {e.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {e.files.map((f, j) => (
                              <a
                                key={j}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 glass border border-border rounded-full px-3 py-1.5 text-[0.68rem] text-muted-foreground hover:text-gold hover:border-gold/50 transition-colors"
                              >
                                <Paperclip className="size-3 text-gold" />
                                {f.name}
                                <Download className="size-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* عکس‌های شناور */}
                        {e.images.length > 0 && (
                          <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar pb-1">
                            {e.images.map((img, j) => (
                              <motion.button
                                key={j}
                                onClick={() => setLightbox({ eventId: e.id, images: e.images, index: j })}
                                whileHover={{ y: -6, scale: 1.06 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`shrink-0 size-[76px] md:size-24 rounded-2xl overflow-hidden border border-border/80 shadow-md ${isLatest ? 'animate-float-soft' : ''}`}
                                aria-label={`عکس ${j + 1} رویداد`}
                              >
                                <img src={img} alt={`عکس رویداد ${j + 1}`} className="size-full object-cover" />
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* نوار ابزار مینیمال: گفتگو + افزودن عکس */}
                <div className="flex items-center gap-1.5 px-4 pb-2.5 pt-1 border-t border-border/50">
                  {viewer?.seesComments && (
                    <CommentChip comments={e.comments} onOpen={() => setDialogEventId(e.id)} />
                  )}
                  {viewer && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={uploading === e.id}
                      onClick={() => {
                        uploadTarget.current = e.id
                        photoInputRef.current?.click()
                      }}
                      className="size-7 rounded-full ms-auto text-muted-foreground hover:text-gold"
                      title="افزودن عکس به گالری رویداد (با تأیید مدیر)"
                      aria-label="افزودن عکس به گالری رویداد"
                    >
                      {uploading === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {canAdd && (
        <Button onClick={() => setAddOpen(true)} className="gold-btn rounded-full mt-6">
          <Plus className="size-4" /> ثبت رویداد جدید
        </Button>
      )}

      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} projectId={projectId} onDone={load} />

      {/* پاپ‌آپ گفتگو */}
      {dialogEvent && viewer && user && (
        <CommentsDialog
          key={dialogEvent.id}
          event={dialogEvent}
          viewer={viewer}
          user={user}
          pendingImage={pendingImage}
          onSetImage={setPendingImage}
          onClearImage={() => setPendingImage(null)}
          onAnnotate={() => setLightbox({ eventId: dialogEvent.id, images: dialogEvent.images, index: 0 })}
          onImageClick={(img) => setLightbox({ eventId: dialogEvent.id, images: [img], index: 0 })}
          onPosted={load}
          onClose={() => {
            setDialogEventId(null)
            setPendingImage(null)
          }}
        />
      )}

      {/* لایت‌باکس + حالت رسم */}
      <AnnotateLightbox
        data={lightbox}
        onClose={() => setLightbox(null)}
        onSetIndex={(idx) => setLightbox((prev) => (prev ? { ...prev, index: idx } : prev))}
        onAttach={(dataUrl) => {
          if (lightbox) {
            setPendingImage(dataUrl)
            // گفتگوی همان رویداد باز می‌شود تا پیام همراه عکس نوشته شود
            setDialogEventId(lightbox.eventId)
          }
          setLightbox(null)
        }}
      />
    </div>
  )
}

/* ================= لایت‌باکس با قابلیت رسم ================= */

type Stroke = { tool: 'pen' | 'arrow'; color: string; width: number; pts: { x: number; y: number }[] }

const PEN_COLORS = ['#ff8a3d', '#ef4444', '#ffffff', '#d4a531', '#38bdf8']

function AnnotateLightbox({
  data,
  onClose,
  onSetIndex,
  onAttach,
}: {
  data: { eventId: string; images: string[]; index: number } | null
  onClose: () => void
  onSetIndex: (index: number) => void
  onAttach: (dataUrl: string) => void
}) {
  return (
    <Dialog open={!!data} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-4xl p-0 overflow-hidden bg-card border-border max-h-[92dvh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>نمایش و مشروح‌سازی تصویر رویداد</DialogTitle>
          <DialogDescription>تصویر رویداد پروژه؛ می‌توانید خط و فلش رسم کنید و با پیام ارسال کنید</DialogDescription>
        </DialogHeader>
        {data && (
          <Annotator
            key={`${data.eventId}-${data.index}`}
            data={data}
            onSetIndex={onSetIndex}
            onAttach={onAttach}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Annotator({
  data,
  onSetIndex,
  onAttach,
}: {
  data: { eventId: string; images: string[]; index: number }
  onSetIndex: (index: number) => void
  onAttach: (dataUrl: string) => void
}) {
  const [drawMode, setDrawMode] = useState(false)
  const [tool, setTool] = useState<'pen' | 'arrow'>('pen')
  const [color, setColor] = useState(PEN_COLORS[0])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const drawingRef = useRef(false)

  const current = data.images[data.index]

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const all = activeStroke ? [...strokes, activeStroke] : strokes
    for (const s of all) {
      ctx.strokeStyle = s.color
      ctx.fillStyle = s.color
      ctx.lineWidth = s.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      if (s.tool === 'pen') {
        ctx.beginPath()
        s.pts.forEach((p, i) => {
          const x = p.x * w
          const y = p.y * h
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      } else {
        const a = s.pts[0]
        const b = s.pts[s.pts.length - 1]
        if (!a || !b) continue
        const x1 = a.x * w
        const y1 = a.y * h
        const x2 = b.x * w
        const y2 = b.y * h
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        // سر فلش
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLen = 12 + s.width * 2
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7))
        ctx.stroke()
      }
    }
  }, [strokes, activeStroke])

  useEffect(() => {
    redraw()
  }, [redraw])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawMode) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // در برخی مرورگرها/رویدادهای مصنوعی در دسترس نیست — ادامه با Listener سراسری
    }
    drawingRef.current = true
    const p = getPos(e)
    setActiveStroke({ tool, color, width: 3, pts: [p] })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const p = getPos(e)
    setActiveStroke((s) => (s ? { ...s, pts: [...s.pts, p] } : s))
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (activeStroke && activeStroke.pts.length > 1) {
      setStrokes((prev) => [...prev, activeStroke])
    }
    setActiveStroke(null)
  }

  const attach = async () => {
    const img = imgRef.current
    if (!img || !current) return
    // ساخت تصویر ترکیبی با کیفیت اصلی
    const natural = { w: img.naturalWidth, h: img.naturalHeight }
    const out = document.createElement('canvas')
    out.width = natural.w
    out.height = natural.h
    const ctx = out.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    for (const s of strokes) {
      ctx.strokeStyle = s.color
      ctx.fillStyle = s.color
      ctx.lineWidth = Math.max(2, s.width * (natural.w / 900))
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      if (s.tool === 'pen') {
        ctx.beginPath()
        s.pts.forEach((p, i) => {
          const x = p.x * natural.w
          const y = p.y * natural.h
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      } else {
        const a = s.pts[0]
        const b = s.pts[s.pts.length - 1]
        if (!a || !b) continue
        const x1 = a.x * natural.w
        const y1 = a.y * natural.h
        const x2 = b.x * natural.w
        const y2 = b.y * natural.h
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLen = 18 + ctx.lineWidth * 2
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7))
        ctx.stroke()
      }
    }
    const dataUrl = out.toDataURL('image/jpeg', 0.85)
    onAttach(dataUrl)
  }

  const hasStrokes = strokes.length > 0 || !!activeStroke

  return (
    <>
      {/* نوار ابزار */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
        <Button
          size="sm"
          variant={drawMode ? 'default' : 'outline'}
          onClick={() => setDrawMode(!drawMode)}
          className={`h-8 rounded-full text-xs gap-1.5 ${drawMode ? 'gold-btn' : ''}`}
        >
          {drawMode ? <PenLine className="size-3.5" /> : <MousePointer2 className="size-3.5" />}
          {drawMode ? 'حالت رسم فعال' : 'کشیدن خط روی عکس'}
        </Button>

        {drawMode && (
          <>
            <span className="h-5 w-px bg-border" />
            <Button
              size="sm"
              variant={tool === 'pen' ? 'secondary' : 'ghost'}
              onClick={() => setTool('pen')}
              className="h-8 rounded-full text-xs gap-1"
            >
              <PenLine className="size-3.5" /> قلم
            </Button>
            <Button
              size="sm"
              variant={tool === 'arrow' ? 'secondary' : 'ghost'}
              onClick={() => setTool('arrow')}
              className="h-8 rounded-full text-xs gap-1"
            >
              <Send className="size-3.5 rotate-45" /> فلش
            </Button>
            <span className="h-5 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`size-5 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-foreground' : 'border-transparent'}`}
                  style={{ background: c }}
                  aria-label={`رنگ ${c}`}
                />
              ))}
            </div>
            <span className="h-5 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStrokes((s) => s.slice(0, -1))}
              disabled={strokes.length === 0}
              className="h-8 rounded-full text-xs gap-1"
            >
              <Undo2 className="size-3.5" /> برگشت
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStrokes([])}
              disabled={strokes.length === 0}
              className="h-8 rounded-full text-xs gap-1 text-destructive"
            >
              <Trash2 className="size-3.5" /> پاک‌کردن
            </Button>
          </>
        )}

        {drawMode && hasStrokes && (
          <Button size="sm" onClick={attach} className="gold-btn h-8 rounded-full text-xs gap-1.5 ms-auto">
            <ImagePlus className="size-3.5" /> پیوست به پیام
          </Button>
        )}
      </div>

      {/* بوم */}
      <div className="relative flex-1 min-h-0 bg-black/5 flex items-center justify-center overflow-auto p-2">
        <div className="relative inline-block max-w-full">
          <img
            ref={imgRef}
            src={current}
            alt="عکس رویداد پروژه"
            className="max-h-[62dvh] max-w-full object-contain select-none"
            draggable={false}
            onLoad={redraw}
          />
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className={`absolute inset-0 size-full ${drawMode ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
          />
        </div>
      </div>

      {/* ناوبری عکس‌ها */}
      {data.images.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 border-t border-border shrink-0">
          {data.images.map((im, j) => (
            <button
              key={j}
              onClick={() => onSetIndex(j)}
              className={`size-10 rounded-xl overflow-hidden border transition-all ${j === data.index ? 'border-gold scale-110' : 'border-border opacity-60 hover:opacity-100'}`}
              aria-label={`تصویر ${j + 1}`}
            >
              <img src={im} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ================= فرم ثبت رویداد ================= */

function AddEventDialog({
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
  const [category, setCategory] = useState('execution')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isReport, setIsReport] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [attachFiles, setAttachFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const attachRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const tt = todayJalali()
      setJy(tt.jy); setJm(tt.jm); setJd(tt.jd)
      setCategory('execution'); setTitle(''); setDescription('')
      setIsReport(false); setFiles([]); setAttachFiles([])
    }
  }, [open])

  const maxDay = jm <= 6 ? 31 : jm <= 11 ? 30 : 30

  const submit = async () => {
    if (!title.trim()) {
      toast.error('عنوان رویداد را بنویسید')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      fd.append('category', category)
      fd.append('isReport', String(isReport))
      fd.append('jy', String(jy))
      fd.append('jm', String(jm))
      fd.append('jd', String(jd))
      files.forEach((f) => fd.append('images', f))
      attachFiles.forEach((f) => {
        fd.append('files', f)
        fd.append('fileNames', f.name)
      })
      const res = await fetch('/api/timeline', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('رویداد ثبت شد')
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت رویداد')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="bg-card border-border max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-gold" /> ثبت رویداد جدید
          </DialogTitle>
          <DialogDescription>
            رویداد در تایم‌لاین پروژه ثبت می‌شود؛ با فعال‌سازی «گزارش به مالک» برای مالک و ناظر نیز قابل مشاهده است.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
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
                  {Array.from({ length: 6 }, (_, i) => t.jy - 4 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{toFaDigits(y)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">دسته رویداد</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_CATEGORIES)
                  .filter(([k]) => ADDABLE_CATEGORIES.includes(k))
                  .map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">عنوان رویداد *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: بتن‌ریزی طبقه پنجم بلوک A" className="bg-background rounded-xl" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">توضیحات</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="شرح کامل رویداد — مثلاً علت تأخیر، حجم کار، تصمیمات گرفته‌شده..."
              rows={4}
              className="bg-background rounded-xl resize-none"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">عکس‌های رویداد</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl w-full border-dashed">
              <ImagePlus className="size-4 text-gold" />
              {files.length > 0 ? `${toFaDigits(files.length)} عکس انتخاب شد` : 'انتخاب عکس (اختیاری)'}
            </Button>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">پیوست فایل (نقشه، سند، PDF...)</Label>
            <input
              ref={attachRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setAttachFiles(Array.from(e.target.files || []))}
            />
            <Button type="button" variant="outline" onClick={() => attachRef.current?.click()} className="rounded-xl w-full border-dashed">
              <Paperclip className="size-4 text-gold" />
              {attachFiles.length > 0 ? `${toFaDigits(attachFiles.length)} فایل انتخاب شد` : 'انتخاب فایل (اختیاری)'}
            </Button>
            {attachFiles.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {attachFiles.map((f, i) => (
                  <span key={i} className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 bg-muted/40 rounded-lg px-2.5 py-1.5">
                    <Paperclip className="size-3 text-gold shrink-0" /> {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between glass rounded-xl p-3.5 border border-border">
            <div>
              <p className="text-xs font-bold flex items-center gap-1.5">
                <FileBadge className="size-4 text-gold" /> گزارش به مالک و ناظر
              </p>
              <p className="text-[0.68rem] text-muted-foreground mt-1 leading-5">
                در صورت فعال‌سازی، این رویداد در نمای مالک و ناظر نمایش داده می‌شود.
              </p>
            </div>
            <Switch checked={isReport} onCheckedChange={setIsReport} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full flex-1">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            ثبت رویداد
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            انصراف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
