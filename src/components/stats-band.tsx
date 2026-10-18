'use client'

/* نوار آمار گروه — مشترک بین خانه و صفحهٔ پروژه‌ها */

import { motion } from 'framer-motion'

const STATS = [
  { value: '۲۰+', label: 'سال تجربه اجرا' },
  { value: '۳۰+', label: 'پروژه اجرا و تحویل‌شده' },
  { value: '۷۵٬۰۰۰', label: 'متر مربع ساخت' },
  { value: '۹۸٪', label: 'رضایت مالکان' },
]

export function StatsBand() {
  return (
    <section className="border-y border-border bg-card/30 glass" aria-label="آمار گروه">
      <div className="container mx-auto max-w-6xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center"
          >
            <p className="gold-text text-3xl md:text-4xl font-extrabold">{s.value}</p>
            <p className="text-muted-foreground text-xs mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
