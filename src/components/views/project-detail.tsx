'use client'

/* صفحهٔ عمومی پروژه
 * در حال ساخت: مینیمال — یک عکس، توضیح، درصد پیشرفت و دکمهٔ ورود به تایم‌لاین (اعضا).
 * گالری و معرفیِ مفصل مال پروژه‌های تمام‌شده است (پورتفولیو).
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toFaDigits } from '@/lib/jalali'
import {
  ArrowRight, MapPin, Ruler, CalendarDays, LogIn, LayoutDashboard, Tag, Phone, GitBranch, Lock,
} from 'lucide-react'

type ProjectDetail = {
  slug: string
  title: string
  subtitle: string | null
  category: string
  status: string | null
  location: string
  area: string
  year: string
  progress: number
  description: string
  coverImage: string
  gallery: string[]
  startDate: string | null
  endDate: string | null
  id?: string
  forSale?: boolean
  salePrice?: string | null
  saleDescription?: string | null
}

export function ProjectDetailView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<{ project: ProjectDetail & { id: string }; timelineAccess: boolean } | null>(null)
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
      <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
        <div className="h-72 card-lux animate-pulse bg-muted/40" />
      </div>
    )
  }

  if (!data?.project) {
    return (
      <div className="container mx-auto max-w-6xl px-4 pt-32 pb-16 flex-1 text-center">
        <p className="text-muted-foreground">پروژه موردنظر یافت نشد.</p>
        <Button onClick={() => navigate('projects')} variant="outline" className="mt-4 rounded-full">
          بازگشت به پروژه‌ها
        </Button>
      </div>
    )
  }

  const p = data.project
  const inProgress = p.category === 'in-progress'

  /* ============ پروژه در حال ساخت — نمای مینیمال ============ */
  if (inProgress) {
    return (
      <div className="flex-1">
        <section className="relative h-[56vh] min-h-96 overflow-hidden" aria-label={p.title}>
          <img src={p.coverImage} alt={p.title} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-transparent" />

          <div className="container mx-auto max-w-3xl px-4 relative z-10 pt-28">
            <Button
              onClick={() => navigate('projects')}
              variant="outline"
              size="sm"
              className="glass rounded-full mb-4 border-border"
            >
              <ArrowRight className="size-4" /> همه پروژه‌ها
            </Button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="gold-btn">
                <span className="size-1.5 rounded-full bg-current animate-pulse me-1" aria-hidden />
                {p.status}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-3 drop-shadow-sm">{p.title}</h1>
              {p.subtitle && <p className="text-muted-foreground md:text-lg mt-2">{p.subtitle}</p>}

              <div className="flex flex-wrap gap-2 mt-5">
                <span className="glass border border-border rounded-full px-4 py-1.5 text-xs flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-gold" /> {p.location}
                </span>
                <span className="glass border border-border rounded-full px-4 py-1.5 text-xs flex items-center gap-1.5">
                  <Ruler className="size-3.5 text-gold" /> {p.area}
                </span>
                <span className="glass border border-border rounded-full px-4 py-1.5 text-xs flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-gold" /> {p.year}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto max-w-3xl px-4 py-10">
          {/* پیشرفت */}
          {p.progress > 0 && (
            <div className="card-lux p-5 mb-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">پیشرفت فیزیکی پروژه</span>
                <span className="text-gold font-extrabold text-base">{toFaDigits(p.progress)}٪</span>
              </div>
              <Progress value={p.progress} className="h-2.5" />
            </div>
          )}

          {/* توضیح ساده */}
          <p className="text-muted-foreground text-sm leading-8">{p.description}</p>

          {/* ورود اعضا به تایم‌لاین */}
          <div className="card-lux p-6 mt-8 flex flex-col sm:flex-row sm:items-center gap-4 border-gold/30">
            <span className="inline-flex size-12 rounded-2xl bg-accent items-center justify-center text-gold shrink-0">
              <Lock className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">تایم‌لاین شفاف اجرا — مخصوص اعضای پروژه</p>
              <p className="text-muted-foreground text-xs leading-6 mt-1">
                مالک، ناظر، مجری و تیم فنی با ورود، روند مرحله‌به‌مرحلهٔ ساخت را می‌بینند.
              </p>
            </div>
            {user ? (
              <Button
                onClick={() => navigate('timeline', p.slug)}
                className="gold-btn rounded-full shrink-0"
              >
                <GitBranch className="size-4" /> تایم‌لاین پروژه
              </Button>
            ) : (
              <Button onClick={() => navigate('login')} className="gold-btn rounded-full shrink-0">
                <LogIn className="size-4" /> ورود اعضا
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ============ پروژه تمام‌شده / آینده — پورتفولیو کامل ============ */
  return (
    <div className="flex-1">
      <section className="relative h-[52vh] min-h-80 overflow-hidden" aria-label={p.title}>
        <img src={p.coverImage} alt={p.title} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-transparent" />

        <div className="container mx-auto max-w-6xl px-4 relative z-10 pt-28">
          <Button
            onClick={() => navigate('projects')}
            variant="outline"
            size="sm"
            className="glass rounded-full mb-4 border-border"
          >
            <ArrowRight className="size-4" /> همه پروژه‌ها
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge
              variant="secondary"
              className={
                p.category === 'completed'
                  ? 'bg-emerald-500/90 text-white'
                  : 'glass text-gold border-border'
              }
            >
              {p.status}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold mt-3 drop-shadow-sm">{p.title}</h1>
            {p.subtitle && <p className="text-muted-foreground md:text-lg mt-2">{p.subtitle}</p>}

            <div className="flex flex-wrap gap-2 mt-5">
              <span className="glass border border-border rounded-full px-4 py-1.5 text-xs flex items-center gap-1.5">
                <MapPin className="size-3.5 text-gold" /> {p.location}
              </span>
              <span className="glass border border-border rounded-full px-4 py-1.5 text-xs flex items-center gap-1.5">
                <Ruler className="size-3.5 text-gold" /> {p.area}
              </span>
              <span className="glass border border-border rounded-full px-4 py-1.5 text-xs flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-gold" /> {p.year}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <span className="section-label">معرفی پروژه</span>
            <h2 className="title-line text-xl md:text-2xl font-extrabold mt-2 mb-4">درباره این پروژه</h2>
            <p className="text-muted-foreground text-sm md:text-base leading-8">{p.description}</p>

            {p.gallery.length > 0 && (
              <div className="mt-8">
                <span className="section-label">گالری تصاویر</span>
                <h3 className="font-extrabold mt-2 mb-4">تصاویر پروژه</h3>
                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1">
                  {p.gallery.map((img, i) => (
                    <div key={i} className="shrink-0 w-60 md:w-72 snap-start rounded-2xl overflow-hidden border border-border">
                      <img src={img} alt={`گالری ${p.title} — تصویر ${i + 1}`} className="w-full h-40 md:h-44 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ستون کناری */}
          <aside className="space-y-4">
            {p.forSale && (
              <div className="card-lux p-5 border-gold/40">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="size-4 text-gold" />
                  <p className="text-xs text-muted-foreground">این ملک در فروش است</p>
                </div>
                {p.salePrice && <p className="gold-text text-2xl font-extrabold">{p.salePrice}</p>}
                {p.saleDescription && <p className="text-muted-foreground text-xs leading-6 mt-2">{p.saleDescription}</p>}
                <a href="tel:+989152061541" className="gold-btn rounded-full w-full mt-4 h-10 inline-flex items-center justify-center text-sm font-bold">
                  <Phone className="size-4" /> هماهنگی بازدید
                </a>
              </div>
            )}
            {p.startDate && (
              <div className="card-lux p-5">
                <p className="text-xs text-muted-foreground mb-3">زمان‌بندی</p>
                <div className="space-y-2 text-sm">
                  {p.startDate && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground text-xs">شروع</span>
                      <span className="font-bold text-xs">{p.startDate}</span>
                    </p>
                  )}
                  {p.endDate && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground text-xs">پایان / تحویل</span>
                      <span className="font-bold text-xs">{p.endDate}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="card-lux p-5">
              <p className="text-xs text-muted-foreground mb-3 leading-6">
                آیا در این پروژه سرمایه‌گذار یا مالک هستید؟
              </p>
              <Button onClick={() => navigate('consulting')} variant="outline" className="w-full rounded-full glass">
                مشاوره سرمایه‌گذاری
              </Button>
            </div>

            {user && p.category === 'completed' && (
              <Button onClick={() => navigate('timeline', p.slug)} variant="outline" className="w-full rounded-full glass">
                <GitBranch className="size-4" /> تایم‌لاین اجرا (سیر ساخت)
              </Button>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

void LayoutDashboard
