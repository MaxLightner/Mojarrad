'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/section-heading'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatJalali, toFaDigits } from '@/lib/jalali'
import { BookOpen, Clock3, Layers } from 'lucide-react'

type Post = {
  id: string
  slug: string
  title: string
  category: string
  excerpt: string
  content: string
  coverImage: string | null
  readMinutes: number
  date: string
}

const CATEGORY_COLOR: Record<string, string> = {
  'مصالح': '#10b981',
  'برق و تاسیسات': '#38bdf8',
  'ایزولاسیون': '#a78bfa',
  'سازه': '#f59e0b',
  'نازک‌کاری': '#fb7185',
}

export function BlogView() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Post | null>(null)

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
      <SectionHeading
        label="دانش ساخت"
        title="وبلاگ تخصصی ساخت"
        description="تکنولوژی‌ها و روش‌هایی که در پروژه‌های گروه نیکا بنا واقعاً استفاده می‌کنیم؛ از هبلکس و تاسیسات برق تا عایق رطوبتی و آسانسور."
      />

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-lux h-72 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">هنوز مطلبی منتشر نشده است.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: Math.min(i * 0.05, 0.25) }}
              onClick={() => setSelected(p)}
              className="card-lux overflow-hidden text-start group cursor-pointer"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={p.coverImage || ''}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span
                  className="absolute top-3 end-3 glass border border-border rounded-full px-3 py-1 text-[0.68rem] font-bold"
                  style={{ color: CATEGORY_COLOR[p.category] || 'var(--gold)' }}
                >
                  {p.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm md:text-base leading-7 line-clamp-2 group-hover:text-gold transition-colors">
                  {p.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-6 mt-2 line-clamp-3">{p.excerpt}</p>
                <div className="flex items-center gap-4 text-[0.68rem] text-muted-foreground mt-3">
                  <span className="flex items-center gap-1"><Clock3 className="size-3 text-gold" /> {toFaDigits(p.readMinutes)} دقیقه مطالعه</span>
                  <span className="flex items-center gap-1"><Layers className="size-3 text-gold" /> {formatJalali(new Date(p.date), { short: true })}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* پاپ‌آپ مطلب */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent dir="rtl" className="max-w-2xl p-0 overflow-hidden bg-card border-border max-h-[88dvh] flex flex-col">
          {selected && (
            <>
              <div className="relative h-44 shrink-0">
                <img src={selected.coverImage || ''} alt={selected.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-transparent" />
              </div>
              <DialogHeader className="px-6 pt-4 pb-2 shrink-0">
                <span
                  className="inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-bold mb-2"
                  style={{ background: `${CATEGORY_COLOR[selected.category] || '#d4a531'}1a`, color: CATEGORY_COLOR[selected.category] || 'var(--gold)' }}
                >
                  <BookOpen className="size-3" /> {selected.category}
                </span>
                <DialogTitle className="text-lg font-extrabold leading-8">{selected.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 text-[0.7rem]">
                  <span className="flex items-center gap-1"><Clock3 className="size-3" /> {toFaDigits(selected.readMinutes)} دقیقه</span>
                  <span>{formatJalali(new Date(selected.date))}</span>
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 px-6 pb-6" dir="rtl">
                <div className="text-sm leading-9 whitespace-pre-line text-foreground/90">{selected.content}</div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
