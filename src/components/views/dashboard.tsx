'use client'

/* «پنل من» — داشبورد شخصی هر کاربر، متفاوت بر اساس نقش
 * • داشبورد فقط «پروژه‌های در حال اجرا» را نشان می‌دهد:
 *   مدیر سیستم و مجری همه پروژه‌های فعال را می‌بینند؛
 *   مالک/ناظر/پیمانکار فقط پروژه تخصیص‌یافته خودشان را.
 * • پروژه تمام‌شده با «آرشیو» از داشبورد حذف می‌شود و سابقه‌اش ZIP می‌شود.
 * • فید به‌روزرسایی‌ها: آخرین رویدادها و پیام‌های قابل‌مشاهده در پروژه‌های فعال
 */

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ReferencesPanel } from '@/components/dashboard/references-panel'
import { PaymentsPanel } from '@/components/dashboard/payments-panel'
import { DocumentsPanel } from '@/components/dashboard/documents'
import { WorkersPanel } from '@/components/dashboard/workers'
import { ContractPanel } from '@/components/dashboard/contract-panel'
import { ContactsPanel } from '@/components/dashboard/contacts-panel'
import { AdminPanel } from '@/components/dashboard/admin-panel'
import { AddProjectDialog } from '@/components/dashboard/add-project'
import { ROLE_META, RoleAvatar } from '@/components/timeline/shared'
import { formatJalali, toFaDigits, formatToman } from '@/lib/jalali'
import { toast } from 'sonner'
import {
  UserRound, GitBranch, Bookmark, Wallet, FileText, Users, HardHat, Contact,
  Settings2, ArrowLeft, Clock, MessageCircle, Loader2, ChevronLeft, Building2,
  Archive, Download, Plus, ArchiveRestore, AlertTriangle,
} from 'lucide-react'

type DashProject = { id: string; slug: string; title: string; category: string; status: string | null; progress: number }

type ArchiveItem = {
  id: string
  projectTitle: string
  slug: string
  sizeBytes: number
  eventCount: number
  summary: { events?: number; comments?: number; photos?: number; payments?: number }
  createdByName: string | null
  createdAt: string
}

type UpdateItem = {
  type: 'comment' | 'event'
  id: string
  at: string
  projectTitle: string
  projectSlug: string
  eventId: string
  eventTitle: string
  authorName: string
  authorRole: string
  authorRoleLabel: string
  snippet: string
  amount?: string | null
  needsFollowUp?: boolean
  resolvedAt?: string | null
  kind?: string
}

/* ابزارها بر اساس نقش */
type ToolId = 'references' | 'payments' | 'documents' | 'workers' | 'contract' | 'contacts' | 'admin'

const TOOL_DEFS: Record<ToolId, {
  label: string
  desc: string
  icon: React.ElementType
  perProject: boolean
  roles: string[]
  readOnlyRoles?: string[]
}> = {
  references: {
    label: 'رفرنس‌های من',
    desc: 'عکس‌ها و نقشه‌های رفرنس + بازنگری نسخه‌ها',
    icon: Bookmark,
    perProject: true,
    roles: ['owner', 'admin', 'executor'],
  },
  payments: {
    label: 'پرداخت‌ها و رسیدها',
    desc: 'ثبت رسید و پیگیری تراز مالی پروژه',
    icon: Wallet,
    perProject: true,
    roles: ['owner', 'admin', 'executor'],
  },
  documents: {
    label: 'مدارک و نقشه‌ها',
    desc: 'مجوزها، قراردادها و نقشه‌ها + دانلود',
    icon: FileText,
    perProject: true,
    roles: ['admin', 'executor', 'engineer', 'foreman', 'owner', 'supervisor'],
    readOnlyRoles: ['owner', 'supervisor'],
  },
  workers: {
    label: 'کارگران پروژه',
    desc: 'لیست ساده نیروهای فعال هر پروژه',
    icon: Users,
    perProject: true,
    roles: ['admin', 'executor', 'engineer', 'foreman'],
  },
  contract: {
    label: 'وضعیت پیمانکاری',
    desc: 'شروع/پایان، وضعیت حساب و جمع پرداختی',
    icon: HardHat,
    perProject: true,
    roles: ['admin', 'executor'],
  },
  contacts: {
    label: 'دفترچه تماس',
    desc: 'شماره‌های کارگر/پیمانکار/تأمین‌کننده — روز مبادا',
    icon: Contact,
    perProject: false,
    roles: ['admin', 'executor'],
  },
  admin: {
    label: 'مدیریت سیستم',
    desc: 'پروژه و کاربر جدید، اخبار، وبلاگ و تأییدها',
    icon: Settings2,
    perProject: true,
    roles: ['admin'],
  },
}

const fmtSize = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export function DashboardView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const [projects, setProjects] = useState<DashProject[]>([])
  const [updates, setUpdates] = useState<UpdateItem[]>([])
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [toolProjectId, setToolProjectId] = useState('')
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [archiving, setArchiving] = useState<DashProject | null>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)

  const loadProjects = useCallback(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/updates').then((r) => (r.ok ? r.json() : { updates: [] })),
    ])
      .then(([pd, ud]) => {
        const all: DashProject[] = pd.projects || []
        const accessible: string[] = pd.accessible || []
        /* داشبورد فقط پروژه‌های فعال — پروژه‌های تمام‌شده و آینده اینجا نیستند */
        const mine = all.filter((p) => accessible.includes(p.slug) && p.category === 'in-progress')
        setProjects(mine)
        if (mine.length > 0) setToolProjectId((prev) => (mine.some((p) => p.id === prev) ? prev : mine[0].id))
        setUpdates(ud.updates || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadArchives = useCallback(() => {
    fetch('/api/archives')
      .then((r) => (r.ok ? r.json() : { archives: [] }))
      .then((d) => setArchives(d.archives || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadProjects()
    loadArchives()
  }, [loadProjects, loadArchives])

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 pt-28 pb-16 flex-1 space-y-4">
        <div className="h-8 w-40 rounded-full animate-pulse bg-muted/40" />
        <div className="h-40 card-lux animate-pulse bg-muted/30" />
        <div className="h-64 card-lux animate-pulse bg-muted/20" />
      </div>
    )
  }

  const role = user?.role || ''
  const isAdmin = role === 'admin'
  const myTools = (Object.keys(TOOL_DEFS) as ToolId[]).filter((t) => TOOL_DEFS[t].roles.includes(role))
  const activeDef = activeTool ? TOOL_DEFS[activeTool] : null

  const openTool = (id: ToolId) => {
    const first = projects[0]
    if (first) setToolProjectId(first.id)
    setActiveTool(id)
  }

  const doArchive = async () => {
    if (!archiving) return
    setArchiveBusy(true)
    try {
      const res = await fetch(`/api/projects/${archiving.slug}/archive`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toastArchiveOk(d)
      setProjects((p) => p.filter((x) => x.id !== archiving.id))
      loadArchives()
      loadProjects()
    } catch (e) {
      toastArchiveErr(e)
    } finally {
      setArchiveBusy(false)
      setArchiving(null)
    }
  }

  const renderToolPanel = () => {
    if (!activeTool) return null
    const readOnly = TOOL_DEFS[activeTool].readOnlyRoles?.includes(role)
    switch (activeTool) {
      case 'references':
        return <ReferencesPanel projectId={toolProjectId} />
      case 'payments':
        return <PaymentsPanel projectId={toolProjectId} />
      case 'documents':
        return <DocumentsPanel projectId={toolProjectId} readOnly={readOnly} />
      case 'workers':
        return <WorkersPanel projectId={toolProjectId} />
      case 'contract':
        return <ContractPanel projectId={toolProjectId} />
      case 'contacts':
        return <ContactsPanel />
      case 'admin':
        return <AdminPanel projectId={toolProjectId} onProjectCreated={() => loadProjects()} />
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-24 pb-16 flex-1">
      {/* سربرگ */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <span className="inline-flex size-11 rounded-2xl gold-btn items-center justify-center shrink-0">
          <UserRound className="size-5" />
        </span>
        <div>
          <h1 className="font-extrabold text-lg md:text-xl">پنل من</h1>
          <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1.5">
            {user?.fullName}
            {user ? '— ' + roleLabelFa(role) : ''}
          </p>
        </div>
      </div>

      {/* فید به‌روزرسایی‌ها */}
      <section className="mb-10" aria-label="به‌روزرسایی‌ها">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="size-4 text-gold" />
          <h2 className="font-extrabold text-sm">به‌روزرسایی‌ها</h2>
          <span className="text-[0.6rem] text-muted-foreground">آخرین رویدادها و پیام‌های پروژه‌های فعال شما</span>
        </div>
        {updates.length === 0 ? (
          <div className="card-lux p-8 text-center text-muted-foreground text-xs">
            هنوز به‌روزرسایی‌ای برای شما ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto nice-scroll pe-1">
            {updates.map((u) => (
              <UpdateCard key={u.id} u={u} onOpen={() => navigate('timeline', u.projectSlug)} />
            ))}
          </div>
        )}
      </section>

      {/* پروژه‌های من — فقط فعال */}
      <section className="mb-10" aria-label="پروژه‌های فعال من">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="size-4 text-gold" />
          <h2 className="font-extrabold text-sm">پروژه‌های فعال من</h2>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setAddProjectOpen(true)}
              className="gold-btn rounded-full h-7 px-3 text-[0.65rem] gap-1 ms-auto"
            >
              <Plus className="size-3.5" /> پروژه جدید
            </Button>
          )}
        </div>
        {projects.length === 0 ? (
          <div className="card-lux p-8 text-center">
            <p className="text-muted-foreground text-xs">
              {isAdmin ? 'هیچ پروژه فعالی ثبت نشده است — اولین پروژه را اضافه کنید.' : 'هنوز پروژه فعالی به حساب شما اختصاص داده نشده است.'}
            </p>
            {!isAdmin && <p className="text-muted-foreground text-[0.65rem] mt-2">با مدیر سیستم (مدیرعامل) هماهنگ کنید.</p>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div key={p.id} className="card-lux p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{p.title}</h3>
                    <span className="text-[0.6rem] font-bold text-gold">{p.status}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setArchiving(p)}
                      title={`آرشیو ${p.title} — خروجی ZIP و حذف از داشبورد`}
                      aria-label={`آرشیو ${p.title}`}
                      className="shrink-0 grid place-items-center size-8 rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
                    >
                      <Archive className="size-3.5" />
                    </button>
                  )}
                </div>
                {p.progress > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={p.progress} className="h-1.5 flex-1" />
                    <span className="text-[0.65rem] font-bold text-gold tabular-nums">{toFaDigits(p.progress)}٪</span>
                  </div>
                )}
                <Button
                  onClick={() => navigate('timeline', p.slug)}
                  variant="default"
                  className="rounded-full h-9 text-xs gap-1.5 gold-btn"
                >
                  <GitBranch className="size-3.5" />
                  تایم‌لاین
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* آرشیوهای دانلودی — مدیر و مجری */}
      {(isAdmin || role === 'executor') && (
        <section className="mb-10" aria-label="آرشیو پروژه‌ها">
          <div className="flex items-center gap-2 mb-4">
            <ArchiveRestore className="size-4 text-gold" />
            <h2 className="font-extrabold text-sm">آرشیو پروژه‌های بسته‌شده</h2>
            {archives.length > 0 && (
              <span className="gold-btn rounded-full size-5 text-[0.6rem] font-bold inline-flex items-center justify-center">
                {toFaDigits(archives.length)}
              </span>
            )}
          </div>
          {archives.length === 0 ? (
            <div className="card-lux p-5 text-center text-muted-foreground text-[0.68rem] leading-6">
              هنوز پروژه‌ای آرشیو نشده است. وقتی پروژه‌ای تمام شد، با دکمه آرشیو (روبایدی) کل سابقه‌اش در یک فایل ZIP
              ذخیره و از داشبورد حذف می‌شود و اینجا آماده دانلود می‌ماند.
            </div>
          ) : (
            <div className="space-y-2">
              {archives.map((a) => (
                <div key={a.id} className="card-lux p-3.5 flex items-center gap-3">
                  <span className="grid place-items-center size-10 rounded-xl bg-accent text-gold shrink-0">
                    <Archive className="size-4.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{a.projectTitle}</p>
                    <p className="text-[0.58rem] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{formatJalali(new Date(a.createdAt), { short: true })}</span>
                      <span className="size-1 rounded-full bg-border" aria-hidden />
                      <span className="tabular-nums">{toFaDigits(a.eventCount)} رکورد</span>
                      {a.summary?.comments ? (
                        <>
                          <span className="size-1 rounded-full bg-border" aria-hidden />
                          <span className="tabular-nums">{toFaDigits(a.summary.comments)} پیام</span>
                        </>
                      ) : null}
                      <span className="size-1 rounded-full bg-border" aria-hidden />
                      <span className="tabular-nums">{fmtSize(a.sizeBytes)}</span>
                    </p>
                  </div>
                  <a
                    href={`/api/archives/${a.id}/download`}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full gold-btn h-8 px-3.5 text-[0.65rem] font-bold"
                  >
                    <Download className="size-3.5" />
                    دانلود ZIP
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ابزارهای من */}
      {myTools.length > 0 && (
        <section aria-label="ابزارهای من">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="size-4 text-gold" />
            <h2 className="font-extrabold text-sm">ابزارهای من</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myTools.map((id) => {
              const t = TOOL_DEFS[id]
              return (
                <button
                  key={id}
                  onClick={() => openTool(id)}
                  className="card-lux p-4 text-start flex items-center gap-3.5 group hover:border-gold/50 transition-colors"
                >
                  <span className="inline-flex size-10 rounded-xl bg-accent items-center justify-center text-gold shrink-0 group-hover:scale-105 transition-transform">
                    <t.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-xs">{t.label}</span>
                    <span className="block text-[0.62rem] text-muted-foreground leading-5 mt-0.5">{t.desc}</span>
                  </span>
                  <ChevronLeft className="size-4 text-muted-foreground ms-auto shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* دیالوگ ابزار */}
      <Dialog open={!!activeTool} onOpenChange={(v) => !v && setActiveTool(null)}>
        <DialogContent dir="rtl" className="bg-card border-border max-w-3xl max-h-[88dvh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              {activeDef && <activeDef.icon className="size-4 text-gold" />}
              {activeDef?.label}
            </DialogTitle>
            <DialogDescription className="text-[0.68rem] leading-5 text-muted-foreground">
              {activeDef?.desc}
            </DialogDescription>
            {activeDef?.perProject && projects.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setToolProjectId(p.id)}
                    className={`text-[0.62rem] font-bold rounded-full px-2.5 py-1 border transition-colors ${
                      toolProjectId === p.id
                        ? 'border-gold/60 bg-gold/15 text-gold'
                        : 'border-border/70 text-muted-foreground hover:border-gold/40'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5 nice-scroll">
            {activeDef?.perProject && !toolProjectId ? (
              <p className="text-center text-muted-foreground text-xs py-10">پروژه‌ای برای انتخاب موجود نیست.</p>
            ) : (
              renderToolPanel()
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* دیالوگ افزودن پروژه (مدیر) */}
      <AddProjectDialog
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onCreated={() => loadProjects()}
      />

      {/* تأیید آرشیو — هشدار مهم */}
      <AlertDialog open={!!archiving} onOpenChange={(v) => !v && setArchiving(null)}>
        <AlertDialogContent dir="rtl" className="bg-card border-destructive/30 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              آرشیو پروژه «{archiving?.title}»
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-6">
              آیا می‌خواهید <b className="text-destructive">تمام سابقه حذف شود؟</b>
              <br />
              همه رویدادها، عکس‌ها، گفتگوها، رسیدهای پرداخت، اسناد و رفرنس‌های این پروژه در یک فایل ZIP
              ذخیره و آماده دانلود می‌شوند؛ سپس پروژه برای همیشه از داشبورد و سایت حذف می‌شود.
              <br />
              <b>این عمل قابل بازگشت نیست</b> — تنها نسخه باقی‌مانده، همان فایل ZIP است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full">انصراف — پروژه فعلی بماند</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                doArchive()
              }}
              disabled={archiveBusy}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90 gap-1.5"
            >
              {archiveBusy ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
              بله، آرشیو و حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* پیام‌های آرشیو */
function toastArchiveOk(d: { fileName?: string; sizeBytes?: number; summary?: { events: number } }) {
  toast.success(
    `آرشیو ساخته شد (${toFaDigits(d.summary?.events || 0)} رکورد${d.sizeBytes ? ' — ' + fmtSize(d.sizeBytes) : ''}) — در بخش «آرشیو پروژه‌های بسته‌شده» آماده دانلود است`,
    { duration: 7000 },
  )
}
function toastArchiveErr(e: unknown) {
  toast.error(e instanceof Error ? e.message : 'خطا در ساخت آرشیو')
}

/* نقش فارسی */
function roleLabelFa(role: string) {
  const labels: Record<string, string> = {
    admin: 'مدیر سیستم',
    executor: 'مجری',
    engineer: 'مهندس',
    foreman: 'سرپرست کارگاه',
    supervisor: 'ناظر',
    owner: 'مالک',
    contractor: 'پیمانکار',
  }
  return labels[role] || role
}

/* کارت به‌روزرسایی */
function UpdateCard({ u, onOpen }: { u: UpdateItem; onOpen: () => void }) {
  const isComment = u.type === 'comment'
  const pending = u.needsFollowUp && !u.resolvedAt
  return (
    <button
      onClick={onOpen}
      className="w-full text-start card-lux p-3.5 flex gap-3 hover:border-gold/40 transition-colors group"
    >
      <span className="shrink-0 mt-0.5">
        {isComment ? (
          <RoleAvatar role={u.authorRole} size="md" />
        ) : (
          <span className="grid place-items-center size-8 rounded-full bg-accent text-gold">
            <MessageCircle className="size-4" />
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.72rem] font-bold truncate">{u.eventTitle}</span>
          {pending && (
            <span className="text-[0.55rem] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/40 rounded-full px-1.5 py-0.5 inline-flex items-center gap-1 shrink-0">
              <Clock className="size-2.5" />
              پیگیری
            </span>
          )}
        </span>
        <span className="block text-[0.66rem] text-muted-foreground leading-5 mt-1 line-clamp-2">{u.snippet}</span>
        <span className="flex items-center gap-2 flex-wrap mt-1.5">
          <span className="text-[0.58rem] text-muted-foreground/80">{u.authorRoleLabel || u.authorName}</span>
          <span className="size-1 rounded-full bg-border" aria-hidden />
          <span className="text-[0.58rem] text-muted-foreground/80">{u.projectTitle}</span>
          <span className="size-1 rounded-full bg-border" aria-hidden />
          <span className="text-[0.58rem] text-muted-foreground/80 tabular-nums">
            {formatJalali(new Date(u.at), { short: true })}
          </span>
          {u.amount && (
            <span className="text-[0.58rem] font-extrabold text-emerald-600 dark:text-emerald-400 ms-auto">
              {formatToman(u.amount)} تومان
            </span>
          )}
          <span className="ms-auto inline-flex items-center gap-1 text-[0.58rem] text-gold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            مشاهده در تایم‌لاین
            <ArrowLeft className="size-2.5" />
          </span>
        </span>
      </span>
    </button>
  )
}
