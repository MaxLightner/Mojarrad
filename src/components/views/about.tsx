'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { SectionHeading } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { Eye, Clock, Award, ShieldCheck, ArrowLeft } from 'lucide-react'

const VALUES = [
  {
    icon: Eye,
    title: 'شفافیت با مالک',
    desc: 'گزارش‌های منظم از روند اجرا، هزینه‌ها و وقایع کارگاه بدون فیلتر؛ مالک همیشه در جریان واقعی پروژه است.',
  },
  {
    icon: Clock,
    title: 'پایبندی به زمان‌بندی',
    desc: 'برنامه‌ریزی مرحله‌ای و ثبت روزانه رویدادها؛ اگر تأخیری رخ دهد، علت آن و برنامه جبران مستند می‌شود.',
  },
  {
    icon: Award,
    title: 'کیفیت اجرا',
    desc: 'تسلط بر مصالح و جزئیات اجرایی مطابق استانداردهای روز؛ کنترل کیفیت پیش از بستن هر مرحله.',
  },
  {
    icon: ShieldCheck,
    title: 'ایمنی کارگاه',
    desc: 'بیمه کامل نیروها، تجهیزات حفاظت فردی و رعایت الزامات ایمنی در تمام طول اجرا.',
  },
]

const TEAM = [
  { name: 'مهندس حسین مجرد', role: 'بنیان‌گذار و مدیرعامل' },
  { name: 'مهندس امیر کاظمی', role: 'مدیر فنی و اجرا' },
  { name: 'مهندس مهدی رستمی', role: 'سرپرست دفتر فنی' },
]

export function AboutView() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
      <SectionHeading
        label="درباره ما"
        title="دو دهه ساختنِ اعتماد — مهندس حسین مجرد"
        description="گروه ساختمانی نیکا بنا به مدیریت مهندس حسین مجرد، از یک دفتر کوچک مهندسی در مشهد آغاز شد و امروز مجموعه‌ای از مهندسان، مجریان و متخصصان اجراست که پروژه‌های لوکس مسکونی و ویلا را از ایده تا پایان‌کار همراهی می‌کند."
      />

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 text-sm md:text-base leading-8 text-muted-foreground"
        >
          <p>
            باور ما ساده است: ساخت‌وساز در ایران بیش از آنکه به مشکل فنی نیاز داشته باشد، به
            <span className="text-gold font-semibold"> نظم و شفافیت </span>
            نیاز دارد. پروژه‌های کوچک و متوسط معمولاً نه به دلیل ضعف فناوری، بلکه به خاطر نبود مستندسازی، گزارش‌دهی نامنظم و
            قفل‌شدن اطلاعات در ذهن افراد دچار تأخیر و هزینه اضافی می‌شوند.
          </p>
          <p>
            در گروه نیکا بنا هر پروژه یک «دفتر دیجیتال» دارد: تایم‌لاین رویدادها، اسناد و مجوزها، وضعیت پیمانکاری و
            گزارش‌های دوره‌ای — همه در یک سامانه ثبت و در سطوح دسترسی مشخص در اختیار مالک، ناظر و تیم اجرا قرار می‌گیرد.
          </p>
          <p>
            نتیجه؟ مالک بدون نیاز به حضور مدام در کارگاه، تصویری واقعی از پروژه خود دارد؛ مهندس ناظر شفافیت کامل
            اجرا را می‌بیند و تیم اجرا با ابزارهای ساده، کارگاه را مثل یک خط تولید مدیریت می‌کند. دفتر مرکزی گروه در مشهد است و
            پروژه‌های در حال اجرا در طرقبه، زشک و کاهو پیگیری می‌شود.
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
            <Button onClick={() => navigate('projects')} className="gold-btn rounded-full">
              <ArrowLeft className="size-4" /> مشاهده پروژه‌ها
            </Button>
            <Button onClick={() => navigate('collaborate')} variant="outline" className="rounded-full glass">
              همکاری با ما
            </Button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-3">
          {VALUES.map((v, i) => {
            const Icon = v.icon
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-lux p-5"
              >
                <span className="inline-flex size-11 rounded-2xl bg-accent items-center justify-center text-gold mb-3">
                  <Icon className="size-5" />
                </span>
                <p className="font-bold text-sm">{v.title}</p>
                <p className="text-muted-foreground text-xs leading-6 mt-2">{v.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="mt-14">
        <span className="section-label">تیم کلیدی</span>
        <h3 className="text-xl md:text-2xl font-extrabold mt-2 mb-6">چه کسانی پشت پروژه‌ها هستند؟</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {TEAM.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-lux p-5 flex items-center gap-4"
            >
              <span className="flex size-14 rounded-2xl items-center justify-center gold-btn font-extrabold text-lg shrink-0">
                {t.name.replace('مهندس ', '').slice(0, 2)}
              </span>
              <div>
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-muted-foreground text-xs mt-1">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
