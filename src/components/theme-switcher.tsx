'use client'

import { useEffect } from 'react'
import { useAppStore, type ThemeName } from '@/lib/store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Palette, Moon, Sun, Sunset, Gem } from 'lucide-react'

const THEMES: { id: ThemeName; label: string; icon: React.ElementType; swatch: string }[] = [
  { id: 'navy', label: 'سورمه‌ای-نارنجی', icon: Gem, swatch: 'linear-gradient(135deg,#0a1424 55%,#ff8a3d 55%)' },
  { id: 'dark', label: 'تیره لوکس', icon: Moon, swatch: 'linear-gradient(135deg,#0a0a0f 55%,#d4a531 55%)' },
  { id: 'light', label: 'روشن', icon: Sun, swatch: 'linear-gradient(135deg,#faf7f0 55%,#9c7a14 55%)' },
  { id: 'pastel', label: 'گرم پاستلی', icon: Sunset, swatch: 'linear-gradient(135deg,#f6ece2 55%,#c1764a 55%)' },
]

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    try {
      const saved =
        (localStorage.getItem('nikabana-theme') as ThemeName | null) ||
        ((localStorage.getItem('mojarrad-theme') as ThemeName | null) ?? 'navy')
      if (saved && ['dark', 'light', 'pastel', 'navy'].includes(saved)) {
        const root = document.documentElement
        root.classList.remove('theme-dark', 'theme-light', 'theme-pastel', 'theme-navy')
        root.classList.add(`theme-${saved}`)
        useAppStore.setState({ theme: saved })
      }
    } catch {}
  }, [])

  const CurrentIcon = THEMES.find((t) => t.id === theme)?.icon || Palette

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? 'icon' : 'sm'}
          className="glass border-border hover:border-gold/60 rounded-full"
          aria-label="انتخاب تم رنگی"
        >
          <CurrentIcon className="size-4 text-gold" />
          {!compact && <span className="text-xs">تم</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass rounded-xl border-border min-w-[190px]">
        {THEMES.map((t) => {
          const Icon = t.icon
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`gap-2.5 rounded-lg ${theme === t.id ? 'text-gold' : ''}`}
            >
              <span
                className="size-5 rounded-full border border-border shrink-0"
                style={{ background: t.swatch }}
                aria-hidden
              />
              {t.label}
              {theme === t.id && <span className="ms-auto size-1.5 rounded-full bg-gold" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
