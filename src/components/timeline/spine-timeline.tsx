'use client'

/* تایم‌لاین ستون‌فقرات — نسخهٔ پیوسته (بدون پرش)
 * • یک موتور rAF واحد: اسکرول نرم + مورف پیوستهٔ کارت↔دایره + هندسهٔ نخ‌ها
 * • هر مقدار بصری (اندازهٔ گره، باز شدن کارت، محو شدن متن‌ها) با «هموارسازی
 *   زمانی» به سمت مقدار هدف می‌لغزد — هیچ حالت گسسته و پرشی وجود ندارد.
 * • اسکرول چرخ ماوس با ضریب کندتر و تعقیب lerp انجام می‌شود (سینمایی).
 * • شروع/پایان هر مرحله با نخ نازک هم‌رنگ گروه کاری به هم وصل می‌شوند؛
 *   مرحلهٔ باز = نخ خط‌چین متحرک تا پایین («در جریان»).
 * • گره «+» بالای خط، ثبت چندثانیه‌ای رکورد جدید.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAppStore, type AuthUser } from '@/lib/store'
import { formatJalali, toFaDigits, formatToman } from '@/lib/jalali'
import { STAGE_GROUPS, stageGroupColor, stageLabelByKey, type StageGroupId } from '@/lib/stages'
import {
  POINT_CATEGORIES, CommentChip, CommentsDialog, AnnotateLightbox,
  RoleAvatar, type TimelineEvent, type Viewer,
} from './shared'
import { QuickAddDialog, type OpenStage } from './quick-add'
import {
  Plus, Loader2, Upload, Download, Paperclip, Wallet, CheckCircle2,
  Play, Eye, MessageCircle, FileBadge, Clock,
} from 'lucide-react'

/* هندسه ثابت ستون فقرات */
const SPINE_X = 22 // فاصله خط اصلی از لبه راست (px)
const NODE_Y = 34 // مرکز عمودی گره از بالای هر آیتم (px)
const ITEM_PS = 76 // padding-inline-start آیتم‌ها (جای گره و نخ‌ها)
const PLUS_SIZE = 46

/* ===== تنظیم اسکرول و مورف ===== */
const WHEEL_MULT = 0.5 // ضریب سرعت چرخ ماوس (کمتر = آهسته‌تر)
const SCROLL_LERP = 0.08 // نرمی تعقیب اسکرول
const MORPH_K = 0.15 // نرمی مورف کارت↔دایره (فریم‌محور)
const REDUCED =
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* شاخص‌های مورف — ترتیب ثابت است */
const M_ROWOP = 0, M_NODE = 1, M_CARD = 2, M_TEXT = 3, M_DATE = 4, M_ICON = 5, M_GLOW = 6, M_TFS = 7
const MORPH_LEN = 8
/* حالت اولیه = کاملاً جمع‌شده (نقطهٔ دور) — ورود صفحه نرم باز می‌شود */
const MORPH_INIT = [0.25, 9, 0, 0, 0, 0, 0, 12]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (x: number, a: number, b: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/* مقدارهای هدف بر اساس فاصلهٔ گره از مرکز دید (px)
 * باند باز شدن کارت عمداً پهن است (۱۱۰→۷۰۰) تا بهرهٔ حلقهٔ بازخوردِ
 * «باز شدن کارت ← جابه‌جایی همسایه‌ها ← فاصلهٔ دوباره» زیر ۱ بماند و
 * هیچ نوسان/پرشی رخ ندهد؛ نتیجه: گرادیان نرم کارت‌های نیمه‌باز دور کانون. */
function targetsOf(d: number): number[] {
  return [
    1 - 0.75 * smoothstep(d, 520, 1300), // شفافیت ردیف ۱ → ۰.۲۵
    46 - 37 * smoothstep(d, 80, 640), // اندازهٔ گره ۴۶ → ۹
    1 - smoothstep(d, 110, 700), // باز شدن کارت کانونی
    1 - smoothstep(d, 470, 940), // متن ردیف
    1 - smoothstep(d, 220, 500), // خط تاریخ/نویسنده
    1 - smoothstep(d, 190, 400), // آیکن گره (در برابر نقطه)
    1 - clamp01(d / 160), // هالهٔ کانونی
    15.5 - 3.5 * smoothstep(d, 90, 520), // اندازهٔ عنوان
  ]
}

function colorOf(e: TimelineEvent): string {
  if (e.stageGroup) {
    return STAGE_GROUPS[e.stageGroup as StageGroupId]?.color || stageGroupColor(e.stageGroup, e.category)
  }
  return stageGroupColor(null, e.category)
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a.toFixed(3)})`
}

type SubEls = {
  row: HTMLElement | null
  node: HTMLElement | null
  icon: HTMLElement | null
  dot: HTMLElement | null
  text: HTMLElement | null
  title: HTMLElement | null
  meta: HTMLElement | null
  trail: HTMLElement | null
  card: HTMLElement | null
}

/* نوشتن مقدارهای هموارشده روی DOM — بدون re-render ری‌اکت */
function applyMorph(e: TimelineEvent, sub: SubEls, a: number[]) {
  const rowOp = a[M_ROWOP], nodeSize = a[M_NODE], cardT = clamp01(a[M_CARD])
  const textOp = a[M_TEXT], dateOp = a[M_DATE], iconOp = a[M_ICON]
  const glow = a[M_GLOW], tfs = a[M_TFS]
  const color = colorOf(e)

  /* شفافیت کل ردیف — گرادیان نزدیک کانون ↔ دور از آن (مهم: بدون این، همه ردیف‌ها کم‌رنگ می‌مانند) */
  if (sub.row) sub.row.style.opacity = rowOp.toFixed(3)

  if (sub.node) {
    sub.node.style.width = `${nodeSize.toFixed(2)}px`
    sub.node.style.height = `${nodeSize.toFixed(2)}px`
    sub.node.style.boxShadow =
      glow > 0.04 ? `0 0 ${(5 + 15 * glow).toFixed(1)}px ${hexA(color, glow * 0.5)}` : 'none'
  }
  if (sub.icon) {
    const s = (nodeSize * 0.42).toFixed(2)
    sub.icon.style.width = `${s}px`
    sub.icon.style.height = `${s}px`
    sub.icon.style.opacity = iconOp.toFixed(3)
  }
  if (sub.dot) {
    const ds = Math.max(3, nodeSize * 0.34).toFixed(2)
    sub.dot.style.width = `${ds}px`
    sub.dot.style.height = `${ds}px`
    sub.dot.style.opacity = (1 - iconOp).toFixed(3)
  }
  if (sub.title) {
    sub.title.style.fontSize = `${tfs.toFixed(2)}px`
    sub.title.classList.toggle('text-gold', glow > 0.5)
  }
  if (sub.text) {
    sub.text.style.opacity = textOp.toFixed(3)
    sub.text.style.visibility = textOp < 0.04 ? 'hidden' : 'visible'
  }
  if (sub.meta) {
    sub.meta.style.opacity = dateOp.toFixed(3)
    sub.meta.style.visibility = dateOp < 0.04 ? 'hidden' : 'visible'
  }
  if (sub.trail) {
    sub.trail.style.opacity = dateOp.toFixed(3)
    sub.trail.style.pointerEvents = dateOp > 0.5 ? 'auto' : 'none'
  }
  if (sub.card) {
    sub.card.style.gridTemplateRows = `${cardT.toFixed(4)}fr`
    sub.card.style.opacity = cardT.toFixed(3)
    sub.card.style.visibility = cardT < 0.02 ? 'hidden' : 'visible'
    sub.card.style.pointerEvents = cardT > 0.5 ? 'auto' : 'none'
  }
}

type ThreadInfo = {
  key: string
  color: string
  active: boolean
  startId: string
  endId: string | null
  x: number
}

export function SpineTimeline({ projectId, closed }: { projectId: string; closed?: boolean }) {
  const user = useAppStore((s) => s.user) as AuthUser | null
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogEventId, setDialogEventId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ eventId: string; images: string[]; index: number } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)
  const itemEls = useRef<Map<string, HTMLElement>>(new Map())
  const subEls = useRef<Map<string, SubEls>>(new Map())
  const morphVals = useRef<Map<string, number[]>>(new Map())
  const threadRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const rafRef = useRef<number | null>(null)
  const dirtyRef = useRef(true)
  const lastScrollYRef = useRef(-1)
  const movingRef = useRef(false)
  const saRef = useRef({ target: 0, current: 0, animating: false, aimId: null as string | null, aimT: 0 })
  const firstScrollRef = useRef(false)
  const glideToNewestRef = useRef(false)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const uploadTarget = useRef<string | null>(null)

  /* دادهٔ تازه برای موتور (بدون churn افکت‌ها) */
  const eventsRef = useRef<TimelineEvent[]>([])
  eventsRef.current = events

  /* ============ داده ============ */

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

  /* ============ مراحل و نخ‌ها ============ */

  const { threads, openStages, stageStartOf } = useMemo(() => {
    const starts = new Map<string, TimelineEvent>()
    const ends = new Map<string, TimelineEvent>()
    for (const e of events) {
      if (!e.stageKey) continue
      if (e.kind === 'stage_start' && !starts.has(e.stageKey)) starts.set(e.stageKey, e)
      if (e.kind === 'stage_end' && !ends.has(e.stageKey)) ends.set(e.stageKey, e)
    }
    // ترتیب نمایش نخ‌ها: از قدیم به جدید (پایین به بالا)
    const keys: string[] = []
    for (const e of [...events].reverse()) {
      if (e.stageKey && e.kind === 'stage_start' && !keys.includes(e.stageKey)) keys.push(e.stageKey)
    }
    const th: ThreadInfo[] = keys.map((key, idx) => {
      const s = starts.get(key)!
      const en = ends.get(key) || null
      const group = (s.stageGroup || 'structure') as StageGroupId
      return {
        key,
        color: STAGE_GROUPS[group]?.color || '#f59e0b',
        active: !en,
        startId: s.id,
        endId: en?.id || null,
        x: SPINE_X + 5 + (idx % 3) * 7,
      }
    })
    const open: OpenStage[] = []
    for (const key of keys) {
      if (!ends.has(key)) {
        const s = starts.get(key)!
        open.push({
          stageKey: key,
          label: stageLabelByKey(key) || key,
          group: (s.stageGroup || 'structure') as StageGroupId,
          startedAt: s.date,
        })
      }
    }
    const startMap = new Map<string, TimelineEvent>()
    for (const e of events) {
      if (e.kind === 'stage_end' && e.stageKey && starts.has(e.stageKey)) startMap.set(e.id, starts.get(e.stageKey)!)
    }
    return { threads: th, openStages: open, stageStartOf: startMap }
  }, [events])

  const threadsRef = useRef<ThreadInfo[]>([])
  threadsRef.current = threads

  /* ============ موتور رندر — یک حلقه rAF دائمی (ضربان) با مسیر سریع ============ */

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick) // ضربان دائمی
    const list = listRef.current
    const evs = eventsRef.current
    const sa = saRef.current
    const sy = window.scrollY
    // مسیر سریع: وقتی چیزی تغییر نکرده، بدنه اجرا نمی‌شود (هزینهٔ ~صفر)
    if (!dirtyRef.current && !sa.animating && !sa.aimId && !movingRef.current && sy === lastScrollYRef.current) return
    lastScrollYRef.current = sy
    dirtyRef.current = false
    if (!list || evs.length === 0) {
      movingRef.current = false
      return
    }
    const vh = window.innerHeight
    const centerDoc = sy + vh / 2
    const listTopDoc = list.getBoundingClientRect().top + sy
    const k = REDUCED ? 1 : MORPH_K

    /* --- گذر ۱: خواندن هندسه (روی یک reflow) --- */
    const tops = new Map<string, number>()
    for (const e of evs) {
      const el = itemEls.current.get(e.id)
      if (el) tops.set(e.id, el.offsetTop)
    }
    const dOf = (id: string) => {
      const t = tops.get(id)
      return t === undefined ? null : Math.abs(listTopDoc + t + NODE_Y - centerDoc)
    }

    /* --- محاسبهٔ مقدارهای هموار --- */
    type Job = { e: TimelineEvent; sub: SubEls; a: number[] }
    const jobs: Job[] = []
    let active = false
    for (const e of evs) {
      const sub = subEls.current.get(e.id)
      const d = dOf(e.id)
      if (!sub || d === null) continue
      const t = targetsOf(d)
      let a = morphVals.current.get(e.id)
      if (!a) {
        a = MORPH_INIT.slice()
        morphVals.current.set(e.id, a)
      }
      for (let i = 0; i < MORPH_LEN; i++) {
        const nv = a[i] + (t[i] - a[i]) * k
        if (Math.abs(nv - a[i]) > 0.0008) active = true
        a[i] = nv
      }
      jobs.push({ e, sub, a })
    }

    /* هندسهٔ نخ‌ها از روی همان خواندن‌ها */
    const threadJobs: { el: HTMLDivElement; top: number; height: number | null }[] = []
    for (const th of threadsRef.current) {
      const el = threadRefs.current.get(th.key)
      if (!el) continue
      const y1 = tops.has(th.startId) ? tops.get(th.startId)! + NODE_Y : null
      const y2 = th.endId && tops.has(th.endId) ? tops.get(th.endId)! + NODE_Y : null
      if (y1 === null) {
        threadJobs.push({ el, top: -1, height: null })
        continue
      }
      if (y2 !== null) {
        threadJobs.push({ el, top: Math.max(0, y1 - 4), height: Math.max(12, y2 - y1 + 8) })
      } else {
        threadJobs.push({ el, top: Math.max(0, y1 - 4), height: null })
      }
    }

    /* --- گذر ۲: نوشتن استایل‌ها --- */
    for (const j of jobs) applyMorph(j.e, j.sub, j.a)
    for (const tj of threadJobs) {
      if (tj.top < 0) {
        tj.el.style.display = 'none'
        continue
      }
      tj.el.style.display = 'block'
      tj.el.style.top = `${tj.top.toFixed(1)}px`
      if (tj.height !== null) {
        tj.el.style.height = `${tj.height.toFixed(1)}px`
        tj.el.style.bottom = 'auto'
      } else {
        // مرحله باز — تا انتهای لیست
        tj.el.style.height = 'auto'
        tj.el.style.bottom = '-6px'
      }
    }

    /* --- نشانه‌گیری زنده (کلیک روی ردیف): هدف هر فریم هندسهٔ لحظه‌ای را دنبال می‌کند --- */
    if (sa.aimId) {
      const el = itemEls.current.get(sa.aimId)
      if (el && list) {
        const y = list.getBoundingClientRect().top + window.scrollY + el.offsetTop + NODE_Y - vh / 2
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
        sa.target = Math.min(Math.max(0, y), max)
        if (performance.now() - sa.aimT > 4000) sa.aimId = null
      } else {
        sa.aimId = null
      }
    }

    /* --- اسکرول تعقیبی --- */
    if (sa.animating || sa.aimId) {
      sa.current += (sa.target - sa.current) * (REDUCED ? 1 : SCROLL_LERP)
      if (Math.abs(sa.target - sa.current) < 0.6 && !sa.aimId) {
        sa.current = sa.target
        sa.animating = false
      } else {
        active = true
      }
      window.scrollTo(0, sa.current)
      lastScrollYRef.current = window.scrollY
    }

    /* پایان تعقیب: هدف پایدار + مورف‌های نشانی‌شده → رها */
    if (sa.aimId && !active && Math.abs(sa.target - sa.current) < 2) {
      sa.aimId = null
      sa.animating = false
      sa.current = sa.target
    }

    movingRef.current = active
  }, [])

  const kick = useCallback(() => {
    dirtyRef.current = true
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  /* اسکرول نرم و آهستهٔ چرخ ماوس + همگام‌سازی اسکرول بومی */
  useEffect(() => {
    if (loading) return
    const overlayOpen = () => !!dialogEventId || !!lightbox || addOpen
    const inOverlay = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      !!t.closest('[role="dialog"],[role="menu"],[data-radix-popper-content-wrapper],[role="tooltip"]')

    const onWheel = (ev: WheelEvent) => {
      if (REDUCED || overlayOpen() || inOverlay(ev.target)) return
      ev.preventDefault()
      const mult = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 100 : 1
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const sa = saRef.current
      sa.aimId = null // کاربر کنترل را به دست می‌گیرد
      sa.target = Math.min(Math.max(0, sa.target + ev.deltaY * mult * WHEEL_MULT), max)
      if (!sa.animating) {
        sa.animating = true
        sa.current = window.scrollY
      }
      kick()
    }
    const onScroll = () => {
      const sa = saRef.current
      if (!sa.animating) {
        sa.target = window.scrollY
        sa.current = window.scrollY
      }
      kick()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    kick()
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [loading, dialogEventId, lightbox, addOpen, kick])

  /* اولین ورود: پرش لحظه‌ای به جدیدترین رویداد + باز شدن نرم مورف‌ها */
  useEffect(() => {
    if (loading || events.length === 0) return
    const firstEl = itemEls.current.get(events[0].id)
    const list = listRef.current
    if (!firstEl || !list) return
    const y =
      list.getBoundingClientRect().top + window.scrollY + firstEl.offsetTop + NODE_Y - window.innerHeight / 2
    const glide = glideToNewestRef.current
    glideToNewestRef.current = false

    if (!firstScrollRef.current) {
      firstScrollRef.current = true
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const yc = Math.max(0, Math.min(y, max))
      window.scrollTo(0, yc)
      const sa = saRef.current
      sa.target = yc
      sa.current = yc
      sa.animating = false
      morphVals.current.clear() // ورود از حالت جمع‌شده — باز شدن نرم
      kick()
      return
    }
    if (glide) {
      // گلاید به جدیدترین رویداد — تعقیب زنده هندسه
      const sa = saRef.current
      sa.aimId = events[0].id
      sa.aimT = performance.now()
      sa.current = window.scrollY
      sa.animating = true
      kick()
    } else kick()
  }, [loading, events, kick])

  /* تغییر اندازهٔ لیست (فونت/عکس) → باز-اندازه‌گیری نخ‌ها */
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const ro = new ResizeObserver(() => kick())
    ro.observe(list)
    return () => ro.disconnect()
  }, [kick, loading, events])

  /* ============ عکس پیشنهادی ============ */

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

  /* ============ رندر ============ */

  if (loading && events.length === 0) {
    return (
      <div className="py-10 space-y-16" aria-busy>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 pe-6">
            <div className="size-11 rounded-full animate-pulse bg-muted/50 shrink-0" />
            <div className="h-4 rounded-full animate-pulse bg-muted/30" style={{ width: `${70 - i * 12}%` }} />
          </div>
        ))}
      </div>
    )
  }

  if (error && events.length === 0) {
    return (
      <div className="card-lux p-8 text-center text-muted-foreground text-sm">
        {error}
        <Button onClick={load} variant="outline" className="mt-4 block mx-auto rounded-full">
          تلاش مجدد
        </Button>
      </div>
    )
  }

  const dialogEvent = events.find((e) => e.id === dialogEventId) || null

  const stageDuration = (e: TimelineEvent): string | null => {
    const start = stageStartOf.get(e.id)
    if (!start) return null
    const days = Math.max(
      1,
      Math.round((new Date(e.date).getTime() - new Date(start.date).getTime()) / 86400000)
    )
    return `${toFaDigits(days)} روز`
  }

  /* اتصال refهای زیرمجموعه هر آیتم */
  const bindItem = (id: string) => (el: HTMLElement | null) => {
    if (el) {
      itemEls.current.set(id, el)
      subEls.current.set(id, {
        row: el,
        node: el.querySelector<HTMLElement>('[data-node]'),
        icon: el.querySelector<HTMLElement>('[data-node-icon]'),
        dot: el.querySelector<HTMLElement>('[data-node-dot]'),
        text: el.querySelector<HTMLElement>('[data-text]'),
        title: el.querySelector<HTMLElement>('[data-title]'),
        meta: el.querySelector<HTMLElement>('[data-meta]'),
        trail: el.querySelector<HTMLElement>('[data-trail]'),
        card: el.querySelector<HTMLElement>('[data-card]'),
      })
    } else {
      itemEls.current.delete(id)
      subEls.current.delete(id)
    }
  }

  const scrollToCenter = (id: string) => {
    const sa = saRef.current
    sa.aimId = id
    sa.aimT = performance.now()
    sa.current = window.scrollY
    sa.animating = true
    kick()
  }

  return (
    <div className="relative">
      {viewer?.reportOnly && (
        <div className="glass border border-gold/30 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
          <Eye className="size-4.5 text-gold shrink-0" />
          <p className="text-[0.68rem] leading-5 text-muted-foreground">
            شما <span className="text-gold font-bold">گزارش‌های رسمی پروژه</span> را می‌بینید — جزئیات داخلی اجرا محرمانه تیم است.
          </p>
        </div>
      )}

      {events.length === 0 && !viewer?.canManage && (
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

      <div ref={listRef} className="relative">
        {/* ستون فقرات */}
        <div
          className="absolute top-0 bottom-0 w-[2px] rounded-full z-0"
          style={{
            right: SPINE_X,
            background:
              'linear-gradient(to bottom, transparent, var(--border) 40px, var(--border) calc(100% - 60px), transparent)',
          }}
          aria-hidden
        />

        {/* نخ‌های مراحل */}
        {threads.map((th) => (
          <div
            key={th.key}
            ref={(el) => {
              if (el) threadRefs.current.set(th.key, el)
              else threadRefs.current.delete(th.key)
            }}
            className={`absolute z-0 w-[2px] ${th.active ? 'thread-flow' : ''}`}
            style={{ right: th.x, top: 0, height: 0, ...(th.active ? { ['--tc' as string]: th.color } : { background: th.color }) }}
            aria-hidden
          />
        ))}

        {/* گره «+» — ثبت رکورد جدید */}
        {viewer?.canManage && (
          <div className="relative h-[84px] z-10">
            <button
              onClick={() => setAddOpen(true)}
              className="absolute grid place-items-center rounded-full border-2 border-dashed border-gold/70 bg-background text-gold transition-all hover:scale-110 hover:border-gold hover:shadow-lg hover:shadow-gold/20"
              style={{
                right: SPINE_X,
                top: NODE_Y,
                transform: 'translate(50%, -50%)',
                width: PLUS_SIZE,
                height: PLUS_SIZE,
              }}
              title="ثبت رکورد جدید"
              aria-label="ثبت رکورد جدید"
            >
              <Plus className="size-5" />
            </button>
            <div className="absolute inset-y-0 flex items-center" style={{ insetInlineStart: ITEM_PS }}>
              <span className="text-[0.7rem] text-muted-foreground">ثبت رکورد جدید</span>
            </div>
          </div>
        )}

        {/* خلاصه پروژه بسته */}
        {closed && (
          <div className="relative z-10 pb-4" style={{ paddingInlineStart: ITEM_PS }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                پروژه کامل و تحویل شد — تایم‌لاین بسته است
              </span>
              <span className="text-[0.65rem] text-muted-foreground">
                {toFaDigits(events.length)} رکورد
              </span>
            </div>
          </div>
        )}

        {/* آیتم‌ها — همه کارت‌ها همیشه در DOM؛ مورف پیوسته مدیریت می‌کند */}
        {events.map((e) => {
          const color = colorOf(e)
          const catMeta = POINT_CATEGORIES[e.category] || POINT_CATEGORIES.execution
          const isOpenStage = e.kind === 'stage_start' && threads.find((t) => t.startId === e.id)?.active
          const duration = e.kind === 'stage_end' ? stageDuration(e) : null
          const startEvt = e.kind === 'stage_end' ? stageStartOf.get(e.id) : null
          const hasPhoto = e.images.length > 0
          const NodeIcon =
            e.kind === 'stage_start' ? Play : e.kind === 'stage_end' ? CheckCircle2 : catMeta.icon

          return (
            <article
              key={e.id}
              ref={bindItem(e.id)}
              className="relative z-10"
              style={{ opacity: MORPH_INIT[M_ROWOP] }}
              data-event-id={e.id}
            >
              {/* ردیف گره — همیشه هم‌ارتفاع؛ عنوان/تاریخ/چیپ */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => scrollToCenter(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    scrollToCenter(e.id)
                  }
                }}
                className="w-full text-start flex items-center gap-2.5 min-h-[68px] py-1.5 group cursor-pointer"
                style={{ paddingInlineStart: ITEM_PS }}
                title={e.title}
                aria-label={`${e.title} — ${formatJalali(new Date(e.date), { short: true })}`}
              >
                {/* گره — مرکز ثابت؛ اندازه با مورف */}
                <span
                  data-node
                  className={`absolute rounded-full flex items-center justify-center bg-background border-2 z-10 ${
                    isOpenStage ? 'node-pulse' : ''
                  }`}
                  style={{
                    right: SPINE_X,
                    top: NODE_Y,
                    transform: 'translate(50%, -50%)',
                    width: 9,
                    height: 9,
                    borderColor: color,
                  }}
                  aria-hidden
                >
                  {hasPhoto ? (
                    <img
                      src={e.images[0]}
                      alt=""
                      className="size-full rounded-full object-cover"
                      onLoad={kick}
                    />
                  ) : (
                    <>
                      <span
                        data-node-icon
                        className="grid place-items-center"
                        style={{ width: 4, height: 4, opacity: 0 }}
                      >
                        <NodeIcon className="size-full" style={{ color }} />
                      </span>
                      <span
                        data-node-dot
                        className="absolute rounded-full"
                        style={{
                          background: color,
                          width: 3,
                          height: 3,
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    </>
                  )}
                </span>

                {/* متن ردیف */}
                <span data-text className="flex-1 min-w-0" style={{ opacity: 0, visibility: 'hidden' }}>
                  <span className="flex items-center gap-2 flex-wrap">
                    <span data-title className="font-bold leading-6" style={{ fontSize: 12 }}>
                      {e.title}
                    </span>
                    {isOpenStage && (
                      <span className="inline-flex items-center gap-1 text-[0.58rem] font-bold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/40">
                        <Clock className="size-2.5" />
                        در جریان
                      </span>
                    )}
                    {duration && (
                      <span className="text-[0.58rem] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                        {duration}
                      </span>
                    )}
                  </span>
                  <span
                    data-meta
                    className="block text-[0.62rem] text-muted-foreground mt-0.5 tabular-nums"
                    style={{ opacity: 0, visibility: 'hidden' }}
                  >
                    {formatJalali(new Date(e.date))}
                    {startEvt ? ' — شروع: ' + formatJalali(new Date(startEvt.date), { short: true }) : ''}
                    {e.authorName ? ` — ${e.authorName}` : ''}
                  </span>
                </span>

                {/* چیپ فشرده + مبلغ برای ردیف نزدیک */}
                <span
                  data-trail
                  className="shrink-0 flex items-center gap-2"
                  style={{ opacity: 0, pointerEvents: 'none' }}
                >
                  {viewer?.seesComments && e.comments.length > 0 && (
                    <span
                      onClick={(ev) => {
                        ev.stopPropagation()
                        setDialogEventId(e.id)
                      }}
                    >
                      <CommentChip comments={e.comments} onOpen={() => setDialogEventId(e.id)} compact />
                    </span>
                  )}
                  {e.paymentAmount && (
                    <span className="inline-flex items-center gap-1 text-[0.62rem] font-extrabold text-emerald-600 dark:text-emerald-400">
                      <Wallet className="size-3" />
                      {formatToman(e.paymentAmount)}
                    </span>
                  )}
                </span>
              </div>

              {/* بدنه کارت — با grid-template-rows پیوسته باز/بسته می‌شود */}
              <div
                data-card
                className="grid"
                style={{ gridTemplateRows: '0fr', opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="pb-10" style={{ paddingInlineStart: ITEM_PS }}>
                    <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-4 shadow-sm">
                      {/* شرح */}
                      {e.description && (
                        <p className="text-muted-foreground text-[0.78rem] leading-7 whitespace-pre-line">
                          {e.description}
                        </p>
                      )}

                      {/* مبلغ پرداخت */}
                      {e.paymentAmount && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5">
                          <Wallet className="size-4 text-emerald-500" />
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatToman(e.paymentAmount)} تومان
                          </span>
                        </div>
                      )}

                      {/* فایل‌ها */}
                      {e.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {e.files.map((f, j) => (
                            <a
                              key={j}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 glass border border-border rounded-full px-3 py-1.5 text-[0.66rem] text-muted-foreground hover:text-gold hover:border-gold/50 transition-colors"
                            >
                              <Paperclip className="size-3 text-gold" />
                              {f.name}
                              <Download className="size-3" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* عکس‌ها */}
                      {e.images.length > 0 && (
                        <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar pb-1">
                          {e.images.map((img, j) => (
                            <motion.button
                              key={j}
                              onClick={() => setLightbox({ eventId: e.id, images: e.images, index: j })}
                              whileHover={{ y: -5, scale: 1.05 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              className="shrink-0 size-[84px] rounded-2xl overflow-hidden border border-border/80 shadow-md"
                              aria-label={`عکس ${j + 1} رویداد`}
                            >
                              <img
                                src={img}
                                alt={`عکس رویداد ${j + 1}`}
                                className="size-full object-cover"
                                loading="lazy"
                                onLoad={kick}
                              />
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* نوار پایین کارت */}
                      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/50">
                        {viewer?.seesComments && (
                          <CommentChip comments={e.comments} onOpen={() => setDialogEventId(e.id)} />
                        )}
                        {e.isReport && (
                          <span className="inline-flex items-center gap-1 text-[0.58rem] text-gold bg-gold/5 border border-gold/30 rounded-full px-2 py-1">
                            <FileBadge className="size-2.5" /> گزارش رسمی
                          </span>
                        )}
                        <span className="ms-auto inline-flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
                          {e.authorName}
                        </span>
                        {viewer && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={uploading === e.id}
                            onClick={() => {
                              uploadTarget.current = e.id
                              photoInputRef.current?.click()
                            }}
                            className="size-7 rounded-full text-muted-foreground hover:text-gold"
                            title="افزودن عکس به گالری رویداد (با تأیید مدیر)"
                            aria-label="افزودن عکس به گالری رویداد"
                          >
                            {uploading === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        {/* گره شروع پروژه — پایین خط */}
        {events.length > 0 && (
          <div className="relative h-[64px] z-10">
            <span
              className="absolute rounded-full border-2 border-border bg-background grid place-items-center"
              style={{
                right: SPINE_X,
                top: NODE_Y,
                transform: 'translate(50%, -50%)',
                width: 14,
                height: 14,
              }}
              aria-hidden
            >
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
            </span>
            <span
              className="absolute text-[0.62rem] text-muted-foreground/70"
              style={{ insetInlineStart: ITEM_PS, top: NODE_Y - 9 }}
            >
              شروع پروژه
            </span>
          </div>
        )}
      </div>

      {/* ثبت سریع */}
      {viewer?.canManage && (
        <QuickAddDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          projectId={projectId}
          openStages={openStages}
          onDone={() => {
            glideToNewestRef.current = true
            load()
          }}
        />
      )}

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
            setDialogEventId(lightbox.eventId)
          }
          setLightbox(null)
        }}
      />
    </div>
  )
}

/* برای استفاده در ابزار توسعه — آواتار نقش صادر می‌شود */
export { RoleAvatar, MessageCircle }
