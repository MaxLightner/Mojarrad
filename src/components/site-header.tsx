'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Brand } from '@/components/brand'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LogIn, Menu, LayoutDashboard, LogOut, ChevronDown, ShieldCheck } from 'lucide-react'

const NAV_ITEMS: {
  key: 'about' | 'projects' | 'sale' | 'news' | 'blog' | 'officials' | 'consulting' | 'collaborate'
  label: string
}[] = [
  { key: 'projects', label: 'پروژه‌ها' },
  { key: 'sale', label: 'فروش' },
  { key: 'news', label: 'اخبار' },
  { key: 'blog', label: 'وبلاگ' },
  { key: 'officials', label: 'مسئولین' },
  { key: 'about', label: 'درباره ما' },
  { key: 'consulting', label: 'مشاوره' },
  { key: 'collaborate', label: 'همکاری' },
]

export function SiteHeader() {
  const { view, navigate, user, setUser } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (key: string) =>
    view.name === key || (key === 'projects' && view.name === 'project') || (key === 'sale' && view.name === 'sale')

  const logout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
    } catch {}
    setUser(null)
    navigate('home')
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-border py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto max-w-6xl px-4 flex items-center gap-3">
        <Brand />

        <nav className="hidden lg:flex items-center gap-0.5 mx-auto" aria-label="ناوبری اصلی">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`px-3 py-2 rounded-full text-[0.83rem] transition-colors ${
                isActive(item.key)
                  ? 'text-gold bg-accent font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 ms-auto lg:ms-0">
          <ThemeSwitcher compact />

          {user ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="glass rounded-full max-w-[170px] border-border hover:border-gold/60">
                  <ShieldCheck className="size-4 text-gold shrink-0" />
                  <span className="truncate text-xs font-semibold">{user.fullName}</span>
                  <ChevronDown className="size-3.5 opacity-60 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass rounded-xl border-border min-w-44">
                <DropdownMenuItem onClick={() => navigate('dashboard')} className="gap-2 rounded-lg">
                  <LayoutDashboard className="size-4" /> پنل من
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="gap-2 rounded-lg text-destructive">
                  <LogOut className="size-4" /> خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate('login')}
              className="gold-btn rounded-full hidden sm:inline-flex"
              size="sm"
            >
              <LogIn className="size-4" /> ورود اعضا
            </Button>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden glass rounded-full border-border" aria-label="منو">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass w-72 border-s border-border p-5 flex flex-col gap-1">
              <SheetTitle className="sr-only">منوی ناوبری</SheetTitle>
              <div className="mb-3">
                <Brand />
              </div>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.key)
                    setMenuOpen(false)
                  }}
                  className={`text-start px-4 py-3 rounded-xl text-sm transition-colors ${
                    isActive(item.key) ? 'text-gold bg-accent font-semibold' : 'hover:bg-accent/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-border my-2" />
              {user ? (
                <>
                  <button
                    onClick={() => {
                      navigate('dashboard')
                      setMenuOpen(false)
                    }}
                    className="text-start px-4 py-3 rounded-xl text-sm hover:bg-accent/50 flex items-center gap-2"
                  >
                    <LayoutDashboard className="size-4" /> پنل من
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      setMenuOpen(false)
                    }}
                    className="text-start px-4 py-3 rounded-xl text-sm text-destructive hover:bg-accent/50 flex items-center gap-2"
                  >
                    <LogOut className="size-4" /> خروج
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    navigate('login')
                    setMenuOpen(false)
                  }}
                  className="gold-btn rounded-xl mt-2"
                >
                  <LogIn className="size-4" /> ورود اعضا
                </Button>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
