'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { SectionHeading } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { MapPin, Tag, BedDouble, Ruler, Handshake, Loader2, CheckCircle2 } from 'lucide-react'

type SaleProject = {
  slug: string
  title: string
  subtitle: string | null
  location: string
  area: string
  year: string
  coverImage: string
  salePrice: string | null
  saleDescription: string | null
}

export function SaleView() {
  const navigate = useAppStore((s) => s.navigate)
  const [projects, setProjects] = useState<SaleProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects((d.projects || []).filter((p: SaleProject & { forSale: boolean }) => p.forSale)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
      <SectionHeading
        label="فرصت‌های سرمایه‌گذاری"
        title="املاک در فروش"
        description="پروژه‌های تکمیل‌شده گروه نیکا بنا که آماده بازدید و انتقال سند هستند؛ همراه با فرم همکاری در فروش برای مشاوران املاک."
      />

      {loading ? (
        <div className="grid md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-lux h-80 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card-lux p-10 text-center text-muted-foreground text-sm">
          در حال حاضر ملکی برای فروش موجود نیست؛ به‌زودی معرفی می‌شود.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {projects.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: Math.min(i * 0.06, 0.25) }}
              className="card-lux overflow-hidden group"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={p.coverImage}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                {p.salePrice && (
                  <span className="absolute bottom-3 end-3 gold-btn rounded-full px-4 py-1.5 text-sm font-extrabold shadow-lg">
                    {p.salePrice}
                  </span>
                )}
                <div className="absolute bottom-3 start-4 text-white">
                  <p className="font-extrabold text-base drop-shadow">{p.title}</p>
                  <p className="text-[0.72rem] text-white/85 mt-0.5">{p.subtitle}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 text-gold" /> {p.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Ruler className="size-3.5 text-gold" /> {p.area}
                  </span>
                </div>
                {p.saleDescription && (
                  <p className="text-muted-foreground text-xs md:text-sm leading-7 mt-3">{p.saleDescription}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="gold-btn rounded-full flex-1" onClick={() => window.open('tel:+989152061541')}>
                    <Tag className="size-3.5" /> هماهنگی بازدید
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full flex-1" onClick={() => navigate('project', p.slug)}>
                    <BedDouble className="size-3.5" /> جزئیات پروژه
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <SaleCoopForm />
    </div>
  )
}

function SaleCoopForm() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [field, setField] = useState('مشاور املاک')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('نام و شماره تماس الزامی است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sale', name, phone, company, field, message }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setDone(true)
      toast.success('درخواست همکاری در فروش ثبت شد')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت درخواست')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-14" aria-label="همکاری در فروش">
      <div className="card-lux p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex size-11 rounded-2xl gold-btn items-center justify-center shrink-0">
            <Handshake className="size-5" />
          </span>
          <div>
            <h2 className="font-extrabold text-lg">همکاری در فروش</h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              مشاور املاک هستید یا مشتری مناسب یکی از ملک‌های ما را می‌شناسید؟ ثبت کنید — پورسانت پس از انعقاد معامله تسویه می‌شود.
            </p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-12 text-gold" />
            <p className="font-bold text-sm">درخواست شما ثبت شد؛ کارشناس فروش گروه با شما تماس می‌گیرد.</p>
            <Button variant="outline" className="rounded-full" onClick={() => setDone(false)}>
              ثبت درخواست جدید
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 mt-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block">نام و نام خانوادگی *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: محمد رضایی" className="bg-background rounded-xl" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">شماره تماس *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0915..." dir="ltr" className="bg-background rounded-xl" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block">شرکت / مشاوره املاک (اختیاری)</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="نام مشاوره املاک" className="bg-background rounded-xl" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">حوزه همکاری</Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مشاور املاک">مشاور املاک</SelectItem>
                    <SelectItem value="معرف ملک">معرف ملک</SelectItem>
                    <SelectItem value="سرمایه‌گذار">سرمایه‌گذار</SelectItem>
                    <SelectItem value="سایر">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">توضیحات</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ملک موردنظر، منطقه فعالیت شما یا شرایط پیشنهادی‌تان را بنویسید..."
                rows={3}
                className="bg-background rounded-xl resize-none"
              />
            </div>
            <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full w-full sm:w-auto sm:px-10">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Handshake className="size-4" />}
              ثبت درخواست همکاری
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
