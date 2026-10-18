'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { SectionHeading } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Map, ShieldAlert, Scale, Search, Loader2, Send } from 'lucide-react'

const SERVICES = [
  {
    icon: Map,
    title: 'تحلیل زمین و برآورد بازدهی',
    desc: 'بررسی موقعیت، کاربری و سقف اطلاعاتی زمین؛ برآورد واقع‌بینانه هزینه ساخت و درآمد پایان‌کار.',
  },
  {
    icon: ShieldAlert,
    title: 'مدیریت ریسک',
    desc: 'شناسایی ریسک‌های قیمتی، قانونی و اجرایی پروژه و تعریف راهکار کاهش آن‌ها پیش از شروع.',
  },
  {
    icon: Scale,
    title: 'مقایسه گزینه‌های سرمایه‌گذاری',
    desc: 'مقایسه چند مسیر (ساخت، خرید و نگهداری، مشارکت) بر اساس بازدهی، نقدینگی و افق زمانی شما.',
  },
]

const STEPS = [
  { n: '۱', title: 'جلسه اولیه', desc: 'شناخت هدف، بودجه و افق سرمایه‌گذاری شما' },
  { n: '۲', title: 'تحلیل فنی', desc: 'بررسی زمین یا پروژه و برآورد اعداد واقعی' },
  { n: '۳', title: 'گزارش تصمیم', desc: 'تحلیل ریسک و بازدهی با زبان ساده' },
  { n: '۴', title: 'شروع مسیر', desc: 'ورود به فاز ساخت با پایش شفاف تایم‌لاین' },
]

export function ConsultingView() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [topic, setTopic] = useState('buy-land')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('نام و شماره تماس را وارد کنید')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'consulting', name, phone, field: topic, message }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('درخواست شما ثبت شد؛ کارشناسان ما به‌زودی تماس می‌گیرند')
      setName(''); setPhone(''); setMessage(''); setTopic('buy-land')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت درخواست')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
      <SectionHeading
        label="مشاوره سرمایه‌گذاری"
        title="پیش از ساختن، درست تصمیم بگیرید"
        description="سرمایه‌گذاری ساختمانی بدون تحلیل، قمار است. ما با اعداد و تجربه دو دهه، مسیر تصمیم شما را روشن می‌کنیم."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {SERVICES.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-lux p-5"
            >
              <span className="inline-flex size-12 rounded-2xl bg-accent items-center justify-center text-gold mb-3">
                <Icon className="size-6" />
              </span>
              <p className="font-bold text-sm">{s.title}</p>
              <p className="text-muted-foreground text-xs leading-6 mt-2">{s.desc}</p>
            </motion.div>
          )
        })}
      </div>

      {/* فرآیند */}
      <div className="mb-12">
        <span className="section-label">مسیر همکاری</span>
        <h3 className="font-extrabold text-xl mt-2 mb-6">در ۴ قدم تا تصمیم</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((st, i) => (
            <motion.div
              key={st.n}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-lux p-4 relative"
            >
              <span className="absolute top-3 end-3 gold-text font-extrabold text-2xl opacity-30">{st.n}</span>
              <p className="font-bold text-sm mt-1">{st.title}</p>
              <p className="text-muted-foreground text-[0.7rem] leading-5 mt-1.5">{st.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* فرم */}
      <div className="card-lux p-6 md:p-8 max-w-2xl mx-auto relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--hero-grad)' }} />
        <div className="relative">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Send className="size-5 text-gold" /> درخواست مشاوره
          </h3>
          <p className="text-muted-foreground text-xs leading-6 mt-2 mb-6">
            فرم زیر را پر کنید؛ تیم مشاوره حداکثر ظرف یک روز کاری با شما تماس می‌گیرد. جلسه اولیه معرفی، رایگان است.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">نام و نام خانوادگی *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام شما" className="bg-background rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">شماره تماس *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲..."
                inputMode="tel"
                className="bg-background rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1.5 block">موضوع مشاوره</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy-land">خرید زمین برای ساخت</SelectItem>
                  <SelectItem value="build">شروع پروژه ساخت</SelectItem>
                  <SelectItem value="sale">فروش یا مشارکت در ساخت</SelectItem>
                  <SelectItem value="other">سایر موارد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1.5 block">توضیحات (اختیاری)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="کمی درباره زمین، پروژه یا سوال خود توضیح دهید..."
                rows={3}
                className="bg-background rounded-xl resize-none"
              />
            </div>
          </div>

          <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full mt-6 w-full sm:w-auto px-8">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            ثبت درخواست مشاوره
          </Button>
        </div>
      </div>
    </div>
  )
}
