'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { SectionHeading } from '@/components/section-heading'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Truck, HardHat, CheckCircle2, Loader2, Send, Package, Wrench } from 'lucide-react'

function PartnerForm({ type }: { type: 'supplier' | 'contractor' }) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [field, setField] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !field.trim()) {
      toast.error('نام، شماره تماس و حوزه فعالیت الزامی است')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, company, phone, field, message }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('اطلاعات شما ثبت شد؛ پس از بررسی با شما تماس می‌گیریم')
      setName(''); setCompany(''); setPhone(''); setField(''); setMessage('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldOptions =
    type === 'supplier'
      ? ['بتن آماده', 'میلگرد و فولاد', 'آجر و بلوک', 'سیمان و گچ', 'سنگ و نما', 'تاسیسات (برقی/مکانیکی)', 'کابینت و دکوراسیون', 'سایر']
      : ['اسکلت‌بندی و آرماتور', 'قالب‌بندی و بتن‌ریزی', 'نماکوبی', 'تاسیسات مکانیکی', 'تاسیسات برقی', 'گچ‌کاری و نقاشی', 'کف‌سازی و پارکت', 'سایر']

  return (
    <div className="card-lux p-6 max-w-2xl">
      <h3 className="font-extrabold text-base flex items-center gap-2">
        <Send className="size-4 text-gold" /> ثبت اطلاعات برای همکاری
      </h3>
      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div>
          <Label className="text-xs mb-1.5 block">نام و نام خانوادگی *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام شما" className="bg-background rounded-xl" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">شماره تماس *</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۲..." inputMode="tel" className="bg-background rounded-xl" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">نام شرکت / مجموعه</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="اختیاری" className="bg-background rounded-xl" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">حوزه فعالیت *</Label>
          <div className="flex flex-wrap gap-1.5">
            {fieldOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setField(f)}
                className={`rounded-full px-3 py-1.5 text-[0.68rem] transition-all ${
                  field === f
                    ? 'gold-btn'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {field === f && <CheckCircle2 className="size-3 inline ms-0.5" />}
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1.5 block">توضیحات (اختیاری)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="سابقه همکاری، ظرفیت تولید یا اجرا، سوابق پروژه..."
            rows={3}
            className="bg-background rounded-xl resize-none"
          />
        </div>
      </div>
      <Button onClick={submit} disabled={submitting} className="gold-btn rounded-full mt-5">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        ارسال اطلاعات
      </Button>
    </div>
  )
}

export function CollaborateView() {
  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 flex-1">
      <SectionHeading
        label="همکاری با ما"
        title="زنجیره‌ای از شرکای قابل‌اعتماد"
        description="ما با تامین‌کنندگان و پیمانکاران فنی حرفه‌ای کار می‌کنیم؛ اگر به کیفیت و زمان‌بندی پایبندید، جای شما در این زنجیره خالی است."
      />

      <Tabs defaultValue="supplier" dir="rtl">
        <TabsList className="glass rounded-full p-1 h-auto mb-6">
          <TabsTrigger value="supplier" className="rounded-full px-4 py-2 data-[state=active]:gold-btn data-[state=active]:text-primary-foreground text-xs md:text-sm gap-1.5">
            <Package className="size-4" /> به عنوان تامین‌کننده
          </TabsTrigger>
          <TabsTrigger value="contractor" className="rounded-full px-4 py-2 data-[state=active]:gold-btn data-[state=active]:text-primary-foreground text-xs md:text-sm gap-1.5">
            <HardHat className="size-4" /> به عنوان پیمانکار فنی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supplier" className="mt-0">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
            <div className="card-lux p-6">
              <span className="inline-flex size-12 rounded-2xl bg-accent items-center justify-center text-gold mb-4">
                <Truck className="size-6" />
              </span>
              <h3 className="font-extrabold">تامین‌کنندگان</h3>
              <p className="text-muted-foreground text-sm leading-7 mt-3">
                برای پروژه‌های در حال اجرا به تامین منظم و باکیفیت نیاز داریم. اگر تولیدکننده یا عرضه‌کننده
                مصالح هستید، شرایط ساده ما را ببینید:
              </p>
              <ul className="mt-4 space-y-2.5">
                {['فاکتور رسمی و اسناد اصالت کالا', 'کیفیت مطابق استاندارد و نمونه‌دهی', 'تحویل به‌موقع طبق برنامه پروژه', 'پرداخت منظم توافقی'].map((c) => (
                  <li key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-gold shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <PartnerForm type="supplier" />
          </div>
        </TabsContent>

        <TabsContent value="contractor" className="mt-0">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
            <div className="card-lux p-6">
              <span className="inline-flex size-12 rounded-2xl bg-accent items-center justify-center text-gold mb-4">
                <Wrench className="size-6" />
              </span>
              <h3 className="font-extrabold">پیمانکاران فنی</h3>
              <p className="text-muted-foreground text-sm leading-7 mt-3">
                بخش‌های تخصصی پروژه‌ها را به پیمانکاران توانمند می‌سپاریم. آنچه برای ما مهم است:
              </p>
              <ul className="mt-4 space-y-2.5">
                {['سابقه اجرای مشابه و رضایت کارفرمای قبلی', 'نیروی فنی متخصص و مسلط به رشته خود', 'پایبندی به زمان‌بندی و ایمنی کارگاه', 'کیفیت اجرا طبق مشخصات فنی'].map((c) => (
                  <li key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-gold shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <PartnerForm type="contractor" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
