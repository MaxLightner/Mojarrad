'use client'

/* پنل مدیریت سیستم — تب‌محور
 * ۱) کاربران و تنظیمات: ساخت کاربر با نقش + تخصیص پروژه، تأیید عکس، تنظیمات دیدگاه
 * ۲) اخبار و مناسبت‌ها: پنل کنترل محتوای اخبار (ساخت/ویرایش/حذف)
 * ۳) وبلاگ: پنل کنترل مطالب تخصصی
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ROLE_LABELS } from '@/lib/permissions'
import { formatJalali } from '@/lib/jalali'
import { AddProjectDialog } from './add-project'
import { ContentManager } from './content-manager'
import { Plus, Loader2, Trash2, UserPlus, Building2, Eye, EyeOff, MessageSquare, BadgeCheck, Check, X, Newspaper, BookOpen, Users2 } from 'lucide-react'

type AdminUser = {
  id: string
  username: string
  fullName: string
  role: string
  roleLabel: string
  active: boolean
  projects: { id: string; title: string }[]
}

type MiniProject = { id: string; title: string; category: string }

type PendingImage = {
  id: string
  url: string
  caption: string | null
  createdAt: string
  eventTitle: string
  projectTitle: string
  uploaderName: string
  uploaderRoleLabel: string
}

const ROLE_OPTIONS = ['admin', 'executor', 'engineer', 'foreman', 'supervisor', 'owner', 'contractor']
const VISIBILITY_OPTIONS = [
  { id: 'management', label: 'فقط مدیر سیستم و مجری' },
  { id: 'team', label: 'مدیر، مجری، مهندس و سرپرست' },
  { id: 'all', label: 'همه (شامل مالک و ناظر)' },
]

export function AdminPanel({ projectId, onProjectCreated }: { projectId: string; onProjectCreated?: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [projects, setProjects] = useState<MiniProject[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [visibility, setVisibility] = useState('management')
  const [savingVisibility, setSavingVisibility] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('owner')
  const [assignedProjects, setAssignedProjects] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setUsers(d.users || [])
        setProjects(d.projects || [])
      })
      .catch(() => toast.error('خطا در بارگذاری کاربران'))
      .finally(() => setLoading(false))
    fetch('/api/admin/images')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPendingImages(d.pending || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /* پروژه‌های فعال — برای تخصیص به کاربر جدید */
  const activeProjects = projects.filter((p) => p.category === 'in-progress')
  const globalAccess = role === 'admin' || role === 'executor'

  const createUser = async () => {
    if (!username.trim() || !password || !fullName.trim()) {
      toast.error('همه فیلدها الزامی است')
      return
    }
    if (!globalAccess && assignedProjects.length === 0) {
      toast.error('برای این نقش حداقل یک پروژه فعال انتخاب کنید')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, password, fullName, role,
          projectIds: globalAccess ? [] : assignedProjects,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('کاربر ساخته شد — اطلاعات ورود را به او بدهید')
      setAddOpen(false); setUsername(''); setPassword(''); setFullName(''); setRole('owner'); setAssignedProjects([])
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ایجاد کاربر')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (userId: string, active: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active }),
    })
    load()
  }

  const toggleAccess = async (userId: string, pid: string, grant: boolean) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, projectId: pid, grant }),
    })
    if (!res.ok) toast.error('خطا در تغییر دسترسی')
    else toast.success(grant ? 'دسترسی اعطا شد' : 'دسترسی حذف شد')
    load()
  }

  const deleteUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) {
      toast.error(d.error || 'خطا در حذف')
      return
    }
    toast.success('کاربر حذف شد')
    load()
  }

  const saveVisibility = async (value: string) => {
    setVisibility(value)
    setSavingVisibility(true)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, commentsVisibility: value }),
      })
      if (!res.ok) throw new Error()
      toast.success('تنظیمات دیدگاه‌ها ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره تنظیمات')
    } finally {
      setSavingVisibility(false)
    }
  }

  const reviewImage = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    if (!res.ok) {
      toast.error('خطا در پردازش')
      return
    }
    toast.success(action === 'approve' ? 'عکس تأیید و به رویداد اضافه شد' : 'عکس رد شد')
    setPendingImages((p) => p.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" dir="rtl">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6 h-10">
          <TabsTrigger value="users" className="text-xs gap-1.5"><Users2 className="size-3.5" /> کاربران</TabsTrigger>
          <TabsTrigger value="news" className="text-xs gap-1.5"><Newspaper className="size-3.5" /> اخبار</TabsTrigger>
          <TabsTrigger value="blog" className="text-xs gap-1.5"><BookOpen className="size-3.5" /> وبلاگ</TabsTrigger>
        </TabsList>

        {/* ============ تب کاربران و تنظیمات ============ */}
        <TabsContent value="users" className="space-y-8 mt-0">
          {/* افزودن پروژه + کاربر */}
          <div className="card-lux p-5 border-gold/30">
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-2">
              <Building2 className="size-4 text-gold" /> گسترش کار
            </h3>
            <p className="text-muted-foreground text-xs leading-6 mb-4">
              مسیر درست: اول <b>پروژه جدید</b> را اضافه کنید؛ بعد برای همان پروژه <b>کاربر جدید</b> (مالک/ناظر/...)
              بسازید تا در داشبورد فقط پروژه خودش را ببیند. مدیر سیستم و مجری به همه پروژه‌های فعال دسترسی دارند.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setAddProjectOpen(true)} className="gold-btn rounded-full gap-1.5">
                <Plus className="size-4" /> پروژه جدید
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="rounded-full gap-1.5">
                <UserPlus className="size-4" /> کاربر جدید
              </Button>
            </div>
          </div>

          {/* عکس‌های در انتظار تأیید */}
          <section className="card-lux p-5">
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-2">
              <BadgeCheck className="size-4 text-gold" /> عکس‌های پیشنهادی کاربران
              {pendingImages.length > 0 && (
                <span className="gold-btn rounded-full size-5 text-[0.68rem] font-bold inline-flex items-center justify-center">
                  {pendingImages.length}
                </span>
              )}
            </h3>
            <p className="text-muted-foreground text-xs leading-6 mb-4">
              عکس‌هایی که کاربران روی رویدادها آپلود کرده‌اند؛ با تأیید شما در گالری رویداد نمایش داده می‌شوند.
            </p>
            {pendingImages.length === 0 ? (
              <p className="text-[0.72rem] text-muted-foreground py-2">عکس در انتظار تأیید وجود ندارد.</p>
            ) : (
              <div className="space-y-3">
                {pendingImages.map((img) => (
                  <div key={img.id} className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-border/70 p-3">
                    <img src={img.url} alt={img.caption || 'عکس پیشنهادی'} className="sm:w-32 h-32 object-cover rounded-xl border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs">{img.eventTitle}</p>
                      <p className="text-[0.68rem] text-muted-foreground mt-1">{img.projectTitle}</p>
                      {img.caption && <p className="text-[0.68rem] text-muted-foreground leading-5 mt-1">«{img.caption}»</p>}
                      <p className="text-[0.65rem] text-muted-foreground mt-1.5">
                        ارسال: {img.uploaderName} ({img.uploaderRoleLabel}) — {formatJalali(new Date(img.createdAt), { short: true })}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                      <Button size="sm" onClick={() => reviewImage(img.id, 'approve')} className="gold-btn rounded-full h-8 px-4 text-xs gap-1">
                        <Check className="size-3.5" /> تأیید
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewImage(img.id, 'reject')} className="rounded-full h-8 px-4 text-xs gap-1 text-destructive">
                        <X className="size-3.5" /> رد
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* تنظیمات پروژه */}
          <section className="card-lux p-5">
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-2">
              <MessageSquare className="size-4 text-gold" /> چه کسانی کامنت‌های رویدادها را ببینند؟
            </h3>
            <p className="text-muted-foreground text-xs leading-6 mb-4">
              به‌صورت پیش‌فرض فقط مدیر سیستم و مجری کامنت‌ها را می‌بینند. اگر مالکِ پروژه خودش مجری است،
              این تنظیم را بازتر کنید.
            </p>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => saveVisibility(o.id)}
                  disabled={savingVisibility}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    visibility === o.id ? 'gold-btn' : 'glass border border-border text-muted-foreground hover:border-gold/50'
                  }`}
                >
                  {savingVisibility && visibility === o.id && <Loader2 className="size-3 animate-spin inline ms-1" />}
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* مدیریت کاربران */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <UserPlus className="size-4 text-gold" /> کاربران و سطوح دسترسی
              </h3>
              <Button onClick={() => setAddOpen(true)} className="gold-btn rounded-full" size="sm">
                <Plus className="size-4" /> کاربر جدید
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="card-lux h-24 animate-pulse bg-muted/40" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="card-lux p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex size-10 rounded-xl bg-accent items-center justify-center text-gold font-bold text-xs shrink-0">
                        {u.fullName.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm">{u.fullName}</p>
                        <p className="text-muted-foreground text-[0.68rem]" dir="ltr">@{u.username} · {u.roleLabel}</p>
                      </div>

                      <div className="flex items-center gap-1.5 ms-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(u.id, !u.active)}
                          className="rounded-full h-8 gap-1 text-xs"
                          title={u.active ? 'غیرفعال کردن حساب' : 'فعال کردن حساب'}
                        >
                          {u.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          {u.active ? 'غیرفعال' : 'فعال'}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => deleteUser(u.id)}
                          className="rounded-full size-8 text-destructive hover:bg-destructive/10"
                          aria-label={`حذف ${u.fullName}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* دسترسی پروژه‌ها */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[0.65rem] text-muted-foreground mb-2 flex items-center gap-1">
                        <Building2 className="size-3 text-gold" /> دسترسی به پروژه‌ها:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {projects.map((p) => {
                          const has = u.projects.some((up) => up.id === p.id)
                          const userGlobal = u.role === 'admin' || u.role === 'executor'
                          return (
                            <button
                              key={p.id}
                              onClick={() => !userGlobal && toggleAccess(u.id, p.id, !has)}
                              disabled={userGlobal}
                              className={`rounded-full px-3 py-1 text-[0.65rem] transition-all ${
                                has || userGlobal
                                  ? 'gold-btn'
                                  : 'bg-muted/50 border border-border text-muted-foreground hover:border-gold/50'
                              } ${userGlobal ? 'opacity-60 cursor-default' : ''} ${p.category === 'completed' ? 'opacity-50' : ''}`}
                              title={userGlobal ? 'مدیر و مجری به همه پروژه‌ها دسترسی دارند' : ''}
                            >
                              {p.title}
                              {p.category === 'completed' ? ' (تمام‌شده)' : ''}
                              {has && ' ✓'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ============ تب اخبار ============ */}
        <TabsContent value="news" className="mt-0">
          <ContentManager type="news" />
        </TabsContent>

        {/* ============ تب وبلاگ ============ */}
        <TabsContent value="blog" className="mt-0">
          <ContentManager type="blog" />
        </TabsContent>
      </Tabs>

      {/* دیالوگ ساخت کاربر — با تخصیص پروژه */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="bg-card border-border max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-gold" /> ساخت کاربر جدید
            </DialogTitle>
            <DialogDescription>
              نقش کاربر را مشخص کنید و برای مالک/ناظر/پیمانکار، پروژه فعالِ مرتبط را انتخاب کنید.
              مدیر سیستم و مجری به همه پروژه‌های فعال دسترسی دارند.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div>
              <Label className="text-xs mb-1.5 block">نام و نام خانوادگی *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثلاً: مهندس سارا احمدی" className="bg-background rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">نام کاربری *</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="مثلاً: s.ahmadi" dir="ltr" className="bg-background rounded-xl text-start" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">رمز عبور *</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" dir="ltr" className="bg-background rounded-xl text-start" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">نقش کاربر *</Label>
              <Select value={role} onValueChange={(v) => { setRole(v); if (v === 'admin' || v === 'executor') setAssignedProjects([]) }}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.62rem] text-muted-foreground mt-2 leading-5">
                {globalAccess
                  ? 'این نقش به همه پروژه‌های فعال دسترسی دارد.'
                  : 'این نقش فقط به پروژه‌های انتخاب‌شدهٔ زیر دسترسی دارد.'}
              </p>
            </div>

            {/* تخصیص پروژه فعال */}
            {!globalAccess && (
              <div>
                <Label className="text-xs mb-1.5 block">
                  پروژه‌های فعال این کاربر <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {activeProjects.length === 0 && (
                    <p className="text-[0.65rem] text-muted-foreground">پروژه فعالی موجود نیست — اول «پروژه جدید» بسازید.</p>
                  )}
                  {activeProjects.map((p) => {
                    const on = assignedProjects.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAssignedProjects((prev) => (on ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
                        className={`rounded-full px-3 py-1.5 text-[0.65rem] font-bold transition-all border ${
                          on ? 'border-gold/60 bg-gold/15 text-gold' : 'border-border text-muted-foreground hover:border-gold/40'
                        }`}
                      >
                        {on && '✓ '}{p.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <Button onClick={createUser} disabled={submitting} className="gold-btn rounded-full">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            ساخت کاربر
          </Button>
        </DialogContent>
      </Dialog>

      {/* دیالوگ افزودن پروژه */}
      <AddProjectDialog
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onCreated={() => {
          load()
          onProjectCreated?.()
        }}
      />

      <div className="card-lux p-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={true} disabled className="data-[state=checked]:bg-gold" />
        <span>ممنوعیت ثبت‌نام آزاد فعال است — کاربران فقط از طریق همین پنل ساخته می‌شوند.</span>
      </div>
    </div>
  )
}
