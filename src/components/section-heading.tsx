'use client'

import { useAppStore } from '@/lib/store'

export function SectionHeading({
  label,
  title,
  description,
  center = false,
}: {
  label: string
  title: string
  description?: string
  center?: boolean
}) {
  const navigate = useAppStore((s) => s.navigate)
  void navigate
  return (
    <div className={`mb-8 ${center ? 'text-center flex flex-col items-center' : ''}`}>
      <span className="section-label">{label}</span>
      <h2 className={`title-line text-2xl md:text-3xl font-extrabold mt-2 ${center ? '[&::after]:mx-auto' : ''}`}>
        {title}
      </h2>
      {description && <p className="text-muted-foreground text-sm md:text-base mt-4 leading-7 max-w-2xl max-w-full md:max-w-2xl">{description}</p>}
    </div>
  )
}
