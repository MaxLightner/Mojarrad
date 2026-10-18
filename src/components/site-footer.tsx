'use client'

import { useAppStore } from '@/lib/store'
import { Phone, Mail, MapPin } from 'lucide-react'

export function SiteFooter() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <footer className="mt-auto border-t border-border bg-card/40 glass">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-start">
          <div className="flex-1">
            <p className="font-extrabold text-base">
              گروه ساختمانی <span className="gold-text">نیکا بنا</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-6">
              ساخت با دقت، اعتماد با شفافیت — از طراحی تا پایان‌کار، همراه شما
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm" aria-label="ناوبری فوتر">
            <button onClick={() => navigate('about')} className="text-muted-foreground hover:text-gold transition-colors">
              درباره ما
            </button>
            <button onClick={() => navigate('projects')} className="text-muted-foreground hover:text-gold transition-colors">
              پروژه‌ها
            </button>
            <button onClick={() => navigate('sale')} className="text-muted-foreground hover:text-gold transition-colors">
              فروش
            </button>
            <button onClick={() => navigate('news')} className="text-muted-foreground hover:text-gold transition-colors">
              اخبار
            </button>
            <button onClick={() => navigate('blog')} className="text-muted-foreground hover:text-gold transition-colors">
              وبلاگ
            </button>
            <button onClick={() => navigate('officials')} className="text-muted-foreground hover:text-gold transition-colors">
              مسئولین
            </button>
            <button onClick={() => navigate('consulting')} className="text-muted-foreground hover:text-gold transition-colors">
              مشاوره
            </button>
            <button onClick={() => navigate('collaborate')} className="text-muted-foreground hover:text-gold transition-colors">
              همکاری
            </button>
          </nav>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 justify-center md:justify-start">
              <MapPin className="size-3.5 text-gold" /> مشهد، ایران
            </span>
            <a
              href="tel:+989152061541"
              className="flex items-center gap-1.5 justify-center md:justify-start hover:text-gold transition-colors"
              dir="ltr"
            >
              <Phone className="size-3.5 text-gold" /> <span className="font-mono">0915 206 1541</span>
            </a>
            <span className="flex items-center gap-1.5 justify-center md:justify-start">
              <Mail className="size-3.5 text-gold" /> info@nikabana.ir
            </span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border text-center text-[0.7rem] text-muted-foreground">
          © ۱۴۰۵ گروه ساختمانی نیکا بنا — تمامی حقوق محفوظ است
        </div>
      </div>
    </footer>
  )
}
