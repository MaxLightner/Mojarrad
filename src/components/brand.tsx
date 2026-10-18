'use client'

import { useAppStore } from '@/lib/store'

export function Brand({ size = 'md', showTagline = false }: { size?: 'md' | 'lg'; showTagline?: boolean }) {
  const navigate = useAppStore((s) => s.navigate)
  const dim = size === 'lg' ? 44 : 34

  return (
    <button
      onClick={() => navigate('home')}
      className="flex items-center gap-3 group"
      aria-label="گروه ساختمانی نیکا بنا — صفحه اصلی"
    >
      <svg width={dim} height={dim} viewBox="0 0 64 64" className="shrink-0 transition-transform duration-300 group-hover:scale-105" aria-hidden>
        <defs>
          <linearGradient id="brandg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--gold-soft)" />
            <stop offset="1" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="14" fill="none" stroke="url(#brandg)" strokeWidth="2.5" />
        <path d="M32 14 L48 23 V48 H38 V36 H26 V48 H16 V23 Z" fill="url(#brandg)" />
        <rect x="21" y="27" width="4.5" height="4.5" fill="var(--background)" rx="1" />
        <rect x="29.75" y="27" width="4.5" height="4.5" fill="var(--background)" rx="1" />
        <rect x="38.5" y="27" width="4.5" height="4.5" fill="var(--background)" rx="1" />
      </svg>
      <span className="flex flex-col items-start leading-tight text-start">
        <span className={`font-extrabold ${size === 'lg' ? 'text-xl' : 'text-base'} text-foreground`}>
          گروه ساختمانی <span className="gold-text">نیکا بنا</span>
        </span>
        {showTagline && (
          <span className="text-[0.68rem] text-muted-foreground mt-0.5 tracking-wide">
            ساخت با دقت، اعتماد با شفافیت
          </span>
        )}
      </span>
    </button>
  )
}
