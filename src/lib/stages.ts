/* مراحل و گروه‌های کاری تایم‌لاین
 * هر مرحله (فنداسیون، اسکلت، تاسیسات و...) یک «نخ» روی تایم‌لاین است:
 * رکورد شروع + رکورد پایان با stageKey یکسان به هم وصل می‌شوند.
 */

export type StageGroupId = 'structure' | 'mep' | 'finishing' | 'exterior' | 'admin'

export const STAGE_GROUPS: Record<StageGroupId, { label: string; color: string }> = {
  structure: { label: 'سازه', color: '#f59e0b' },
  mep: { label: 'تاسیسات', color: '#14b8a6' },
  finishing: { label: 'نازک‌کاری', color: '#8b5cf6' },
  exterior: { label: 'نما و پایانی', color: '#f43f5e' },
  admin: { label: 'اداری', color: '#64748b' },
}

export const STAGE_GROUP_IDS = Object.keys(STAGE_GROUPS) as StageGroupId[]

/** مراحل پیش‌فرض برای ثبت سریع — کلید، برچسب و گروه کاری */
export const STAGE_PRESETS: { key: string; label: string; group: StageGroupId }[] = [
  { key: 'foundation', label: 'فنداسیون', group: 'structure' },
  { key: 'skeleton', label: 'اسکلت', group: 'structure' },
  { key: 'ceiling', label: 'سقف', group: 'structure' },
  { key: 'masonry', label: 'دیوارچینی', group: 'finishing' },
  { key: 'mep', label: 'تاسیسات (برق و مکانیک)', group: 'mep' },
  { key: 'plaster', label: 'گچکاری', group: 'finishing' },
  { key: 'tiling', label: 'کفسازی و سنگ', group: 'finishing' },
  { key: 'paint', label: 'نقاشی', group: 'finishing' },
  { key: 'facade', label: 'نما', group: 'exterior' },
  { key: 'landscape', label: 'محوطه و فضای باز', group: 'exterior' },
  { key: 'cleanup', label: 'نظافت و تحویل', group: 'exterior' },
]

/** برچسب مرحله از روی کلید — اول از پیش‌فرض‌ها، بعد خود کلید */
export function stageLabelByKey(key: string | null | undefined): string | null {
  if (!key) return null
  const p = STAGE_PRESETS.find((s) => s.key === key)
  return p ? p.label : null
}

/** رنگ گروه کاری یک رویداد (مرحله‌ای یا نقطه‌ای) */
export function stageGroupColor(stageGroup?: string | null, category?: string | null): string {
  if (stageGroup && STAGE_GROUPS[stageGroup as StageGroupId]) {
    return STAGE_GROUPS[stageGroup as StageGroupId].color
  }
  switch (category) {
    case 'payment':
      return '#22c55e'
    case 'reference':
      return '#38bdf8'
    case 'delay':
      return '#ef4444'
    case 'visit':
      return '#f59e0b'
    case 'supply':
      return '#14b8a6'
    case 'decision':
      return '#64748b'
    default:
      return '#f59e0b'
  }
}

/** عنوان پیش‌فرض رکورد مرحله */
export function autoStageTitle(kind: 'stage_start' | 'stage_end', label: string): string {
  return kind === 'stage_start' ? `شروع ${label}` : `پایان ${label}`
}
