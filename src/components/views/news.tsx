'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionHeading } from '@/components/section-heading'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatJalali } from '@/lib/jalali'
import { Coins, Landmark, Building2 } from 'lucide-react'

type News = {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  coverImage: string | null
  date: string
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  prices: { label: 'قیمت مصالح', icon: Coins, color: '#10b981' },
  policy: { label: 'قوانین و سیاست‌ها', icon: Landmark, color: '#a78bfa' },
  company: { label: 'خبر گروه', icon: Building2, color: '#d4a531' },
}

/* مناسبتی‌ها — بنر عکس‌دار تمام‌عرض و کوتاه بالای صفحه اخبار
 * هر مناسبت عکس خودش را دارد؛ متن روی عکس با گرادیان تیره خوانا می‌ماند
 * هر چند ثانیه به مناسبت بعدی می‌لغزد (بدون پاپ‌آپ) */
const OCCASION_THEME: Record<
  string,
  { label: string; accent: string }
> = {
  holiday: { label: 'مناسبت رسمی', accent: '#d4a531' },
  trip: { label: 'سفر و بازدید', accent: '#14b8a6' },
  event: { label: 'رویداد گروه', accent: '#a78bfa' },
}

function occasionKind(title: string): string {
  if (title.includes('تعطیل') || title.includes('نوروز') || title.includes('عید') || title.includes('تبریک')) return 'holiday'
  if (title.includes('سفر') || title.includes('بازدید')) return 'trip'
  return 'event'
}

const ROTATE_MS = 6000

function OccasionBanner({ occasions }: { occasions: News[] }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || occasions.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % occasions.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [paused, occasions])

  if (occasions.length === 0) return null
  const o = occasions[idx % occasions.length]
  const kind = occasionKind(o.title)
  const meta = OCCASION_THEME[kind] || OCCASION_THEME.event

  return (
    <section
      className="relative w-full overflow-hidden border-b border-border bg-muted/30"
      style={{ height: 'clamp(150px, 24vw, 210px)' }}
      aria-label="مناسبت‌ها و رویدادهای گروه"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* عکس پس‌زمینه — با لغزش RTL بین مناسبت‌ها */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={o.id}
          className="absolute inset-0"
          initial={{ opacity: 0, x: '-14%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '14%' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          {o.coverImage ? (
            <img
              src={o.coverImage}
              alt={o.title}
              className="absolute inset-0 size-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-l from-gold/20 via-muted to-muted" />
          )}
          {/* گرادیان خوانایی متن — تیره از پایین و سمت راست (RTL) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to left, rgba(9,9,11,0.82) 0%, rgba(9,9,11,0.45) 38%, rgba(9,9,11,0.05) 75%, rgba(9,9,11,0.25) 100%), linear-gradient(to top, rgba(9,9,11,0.55), transparent 55%)',
            }}
            aria-hidden
          />
        </motion.div>
      </AnimatePresence>

      {/* متن روی عکس */}
      <div className="absolute inset-0 flex items-center container mx-auto max-w-6xl px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${o.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full backdrop-blur px-2.5 py-1 text-[0.6rem] font-bold border"
              style={{ color: meta.accent, borderColor: `${meta.accent}66`, background: `${meta.accent}14` }}
            >
              {meta.label}
              <span className="size-1.5 rounded-full" style={{ background: meta.accent }} aria-hidden />
            </span>
            <h2 className="text-white font-extrabold text-sm md:text-lg leading-7 md:leading-8 mt-2 drop-shadow-lg line-clamp-2">
              {o.title}
            </h2>
            <p className="text-white/70 text-[0.6rem] md:text-[0.68rem] mt-1 tabular-nums drop-shadow">
              {formatJalali(new Date(o.date), { short: true })}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* نشانگر چرخش */}
      {occasions.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10" aria-hidden>
          {occasions.map((oc, i) => (
            <button
              key={oc.id}
              tabIndex={-1}
              onClick={() => setIdx(i)}
              aria-label={oc.title}
              className={`h-1.5 rounded-full backdrop-blur transition-all duration-500 ${
                i === idx ? 'w-6 bg-gold' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function NewsView() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<News | null>(null)

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const occasions = news.filter((n) => n.category === 'occasion')
  const mainNews = news.filter((n) => n.category !== 'occasion')
  const hasOccasions = !loading && occasions.length > 0

  return (
    <div className="flex-1 flex flex-col">
      {/* هدر چرخان مناسبت‌ها — بنر عکس‌دار تمام‌عرض کوتاه، بدون پاپ‌آپ */}
      {hasOccasions && (
        <div className="pt-20 md:pt-24">
          <OccasionBanner occasions={occasions} />
        </div>
      )}

      <div className={`container mx-auto max-w-6xl px-4 pb-16 flex-1 ${hasOccasions ? 'pt-10' : 'pt-28'}`}>
        <SectionHeading
          label="بازار و سیاست"
          title="اخبار ساختمان و پروژه"
          description="آنچه بر هزینه و مسیر پروژه‌های شما اثر می‌گذارد: قیمت مصالح، تغییر قوانین و خبرهای گروه نیکا بنا — روی هر خبر کلیک کنید تا متن کامل باز شود."
        />

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-lux h-52 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {mainNews.map((n, i) => {
              const meta = CATEGORY_META[n.category]
              const Icon = meta?.icon || Building2
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelected(n)}
                  className="card-lux overflow-hidden text-start group"
                >
                  <div className="flex gap-0">
                    {n.coverImage && (
                      <div className="relative w-36 sm:w-44 shrink-0 overflow-hidden">
                        <img
                          src={n.coverImage}
                          alt={n.title}
                          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 min-w-0">
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[0.65rem] mb-2"
                        style={{ background: `${meta?.color}1a`, color: meta?.color }}
                      >
                        <Icon className="size-3" />
                        {meta?.label}
                      </Badge>
                      <p className="font-bold text-sm leading-6 line-clamp-2">{n.title}</p>
                      <p className="text-muted-foreground text-xs leading-6 mt-2 line-clamp-2">{n.excerpt}</p>
                      <p className="text-[0.68rem] text-gold mt-2">{formatJalali(new Date(n.date))}</p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
            {mainNews.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-full text-center py-10">خبری منتشر نشده است.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent dir="rtl" className="bg-card border-border max-w-2xl max-h-[88dvh] overflow-y-auto p-0">
          {selected && (
            <>
              {selected.coverImage && (
                <div className="relative h-52">
                  <img src={selected.coverImage} alt={selected.title} className="absolute inset-0 size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
              )}
              <div className="p-5 -mt-6 relative">
                <DialogHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="gap-1"
                      style={{
                        background: selected.category === 'occasion' ? 'rgba(212,165,49,0.12)' : `${CATEGORY_META[selected.category]?.color}1a`,
                        color: selected.category === 'occasion' ? '#d4a531' : CATEGORY_META[selected.category]?.color,
                      }}
                    >
                      {selected.category === 'occasion' ? 'مناسبت و رویداد' : CATEGORY_META[selected.category]?.label}
                    </Badge>
                    <span className="text-xs text-gold">{formatJalali(new Date(selected.date))}</span>
                  </div>
                  <DialogTitle className="text-lg leading-8 text-start">{selected.title}</DialogTitle>
                  <DialogDescription className="sr-only">متن کامل خبر</DialogDescription>
                </DialogHeader>
                <div className="mt-4 text-sm leading-8 text-muted-foreground whitespace-pre-line">
                  {selected.content}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
