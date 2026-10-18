'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Hero3D } from '@/components/hero-3d'
import { StatsBand } from '@/components/stats-band'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatJalali, toFaDigits } from '@/lib/jalali'
import {
  Building2, TrendingUp, Handshake, Newspaper, ChevronDown, MapPin, Tag, BookOpen, Phone,
} from 'lucide-react'

type ProjectCard = {
  slug: string
  title: string
  category: string
  location: string
  coverImage: string
  status?: string | null
  progress?: number
  forSale?: boolean
  salePrice?: string | null
}
type NewsCard = { id: string; title: string; category: string; coverImage: string | null; date: string }
type BlogCard = { id: string; slug: string; title: string; excerpt: string; coverImage: string | null; readMinutes: number }

const NEWS_CATEGORY: Record<string, string> = { prices: 'قیمت مصالح', policy: 'قوانین و سیاست‌ها', company: 'خبر شرکت' }

const QUICK_LINKS = [
  { key: 'projects' as const, icon: Building2, title: 'پروژه‌ها', desc: 'تکمیل‌شده، در دست اقدام و آینده' },
  { key: 'sale' as const, icon: Tag, title: 'فروش املاک', desc: 'ویلا و آپارتمان آماده تحویل' },
  { key: 'blog' as const, icon: BookOpen, title: 'وبلاگ فنی', desc: 'تکنولوژی‌های ساخت که استفاده می‌کنیم' },
  { key: 'news' as const, icon: Newspaper, title: 'اخبار', desc: 'قیمت مصالح، قوانین، خبر شرکت' },
]

export function HomeView() {
  const navigate = useAppStore((s) => s.navigate)
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [saleProjects, setSaleProjects] = useState<ProjectCard[]>([])
  const [news, setNews] = useState<NewsCard[]>([])
  const [posts, setPosts] = useState<BlogCard[]>([])

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        const all: ProjectCard[] = d.projects || []
        setProjects([all.find((p) => p.category === 'in-progress') || all[0], ...all.filter((p) => p.category === 'completed').slice(0, 2)])
        setSaleProjects(all.filter((p) => p.forSale).slice(0, 3))
      })
      .catch(() => {})
    fetch('/api/news')
      .then((r) => r.json())
      .then((d) => setNews((d.news || []).slice(0, 3)))
      .catch(() => {})
    fetch('/api/blog')
      .then((r) => r.json())
      .then((d) => setPosts((d.posts || []).slice(0, 3)))
      .catch(() => {})
  }, [])

  return (
    <div className="flex-1">
      {/* ===== هیرو ===== */}
      <section className="relative min-h-dvh flex items-center overflow-hidden" aria-label="معرفی گروه">
        <Hero3D />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 pointer-events-none" />

        <div className="container mx-auto max-w-6xl px-4 relative z-10 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 glass border border-border rounded-full px-4 py-1.5 text-xs text-gold font-semibold">
              <span className="size-1.5 rounded-full bg-gold animate-pulse" />
              گروه ساختمانی نیکا بنا — مشهد
            </span>

            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-[1.2] md:leading-[1.15]">
              می‌سازیم تا
              <span className="gold-text"> ماندگار </span>
              بماند
            </h1>

            <p className="mt-5 text-muted-foreground text-sm md:text-lg leading-8 md:leading-9 max-w-xl">
              گروه ساختمانی نیکا بنا به مدیریت مهندس حسین مجرد، با تکیه بر دو دهه تجربه ساخت در مشهد،
              پروژه‌های معماری لوکس را با شفافیت کامل برای مالکان اجرا می‌کند؛ از تحلیل زمین و برآورد
              هزینه تا تحویل پایان‌کار.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate('projects')} className="gold-btn rounded-full px-7 py-6 text-sm font-bold">
                <Building2 className="size-4" />
                مشاهده پروژه‌ها
              </Button>
              <Button
                onClick={() => navigate('sale')}
                variant="outline"
                className="rounded-full px-7 py-6 text-sm glass border-border hover:border-gold/60"
              >
                <Tag className="size-4 text-gold" />
                املاک در فروش
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-6 inset-x-0 flex justify-center z-10">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}>
            <ChevronDown className="size-6 text-gold/70" />
          </motion.div>
        </div>
      </section>

      {/* ===== دسترسی سریع ===== */}
      <section className="container mx-auto max-w-6xl px-4 py-10" aria-label="دسترسی سریع">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {QUICK_LINKS.map((q, i) => {
            const Icon = q.icon
            return (
              <motion.button
                key={q.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                onClick={() => navigate(q.key)}
                className="card-lux p-4 md:p-6 text-start group"
              >
                <span className="inline-flex items-center justify-center size-10 md:size-12 rounded-2xl bg-accent text-gold mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="size-5 md:size-6" />
                </span>
                <p className="font-bold text-sm md:text-base">{q.title}</p>
                <p className="text-muted-foreground text-xs mt-1 leading-5 hidden md:block">{q.desc}</p>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* ===== آمار ===== */}
      <StatsBand />

      {/* ===== پروژه‌های شاخص ===== */}
      <section className="container mx-auto max-w-6xl px-4 py-12" aria-label="پروژه‌های شاخص">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="section-label">نمونه‌کارها</span>
            <h2 className="title-line text-2xl md:text-3xl font-extrabold mt-2">پروژه‌های شاخص</h2>
          </div>
          <Button variant="link" onClick={() => navigate('projects')} className="text-gold hidden sm:inline-flex">
            همه پروژه‌ها ←
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <button key={p.slug} onClick={() => navigate('project', p.slug)} className="card-lux overflow-hidden text-start group">
              <div className="relative h-44 md:h-48 overflow-hidden">
                <img
                  src={p.coverImage}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {p.category === 'in-progress' && (
                  <span className="absolute top-3 start-3 rounded-full px-3 py-1 text-[0.68rem] font-bold glass border border-gold/40 text-gold">
                    در حال اجرا
                  </span>
                )}
                <span className="absolute bottom-3 start-3 text-white text-sm font-bold drop-shadow">{p.title}</span>
              </div>
              <div className="p-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="size-3.5 text-gold" />{p.location}</span>
                {p.status && <span className="ms-auto text-[0.68rem]">{p.status}</span>}
              </div>
            </button>
          ))}
          {projects.length === 0 && <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>}
        </div>

        <Button variant="outline" onClick={() => navigate('projects')} className="sm:hidden mt-4 w-full rounded-xl">
          همه پروژه‌ها
        </Button>
      </section>

      {/* ===== فروش ===== */}
      {saleProjects.length > 0 && (
        <section className="border-y border-border bg-card/30 glass" aria-label="املاک در فروش">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="section-label">فرصت سرمایه‌گذاری</span>
                <h2 className="title-line text-2xl md:text-3xl font-extrabold mt-2">املاک در فروش</h2>
              </div>
              <Button variant="link" onClick={() => navigate('sale')} className="text-gold hidden sm:inline-flex">
                بخش فروش ←
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {saleProjects.map((p) => (
                <button key={p.slug} onClick={() => navigate('sale')} className="card-lux overflow-hidden text-start group">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-3 end-3 gold-btn rounded-full px-3 py-1 text-[0.7rem] font-bold">
                      {p.salePrice}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm leading-6">{p.title}</p>
                    <p className="text-muted-foreground text-xs mt-1.5 flex items-center gap-1">
                      <MapPin className="size-3.5 text-gold" /> {p.location}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== آخرین اخبار ===== */}
      <section className="container mx-auto max-w-6xl px-4 py-12" aria-label="آخرین اخبار">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="section-label">بازار و سیاست</span>
            <h2 className="title-line text-2xl md:text-3xl font-extrabold mt-2">آخرین اخبار</h2>
          </div>
          <Button variant="link" onClick={() => navigate('news')} className="text-gold hidden sm:inline-flex">
            همه اخبار ←
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((n) => (
            <button key={n.id} onClick={() => navigate('news')} className="card-lux overflow-hidden text-start group">
              <div className="relative h-36 overflow-hidden">
                <img
                  src={n.coverImage || ''}
                  alt={n.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span className="absolute top-3 end-3 glass border border-border rounded-full px-3 py-1 text-[0.68rem] text-gold font-semibold">
                  {NEWS_CATEGORY[n.category]}
                </span>
              </div>
              <div className="p-4">
                <p className="font-bold text-sm leading-6 line-clamp-2">{n.title}</p>
                <p className="text-muted-foreground text-xs mt-2">{formatJalali(new Date(n.date))}</p>
              </div>
            </button>
          ))}
          {news.length === 0 && <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>}
        </div>
      </section>

      {/* ===== وبلاگ ===== */}
      {posts.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 pb-12" aria-label="وبلاگ فنی">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="section-label">دانش ساخت</span>
              <h2 className="title-line text-2xl md:text-3xl font-extrabold mt-2">از وبلاگ فنی</h2>
            </div>
            <Button variant="link" onClick={() => navigate('blog')} className="text-gold hidden sm:inline-flex">
              همه مطالب ←
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((b) => (
              <button key={b.id} onClick={() => navigate('blog')} className="card-lux overflow-hidden text-start group">
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={b.coverImage || ''}
                    alt={b.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <span className="absolute bottom-3 end-3 glass border border-border rounded-full px-2.5 py-1 text-[0.65rem] text-gold font-semibold flex items-center gap-1">
                    <BookOpen className="size-3" /> {toFaDigits(b.readMinutes)} دقیقه
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm leading-6 line-clamp-2">{b.title}</p>
                  <p className="text-muted-foreground text-xs mt-2 leading-5 line-clamp-2">{b.excerpt}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== تماس ===== */}
      <section className="container mx-auto max-w-6xl px-4 pb-16" aria-label="تماس با ما">
        <div className="card-lux p-8 md:p-10 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{ background: 'radial-gradient(600px 300px at 50% 0%, color-mix(in srgb, var(--gold) 16%, transparent), transparent 70%)' }}
          />
          <h2 className="text-2xl md:text-3xl font-extrabold">پروژه‌ای در ذهن دارید؟</h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 leading-8 max-w-xl mx-auto">
            از برآورد اولیه تا مشاوره سرمایه‌گذاری و فروش ملک، تیم نیکا بنا کنار شماست.
            مشهد — <span dir="ltr" className="font-semibold text-gold">0915 206 1541</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('consulting')} className="gold-btn rounded-full px-7 py-6 text-sm font-bold">
              <TrendingUp className="size-4" /> مشاوره سرمایه‌گذاری
            </Button>
            <Button
              onClick={() => navigate('collaborate')}
              variant="outline"
              className="rounded-full px-7 py-6 text-sm glass border-border hover:border-gold/60"
            >
              <Handshake className="size-4 text-gold" /> همکاری با ما
            </Button>
            <a
              href="tel:+989152061541"
              className="inline-flex items-center gap-2 rounded-full px-7 py-6 text-sm glass border-border hover:border-gold/60 transition-colors"
            >
              <Phone className="size-4 text-gold" /> تماس مستقیم
            </a>
          </div>
          <Badge variant="secondary" className="mt-6 text-[0.65rem]">مشهد، خراسان رضوی</Badge>
        </div>
      </section>
    </div>
  )
}
