'use client'

/* اجزای مشترک تایم‌لاین: چیپ گفتگو، پاپ‌آپ گفتگو، لایت‌باکس مشروح‌سازی */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { AuthUser } from '@/lib/store'
import { formatJalali, toFaDigits } from '@/lib/jalali'
import {
  Hammer, Eye, Send, Loader2, FileBadge, PenLine, MousePointer2, Trash2,
  Undo2, ImagePlus, MessageCircle, Wallet, Bookmark, Shield, Ruler,
  HardHat, Crown, Truck, CheckCircle2, Clock, ArrowLeft,
} from 'lucide-react'

/* ================= انواع ================= */

export type EventComment = {
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

export type EventFile = { name: string; url: string }

export type TimelineEvent = {
  id: string
  date: string
  category: string
  kind: string
  stageKey: string | null
  stageGroup: string | null
  title: string
  description: string
  isReport: boolean
  images: string[]
  files: EventFile[]
  authorName: string | null
  comments: EventComment[]
  paymentAmount: string | null
}

export type Viewer = {
  role: string
  roleLabel: string
  seesComments: boolean
  canComment: boolean
  reportOnly: boolean
  canManage: boolean
}

export const POINT_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  execution: { label: 'اجرا', icon: Hammer, color: '#10b981' },
  supply: { label: 'تأمین', icon: Bookmark, color: '#14b8a6' },
  delay: { label: 'تأخیر', icon: Clock, color: '#ef4444' },
  visit: { label: 'بازدید ناظر', icon: Eye, color: '#f59e0b' },
  decision: { label: 'تصمیم / مجوز', icon: FileBadge, color: '#64748b' },
  report: { label: 'گزارش دوره‌ای', icon: FileBadge, color: '#d4a531' },
  payment: { label: 'پرداخت', icon: Wallet, color: '#22c55e' },
  reference: { label: 'رفرنس', icon: Bookmark, color: '#38bdf8' },
}

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

export function RoleAvatar({ role, size = 'md' }: { role: string; size?: 'sm' | 'md' }) {
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

/* ================= چیپ گفتگو روی رویداد ================= */

export function CommentChip({
  comments,
  onOpen,
  compact = false,
}: {
  comments: EventComment[]
  onOpen: () => void
  compact?: boolean
}) {
  const roles: string[] = []
  for (const c of comments) {
    if (!roles.includes(c.authorRole)) roles.push(c.authorRole)
  }
  const pendingFollowUp = comments.some((c) => c.needsFollowUp && !c.resolvedAt)
  const shown = roles.slice(0, 3)

  if (comments.length === 0) {
    if (compact) return null
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
      </span>
      <span className="text-[0.68rem] font-bold tabular-nums">{toFaDigits(comments.length)}</span>
      {pendingFollowUp && <Clock className="size-3 animate-pulse" />}
    </button>
  )
}

/* ================= پاپ‌آپ گفتگوی رویداد ================= */

export function CommentsDialog({
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAnnotate}
                  className="h-7 rounded-full text-[0.65rem] gap-1 px-2.5"
                >
                  <PenLine className="size-3" /> خط روی عکس
                </Button>
                <Button size="icon" variant="ghost" onClick={onClearImage} className="size-7 shrink-0" aria-label="حذف عکس">
                  <Trash2 className="size-3.5" />
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
                variant="ghost"
                onClick={() => photoInputRef.current?.click()}
                className="rounded-xl size-9 shrink-0 self-end text-muted-foreground hover:text-gold"
                aria-label="افزودن عکس"
              >
                <ImagePlus className="size-4" />
              </Button>
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
                پیگیری
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border/60 px-4 py-3 shrink-0 bg-muted/10">
            <p className="text-[0.65rem] text-muted-foreground text-center leading-5">
              مشاهده پیام‌ها — برای پاسخ‌دادن با مدیریت پروژه هماهنگ کنید
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ================= لایت‌باکس با قابلیت رسم ================= */

type Stroke = { tool: 'pen' | 'arrow'; color: string; width: number; pts: { x: number; y: number }[] }

const PEN_COLORS = ['#ff8a3d', '#ef4444', '#ffffff', '#d4a531', '#38bdf8']

export function AnnotateLightbox({
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
          <Annotator key={`${data.eventId}-${data.index}`} data={data} onSetIndex={onSetIndex} onAttach={onAttach} />
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
      // در برخی مرورگرها/رویدادهای مصنوعی در دسترس نیست
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
