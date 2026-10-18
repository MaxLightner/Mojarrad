'use client'

/* ویوی مستقل تایم‌لاین پروژه — بدون سوییچر پروژه، بدون دفترچه تلفن، بدون فرم
 * فقط خط، گره‌ها، نخ‌ها و کارت کانونی. مسیر درست: پروژه‌ها → پروژه → تایم‌لاین
 */

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { SpineTimeline } from '@/components/timeline/spine-timeline'
import { toFaDigits } from '@/lib/jalali'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight, Lock, LogIn, LayoutDashboard, GitBranch } from 'lucide-react'

type ProjectInfo = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  category: string
  status: string | null
  location: string
  progress: number
  startDate: string | null
  endDate: string | null
}

export function TimelineView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<{ project: ProjectInfo; timelineAccess: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [slug, user])

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 pt-28 pb-16 flex-1">
        <div className="h-10 rounded-full animate-pulse bg-muted/40 w-1/2 mb-3" />
        <div className="h-3 rounded-full animate-pulse bg-muted/30 w-1/3 mb-16" />
        <div className="space-y-14">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-5">
              <div className="size-11 rounded-full animate-pulse bg-muted/50 shrink-0" />
              <div className="h-4 rounded-full animate-pulse bg-muted/30 flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data?.project) {
    return (
      <div className="container mx-auto max-w-2xl px-4 pt-32 pb-16 flex-1 text-center">
        <p className="text-muted-foreground">پروژه موردنظر یافت نشد.</p>
        <Button onClick={() => navigate('projects')} variant="outline" className="mt-4 rounded-full">
          بازگشت به پروژه‌ها
        </Button>
      </div>
    )
  }

  const p = data.project

  /* بدون دسترسی — کاربر عادی یا عضو پروژهٔ دیگر */
  if (!data.timelineAccess) {
    return (
      <div className="container mx-auto max-w-2xl px-4 pt-28 pb-16 flex-1">
        <BackRow title={p.title} onBack={() => navigate('project', p.slug)} />
        <div className="card-lux p-10 text-center">
          <span className="inline-flex size-14 rounded-2xl bg-accent items-center justify-center text-gold">
            <Lock className="size-6" />
          </span>
          <h2 className="font-extrabold text-base mt-4">تایم‌لاین این پروژه خصوصی است</h2>
          <p className="text-muted-foreground text-xs leading-6 mt-2 max-w-sm mx-auto">
            رویدادها، رفرنس‌ها و رسیدهای پرداخت این پروژه فقط برای اعضای آن (مالک، ناظر، مجری و تیم فنی) قابل مشاهده است.
          </p>
          <div className="flex gap-2 justify-center mt-5">
            {user ? (
              <Button onClick={() => navigate('dashboard')} variant="outline" className="rounded-full">
                <LayoutDashboard className="size-4" /> پنل من
              </Button>
            ) : (
              <Button onClick={() => navigate('login')} className="gold-btn rounded-full">
                <LogIn className="size-4" /> ورود اعضا
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const closed = p.category === 'completed'

  return (
    <div className="container mx-auto max-w-2xl px-4 pt-24 pb-24 flex-1">
      <BackRow title={p.title} onBack={() => navigate('project', p.slug)} />

      {/* سربرگ مینیمال — فقط نام، وضعیت و پیشرفت */}
      <div className="mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold text-gold">
            <GitBranch className="size-4" />
            تایم‌لاین پروژه
          </span>
          <span className="text-[0.65rem] text-muted-foreground">{p.location}</span>
          {p.status && (
            <span
              className={`text-[0.6rem] font-bold rounded-full px-2.5 py-0.5 ${
                closed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gold/10 text-gold'
              }`}
            >
              {p.status}
            </span>
          )}
        </div>

        {!closed && p.progress > 0 && (
          <div className="flex items-center gap-3 mt-3 max-w-xs">
            <Progress value={p.progress} className="h-1.5 flex-1" />
            <span className="text-[0.7rem] font-extrabold text-gold tabular-nums shrink-0">
              {toFaDigits(p.progress)}٪
            </span>
          </div>
        )}
      </div>

      <SpineTimeline projectId={p.id} closed={closed} />
    </div>
  )
}

function BackRow({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Button onClick={onBack} variant="ghost" size="icon" className="size-8 rounded-full shrink-0" aria-label="بازگشت">
        <ArrowRight className="size-4" />
      </Button>
      <h1 className="font-extrabold text-sm md:text-base truncate">{title}</h1>
    </div>
  )
}
