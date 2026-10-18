'use client'

/* ثبت سریع رکورد تایم‌لاین — چندثانیه‌ای
 * سه نوع: شروع مرحله | پایان مرحله | رویداد نقطه‌ای
 * انتخاب مرحله → عنوان خودکار → ثبت. توضیح و عکس اختیاری.
 */

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { STAGE_PRESETS, STAGE_GROUPS, autoStageTitle, type StageGroupId } from '@/lib/stages'
import { todayJalali, toFaDigits } from '@/lib/jalali'
import { Play, Square, Diamond, Loader2, Plus, ImagePlus, X, CalendarDays, ChevronDown } from 'lucide-react'

type Kind = 'stage_start' | 'stage_end' | 'point'

export type OpenStage = { stageKey: string; label: string; group: StageGroupId; startedAt: string }

export function QuickAddDialog({
  open,
  onOpenChange,
  projectId,
  openStages,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  projectId: string
  openStages: OpenStage[]
  onDone: () => void
}) {
  const [kind, setKind] = useState<Kind>('stage_start')
  const [stageKey, setStageKey] = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [pointCategory, setPointCategory] = useState('execution')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const [dateStr, setDateStr] = useState('') // YYYY/MM/DD شمسی اختیاری
  const [submitting, setSubmitting] = useState(false)

  const t = todayJalali()

  const openStageKeys = useMemo(() => new Set(openStages.map((s) => s.stageKey)), [openStages])

  // برای «پایان مرحله» مراحل باز اول لیست می‌آیند
  const presetList = useMemo(() => {
    if (kind === 'stage_end') {
      const open = STAGE_PRESETS.filter((s) => openStageKeys.has(s.key))
      const rest = STAGE_PRESETS.filter((s) => !openStageKeys.has(s.key))
      return [...open, ...rest]
    }
    return STAGE_PRESETS
  }, [kind, openStageKeys])

  const selectedPreset = STAGE_PRESETS.find((s) => s.key === stageKey)
  const selectedOpen = openStages.find((s) => s.stageKey === stageKey)

  const autoTitle = useMemo(() => {
    if (kind === 'point') return ''
    if (selectedPreset) return autoStageTitle(kind, selectedPreset.label)
    if (selectedOpen) return autoStageTitle(kind, selectedOpen.label)
    return ''
  }, [kind, selectedPreset, selectedOpen])

  const title = customTitle || autoTitle

  const ready =
    kind === 'point' ? title.trim().length > 0 || pointCategory !== '' : !!stageKey || title.trim().length > 0

  const reset = () => {
    setKind('stage_start')
    setStageKey(null)
    setCustomTitle('')
    setDescription('')
    setPhoto(null)
    setShowExtras(false)
    setShowDate(false)
    setDateStr('')
    setPointCategory('execution')
  }

  const submit = async () => {
    if (!ready) {
      toast.error(kind === 'point' ? 'عنوان رویداد را بنویسید' : 'مرحله را انتخاب کنید')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('kind', kind)
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      if (kind !== 'point') {
        fd.append('stageKey', stageKey || '')
        fd.append('stageGroup', (selectedPreset?.group || selectedOpen?.group || 'structure') as string)
      } else {
        fd.append('category', pointCategory)
      }
      if (photo) fd.append('images', photo)
      if (showDate && dateStr.trim()) {
        const [jy, jm, jd] = dateStr.split('/').map((x) => Number(x.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))))
        if (jy && jm && jd) {
          fd.append('jy', String(jy))
          fd.append('jm', String(jm))
          fd.append('jd', String(jd))
        }
      }
      const res = await fetch('/api/timeline', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('ثبت شد')
      reset()
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت رکورد')
    } finally {
      setSubmitting(false)
    }
  }

  const kindOptions: { id: Kind; label: string; icon: React.ElementType; hint: string }[] = [
    { id: 'stage_start', label: 'شروع مرحله', icon: Play, hint: 'مثلاً: گچکاری شروع شد' },
    { id: 'stage_end', label: 'پایان مرحله', icon: Square, hint: 'مثلاً: گچکاری تمام شد' },
    { id: 'point', label: 'رویداد', icon: Diamond, hint: 'مثلاً: مجوز صادر شد' },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent dir="rtl" className="bg-card border-border max-w-lg max-h-[90dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Plus className="size-4 text-gold" />
            ثبت رکورد جدید
          </DialogTitle>
          <DialogDescription className="text-[0.68rem]">
            انتخاب کن و ثبت کن — چند ثانیه بیشتر طول نمی‌کشد
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* نوع رکورد */}
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="نوع رکورد">
            {kindOptions.map((o) => {
              const active = kind === o.id
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setKind(o.id)
                    setStageKey(null)
                    setCustomTitle('')
                  }}
                  className={`rounded-2xl border p-3 text-center transition-all ${
                    active
                      ? 'border-gold/70 bg-gold/10 shadow-sm'
                      : 'border-border/70 hover:border-gold/40 bg-background/40'
                  }`}
                  aria-pressed={active}
                >
                  <o.icon className={`size-5 mx-auto ${active ? 'text-gold' : 'text-muted-foreground'}`} />
                  <span className={`block text-[0.72rem] font-bold mt-1.5 ${active ? 'text-gold' : ''}`}>{o.label}</span>
                  <span className="block text-[0.58rem] text-muted-foreground mt-0.5 leading-4">{o.hint}</span>
                </button>
              )
            })}
          </div>

          {/* انتخاب مرحله */}
          {kind !== 'point' && (
            <div>
              <p className="text-[0.68rem] font-bold text-muted-foreground mb-2">
                {kind === 'stage_end' ? 'کدام مرحله تمام شد؟' : 'کدام مرحله شروع شد؟'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presetList.map((s, i) => {
                  const isOpen = openStageKeys.has(s.key)
                  const isPrior = kind === 'stage_end' && isOpen
                  const active = stageKey === s.key
                  const color = STAGE_GROUPS[s.group].color
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStageKey(s.key)}
                      className={`relative rounded-full px-3 py-1.5 text-[0.7rem] font-bold border transition-all ${
                        active
                          ? 'text-white shadow-sm'
                          : isPrior
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-600'
                            : 'border-border/70 text-muted-foreground hover:border-gold/40'
                      }`}
                      style={active ? { background: color, borderColor: color } : undefined}
                    >
                      {s.label}
                      {isPrior && !active && (
                        <span className="absolute -top-1 -start-1 size-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                      )}
                      {kind === 'stage_end' && isOpen && i === 0 && !active && (
                        <span className="ms-1 text-[0.55rem]">باز</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {kind === 'stage_end' && openStages.length > 0 && (
                <p className="text-[0.6rem] text-muted-foreground mt-2">
                  {toFaDigits(openStages.length)} مرحله باز دارید — با نشان کهربایی مشخص شده‌اند
                </p>
              )}
            </div>
          )}

          {/* دسته رویداد نقطه‌ای */}
          {kind === 'point' && (
            <div>
              <p className="text-[0.68rem] font-bold text-muted-foreground mb-2">چه خبر؟</p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['execution', 'اجرا'],
                    ['supply', 'تأمین مصالح'],
                    ['delay', 'تأخیر'],
                    ['visit', 'بازدید ناظر'],
                    ['decision', 'مجوز / تصمیم'],
                    ['report', 'گزارش'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setPointCategory(id)}
                    className={`rounded-full px-3 py-1.5 text-[0.7rem] font-bold border transition-all ${
                      pointCategory === id
                        ? 'border-gold/70 bg-gold/10 text-gold'
                        : 'border-border/70 text-muted-foreground hover:border-gold/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* عنوان (خودکار برای مرحله) */}
          <div>
            <Input
              value={customTitle || autoTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={kind === 'point' ? 'عنوان رویداد...' : 'عنوان (خودکار — قابل ویرایش)'}
              className="text-xs rounded-xl bg-background"
              dir="rtl"
            />
          </div>

          {/* توضیح + عکس + تاریخ — جمع‌شده تا خلوت بماند */}
          <div>
            {!showExtras ? (
              <button
                onClick={() => setShowExtras(true)}
                className="text-[0.66rem] text-muted-foreground hover:text-gold inline-flex items-center gap-1 transition-colors"
              >
                <ChevronDown className="size-3" />
                توضیح، عکس یا تاریخ دیگر
              </button>
            ) : (
              <div className="space-y-2.5">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیح (اختیاری)..."
                  rows={2}
                  className="text-xs rounded-xl bg-background resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    id="quick-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      setPhoto(e.target.files?.[0] || null)
                      e.target.value = ''
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('quick-photo')?.click()}
                    className="h-8 rounded-full text-[0.66rem] gap-1.5"
                  >
                    <ImagePlus className="size-3.5" /> {photo ? 'عکس انتخاب شد' : 'عکس'}
                  </Button>
                  {photo && (
                    <button
                      onClick={() => setPhoto(null)}
                      className="size-6 grid place-items-center rounded-full text-muted-foreground hover:text-destructive"
                      aria-label="حذف عکس"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDate((v) => !v)}
                    className={`h-8 rounded-full text-[0.66rem] gap-1.5 inline-flex items-center px-3 border transition-colors ${
                      showDate ? 'border-gold/60 bg-gold/10 text-gold' : 'border-border/70 text-muted-foreground'
                    }`}
                  >
                    <CalendarDays className="size-3.5" />
                    {showDate ? 'امروز ثبت می‌شود' : 'تاریخ دیگر'}
                  </button>
                </div>
                {showDate && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      placeholder={`${toFaDigits(t.jy)}/${toFaDigits(t.jm)}/${toFaDigits(t.jd)} (شمسی)`}
                      className="text-[0.7rem] rounded-xl bg-background h-9 tabular-nums"
                      dir="ltr"
                      inputMode="numeric"
                    />
                    <button
                      onClick={() => {
                        setShowDate(false)
                        setDateStr('')
                      }}
                      className="text-[0.62rem] text-muted-foreground hover:text-destructive shrink-0"
                    >
                      حذف تاریخ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ثبت */}
        <div className="px-4 py-3 border-t border-border/60 shrink-0 bg-muted/10">
          <Button
            onClick={submit}
            disabled={submitting || !ready}
            className="gold-btn rounded-2xl w-full h-11 text-sm font-extrabold gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            ثبت {kind === 'stage_start' ? 'شروع' : kind === 'stage_end' ? 'پایان' : 'رویداد'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
