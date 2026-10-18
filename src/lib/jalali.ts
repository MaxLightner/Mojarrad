// تبدیل و قالب‌بندی تاریخ شمسی بدون وابستگی خارجی

function div(a: number, b: number) {
  return Math.trunc(a / b)
}

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]
  let bl = breaks.length
  let gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  let jump = 0
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ += div(jump, 33) * 8 + div(jump % 33, 4)
    jp = jm
  }
  let n = jy - jp
  leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4)
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = (((n + 1) % 33) - 1) % 4
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(j % 1461, 4) * 5 + 308
  const gd = div(i % 153, 5) + 1
  const gm = (div(i, 153) % 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31)
      const jd = (k % 31) + 1
      return { jy, jm, jd }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  const jm = 7 + div(k, 30)
  const jd = (k % 30) + 1
  return { jy, jm, jd }
}

export function toJalali(date: Date) {
  const jdn = g2d(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return d2j(jdn)
}

export function jalaliToDate(jy: number, jm: number, jd: number) {
  const r = jalCal(jy)
  const jdn = g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  const g = d2g(jdn)
  return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0)
}

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFaDigits(input: string | number) {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

export function formatJalali(date: Date, opts?: { withMonthName?: boolean; short?: boolean }) {
  const { jy, jm, jd } = toJalali(date)
  const withMonthName = opts?.withMonthName ?? true
  if (opts?.short || !withMonthName) {
    return toFaDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
  }
  return `${toFaDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toFaDigits(jy)}`
}

export function formatJalaliDateTime(date: Date) {
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${formatJalali(date)} — ساعت ${toFaDigits(time)}`
}

export function todayJalali() {
  return toJalali(new Date())
}

/** فرمت مبالغ: «500000000» → «۵۰۰٬۰۰۰٬۰۰۰» */
export function formatToman(digits: string | number) {
  const n = Number(digits)
  if (!Number.isFinite(n) || n <= 0) return toFaDigits(digits)
  return toFaDigits(n.toLocaleString('en-US')).replaceAll(',', '٬')
}
