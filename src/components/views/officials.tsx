'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/section-heading'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Building2, Landmark, University, Info } from 'lucide-react'

type Official = {
  id: string
  name: string
  role: string
  category: string
  description: string
  avatar: string | null
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  company: { label: 'مدیران گروه', icon: Building2, color: '#d4a531' },
  municipal: { label: 'شهرداری و نهادهای شهری', icon: Landmark, color: '#38bdf8' },
  provincial: { label: 'نهادهای استانی', icon: University, color: '#a78bfa' },
}

function initials(name: string) {
  const parts = name.replace('مهندس', '').replace('دکتر', '').trim().split(/\s+/)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
}

export function OfficialsView() {
  const [officials, setOfficials] = useState<Official[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Official | null>(null)

  useEffect(() => {
    fetch('/api/officials')
      .then((r) => r.json())
      .then((d) => setOfficials(d.officials || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const groups: { key: string; items: Official[] }[] = Object.keys(CATEGORY_META).map((key) => ({
    key,
    items: officials.filter((o) => o.category === key),
  }))

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
      <SectionHeading
        label="چهره‌ها"
        title="معرفی مسئولین"
        description="مدیران گروه نیکا بنا و مسئولان نهادهایی که در مسیر اخذ مجوز، نظارت و اجرای پروژه‌های مشهد با آن‌ها همکاری می‌کنیم."
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card-lux h-52 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : (
        groups.map(
          (g) =>
            g.items.length > 0 && (
              <section key={g.key} className="mb-10" aria-label={CATEGORY_META[g.key].label}>
                <div className="flex items-center gap-2.5 mb-4">
                  {(() => {
                    const Icon = CATEGORY_META[g.key].icon
                    return <Icon className="size-5 text-gold" />
                  })()}
                  <h2 className="font-extrabold text-base md:text-lg">{CATEGORY_META[g.key].label}</h2>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {g.items.map((o, i) => (
                    <motion.button
                      key={o.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ delay: Math.min(i * 0.05, 0.2) }}
                      onClick={() => setSelected(o)}
                      className="card-lux p-5 text-start group"
                    >
                      <span
                        className="inline-flex items-center justify-center size-14 rounded-2xl text-xl font-extrabold mb-3 group-hover:scale-105 transition-transform"
                        style={{
                          background: `color-mix(in srgb, ${CATEGORY_META[g.key].color} 16%, transparent)`,
                          color: CATEGORY_META[g.key].color,
                          border: `1px solid color-mix(in srgb, ${CATEGORY_META[g.key].color} 35%, transparent)`,
                        }}
                      >
                        {initials(o.name)}
                      </span>
                      <p className="font-bold text-sm leading-6 group-hover:text-gold transition-colors">{o.name}</p>
                      <p className="text-muted-foreground text-[0.72rem] leading-5 mt-1.5 line-clamp-2">{o.role}</p>
                    </motion.button>
                  ))}
                </div>
              </section>
            )
        )
      )}

      {/* پاپ‌آپ معرفی */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent dir="rtl" className="max-w-lg bg-card border-border p-0 overflow-hidden max-h-[85dvh] flex flex-col">
          {selected && (
            <>
              <div
                className="h-24 shrink-0 flex items-center justify-center"
                style={{
                  background: `radial-gradient(400px 200px at 50% 120%, color-mix(in srgb, ${CATEGORY_META[selected.category].color} 30%, transparent), transparent 70%)`,
                }}
              >
                <span
                  className="flex items-center justify-center size-16 rounded-3xl text-2xl font-extrabold -mt-6 border"
                  style={{
                    background: 'var(--card)',
                    color: CATEGORY_META[selected.category].color,
                    borderColor: `color-mix(in srgb, ${CATEGORY_META[selected.category].color} 40%, transparent)`,
                    boxShadow: 'var(--shadow-lux)',
                  }}
                >
                  {initials(selected.name)}
                </span>
              </div>
              <DialogHeader className="px-6 pt-3 pb-1 shrink-0 text-center items-center">
                <DialogTitle className="text-lg font-extrabold">{selected.name}</DialogTitle>
                <DialogDescription className="text-gold text-xs font-semibold">{selected.role}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 px-6 pb-6 pt-2" dir="rtl">
                <p className="text-sm leading-8 text-foreground/90 text-justify">{selected.description}</p>
                {selected.category !== 'company' && (
                  <p className="text-[0.68rem] text-muted-foreground leading-6 mt-3 flex items-start gap-1.5">
                    <Info className="size-3.5 shrink-0 mt-1 text-gold" />
                    معرفی نمونه برای دموی سایت — پیش از انتشار نهایی با اطلاعات رسمی به‌روزرسانی شود.
                  </p>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
