import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// دفترچه تماس مجری — فقط مجری و مدیر سیستم
// شماره‌های موقت اگر ۳۰ روز تیک (بررسی) نشده باشند خودکار حذف می‌شوند
async function guard() {
  const user = await getSessionUser()
  if (!user) return { error: NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (user.role !== 'admin' && user.role !== 'executor') {
    return { error: NextResponse.json({ error: 'این بخش فقط برای مجری و مدیر سیستم است' }, { status: 403 }) }
  }
  return { user }
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

async function cleanupExpired() {
  const cutoff = new Date(Date.now() - THIRTY_DAYS)
  await db.contactEntry.deleteMany({
    where: { isTemporary: true, lastCheckedAt: { lt: cutoff } },
  })
}

export async function GET() {
  const g = await guard()
  if (g.error) return g.error
  await cleanupExpired()
  const entries = await db.contactEntry.findMany({ orderBy: { lastCheckedAt: 'desc' } })
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  try {
    const { name, phone, type, note, isTemporary } = await req.json()
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'نام و شماره تماس الزامی است' }, { status: 400 })
    }
    if (!/^[۰-۹0-9+\s-]{8,15}$/.test(String(phone).trim())) {
      return NextResponse.json({ error: 'شماره تماس معتبر نیست' }, { status: 400 })
    }
    const entry = await db.contactEntry.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        type: ['worker', 'contractor', 'supplier', 'other'].includes(type) ? type : 'other',
        note: note?.trim() || null,
        isTemporary: isTemporary !== false,
        lastCheckedAt: new Date(),
      },
    })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت مخاطب' }, { status: 500 })
  }
}

// تیک بررسی — تاریخ چک را تازه می‌کند (شمارنده ۳۰ روزه ریست می‌شود)
export async function PATCH(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  try {
    const { id, makePermanent } = await req.json()
    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
    const entry = await db.contactEntry.update({
      where: { id },
      data: { lastCheckedAt: new Date(), ...(makePermanent ? { isTemporary: false } : {}) },
    })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'مخاطب یافت نشد' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
  try {
    await db.contactEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'مخاطب یافت نشد' }, { status: 404 })
  }
}
