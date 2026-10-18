import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { hasProjectAccess, canSeePayments } from '@/lib/permissions'

/** فرمت مبالغ در UI انجام می‌شود؛ اینجا رقمی خالص ذخیره می‌شود */
function cleanAmount(raw: string): string | null {
  const digits = String(raw).replace(/[^\d]/g, '')
  if (!digits || Number(digits) <= 0) return null
  return digits
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!canSeePayments(user.role)) {
    return NextResponse.json({ error: 'این بخش فقط برای مالک، مدیر و مجری است' }, { status: 403 })
  }

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })
  if (!(await hasProjectAccess(user, projectId))) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }

  const receipts = await db.paymentReceipt.findMany({
    where: { projectId },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({
    receipts,
    canAdd: user.role === 'owner' || user.role === 'admin' || user.role === 'executor',
  })
}

/** ثبت پرداخت — همزمان رویداد تایم‌لاین مالی می‌سازد (قابل حذف هم‌زمان) */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!canSeePayments(user.role)) {
    return NextResponse.json({ error: 'ثبت پرداخت فقط برای مالک، مدیر و مجری است' }, { status: 403 })
  }

  try {
    const fd = await req.formData()
    const projectId = String(fd.get('projectId') || '')
    const amount = cleanAmount(String(fd.get('amount') || ''))
    const description = String(fd.get('description') || '').trim()
    const jy = Number(fd.get('jy'))
    const jm = Number(fd.get('jm'))
    const jd = Number(fd.get('jd'))

    if (!projectId || !amount || !description) {
      return NextResponse.json({ error: 'مبلغ و توضیح الزامی است' }, { status: 400 })
    }
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    let date = new Date()
    if (jy && jm && jd) {
      const { jalaliToDate } = await import('@/lib/jalali')
      const d = jalaliToDate(jy, jm, jd)
      if (!Number.isNaN(d.getTime())) date = d
    }

    // عکس رسید (اختیاری)
    let receiptImage: string | null = null
    const file = fd.get('image')
    if (file instanceof File && file.size > 0 && file.size <= 6 * 1024 * 1024 && file.type.startsWith('image/')) {
      const dir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(dir, { recursive: true })
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const name = `pay-${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
      await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
      receiptImage = `/uploads/${name}`
    }

    // رویداد تایم‌لاین مالی — isReport تا مالک در تایم‌لاین خودش ببیند
    const event = await db.timelineEvent.create({
      data: {
        projectId,
        category: 'payment',
        title: 'رسید پرداخت ثبت شد',
        description,
        isReport: true,
        date,
        authorId: user.id,
        images: receiptImage ? JSON.stringify([receiptImage]) : '[]',
      },
    })

    const receipt = await db.paymentReceipt.create({
      data: {
        projectId,
        date,
        amount,
        description,
        receiptImage,
        addedById: user.id,
        addedByName: user.fullName,
        timelineEventId: event.id,
      },
    })
    return NextResponse.json({ id: receipt.id, eventId: event.id })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت پرداخت' }, { status: 500 })
  }
}

/** حذف پرداخت + رویداد تایم‌لاین مربوطه */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!canSeePayments(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }

  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
    const receipt = await db.paymentReceipt.findUnique({ where: { id } })
    if (!receipt) return NextResponse.json({ error: 'رسید یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, receipt.projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    if (receipt.timelineEventId) {
      await db.timelineEvent.delete({ where: { id: receipt.timelineEventId } }).catch(() => {})
    }
    await db.paymentReceipt.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 })
  }
}
