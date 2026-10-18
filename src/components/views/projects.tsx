'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { SectionHeading } from '@/components/section-heading'
import { StatsBand } from '@/components/stats-band'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MapPin, Ruler, CalendarDays, CheckCircle2, Loader, Sparkles, Tag } from 'lucide-react'
import { toFaDigits } from '@/lib/jalali'

type Project = {
  slug: string
  title: string
  subtitle: string | null
  category: string
  status: string | null
  location: string
  area: string
  year: string
  progress: number
  coverImage: string
  forSale?: boolean
  salePrice?: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  'in-progress': 'در دست اقدام',
  completed: 'انجام‌شده',
  future: 'پروژه‌های آینده',
}

const CATEGORY_META: Record<
  string,
  { icon: React.ElementType; accent: string; badge: string }
> = {
  'in-progress': {
    icon: Loader,
    accent: 'text-gold',
    badge: 'bg-gold/10 text-gold border-gold/30',
  },
  completed: {
    icon: CheckCircle2,
    accent: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  future: {
    icon: Sparkles,
    accent: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
  },
}

const CATEGORY_ORDER = ['in-progress', 'completed', 'future'] as const

function ProjectCard({ p, index }: { p: Project; index: number }) {
  const navigate = useAppStore((s) => s.navigate)
  const badgeVariant = p.category === 'completed' ? 'default' : p.category === 'in-progress' ? 'secondary' : 'outline'

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.45 }}
      onClick={() => navigate('project', p.slug)}
      className="card-lux overflow-hidden text-start group"
    >
      <div className="relative h-44 md:h-52 overflow-hidden">
        <img
          src={p.coverImage}
          alt={p.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        {p.category === 'future' && (
          <div className="absolute inset-0 backdrop-blur-[1px] bg-black/25" />
        )}
        {p.forSale && (
          <span className="absolute top-3 end-3 gold-btn rounded-full px-3 py-1 text-[0.68rem] font-bold flex items-center gap-1 shrink-0">
            <Tag className="size-3" /> در فروش {p.salePrice ? `— ${p.salePrice}` : ''}
          </span>
        )}
        <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2">
          <span className="text-white font-bold text-sm md:text-base drop-shadow">{p.title}</span>
          <Badge
            variant={badgeVariant}
            className={
              p.category === 'completed'
                ? 'bg-emerald-500/90 text-white shrink-0'
                : p.category === 'in-progress'
                  ? 'gold-btn shrink-0'
                  : 'glass text-gold border-border shrink-0'
            }
          >
            {p.category === 'completed' && <CheckCircle2 className="size-3" />}
            {p.category === 'in-progress' && <Loader className="size-3" />}
            {p.category === 'future' && <Sparkles className="size-3" />}
            {p.status || CATEGORY_LABELS[p.category]}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        {p.subtitle && <p className="text-muted-foreground text-xs mb-3">{p.subtitle}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="size-3 text-gold" />{p.location}</span>
          <span className="flex items-center gap-1"><Ruler className="size-3 text-gold" />{p.area}</span>
          <span className="flex items-center gap-1"><CalendarDays className="size-3 text-gold" />{p.year}</span>
        </div>

        {p.category === 'in-progress' && p.progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[0.7rem] mb-1.5">
              <span className="text-muted-foreground">پیشرفت فیزیکی</span>
              <span className="text-gold font-bold">{toFaDigits(p.progress)}٪</span>
            </div>
            <Progress value={p.progress} className="h-2" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const byCategory = (c: string) => projects.filter((p) => p.category === c)
  const total = projects.length

  return (
    <div className="flex-1 flex flex-col">
      <div className="container mx-auto max-w-6xl px-4 pt-28 pb-10">
        <SectionHeading
          label="پروژه‌ها"
          title="پروژه‌های گروه نیکا بنا"
          description="پروژه‌های در دست اقدام با درصد پیشرفت واقعی و شفاف، پروژه‌های تکمیل‌شده و طرح‌های آینده."
        />
      </div>

      {/* نوار آمار — همان نوار خانه */}
      <StatsBand />

      <div className="container mx-auto max-w-6xl px-4 pt-12 pb-16 flex-1">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-lux h-72 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            هنوز پروژه‌ای ثبت نشده است.
          </p>
        ) : (
          CATEGORY_ORDER.map((c) => {
            const items = byCategory(c)
            if (items.length === 0) return null
            const meta = CATEGORY_META[c]
            const Icon = meta.icon
            return (
              <section key={c} className="mb-14 last:mb-0" aria-label={CATEGORY_LABELS[c]}>
                {/* سربرگ بخش */}
                <div className="flex items-center gap-3 mb-6">
                  <span className={`inline-flex items-center gap-2 font-extrabold text-base md:text-lg ${meta.accent}`}>
                    <span className={`inline-flex items-center justify-center size-8 rounded-xl border ${meta.badge}`}>
                      <Icon className="size-4" />
                    </span>
                    {CATEGORY_LABELS[c]}
                  </span>
                  <span className="text-[0.7rem] text-muted-foreground shrink-0">
                    {toFaDigits(items.length)} پروژه
                  </span>
                  <span className="h-px flex-1 bg-border/70" aria-hidden />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((p, i) => (
                    <ProjectCard key={p.slug} p={p} index={i} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
