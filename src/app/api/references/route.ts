import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { hasProjectAccess, canManageReferences, ROLE_LABELS } from '@/lib/permissions'

/** ذخیره فایل رفرنس (عکس یا سند) */
async function saveFile(file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > 8 * 1024 * 1024) return null
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const name = `ref-${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, name), buf)
  return `/uploads/${name}`
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })
  if (!(await hasProjectAccess(user, projectId))) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }

  const items = await db.referenceItem.findMany({
    where: { projectId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json({
    references: items,
    canManage: canManageReferences(user.role),
  })
}

/** افزودن رفرنس (یا نسخه جدید یک رفرنس موجود — بازنگری) */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!canManageReferences(user.role)) {
    return NextResponse.json({ error: 'افزودن رفرنس فقط برای مالک، مدیر و مجری است' }, { status: 403 })
  }

  try {
    const fd = await req.formData()
    const projectId = String(fd.get('projectId') || '')
    const title = String(fd.get('title') || '').trim()
    const category = String(fd.get('category') || 'photo')
    const description = String(fd.get('description') || '').trim()
    const supersedesId = String(fd.get('supersedesId') || '') || null

    if (!projectId || !title) {
      return NextResponse.json({ error: 'عنوان رفرنس الزامی است' }, { status: 400 })
    }
    if (!(await hasProjectAccess(user, projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    const file = fd.get('file')
    const fileUrl = file instanceof File ? await saveFile(file) : null

    // اگر بازنگری است: نسخه قبلی آرشیو و شماره نسخه ادامه پیدا می‌کند
    let version = 1
    if (supersedesId) {
      const prev = await db.referenceItem.findUnique({ where: { id: supersedesId } })
      if (prev && prev.projectId === projectId) {
        await db.referenceItem.update({ where: { id: prev.id }, data: { status: 'superseded' } })
        version = (prev.version || 1) + 1
      }
    }

    const ref = await db.referenceItem.create({
      data: {
        projectId,
        title,
        category,
        description,
        fileUrl,
        version,
        addedById: user.id,
        addedByName: user.fullName,
      },
    })

    // رویداد کوتاه در تایم‌لاین تا همه متوجه رفرنس جدید شوند (بدون شلوغی — فقط اطلاع‌رسانی)
    await db.timelineEvent.create({
      data: {
        projectId,
        category: 'reference',
        title: `رفرنس جدید: ${title}${version > 1 ? ` (نسخه ${version})` : ''}`,
        description: description || 'توسط مالک/مدیریت اضافه شد — جزئیات در تب «رفرنس‌ها».',
        isReport: true,
        date: new Date(),
        authorId: user.id,
      },
    })

    return NextResponse.json({ id: ref.id })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت رفرنس' }, { status: 500 })
  }
}

/** بازگرداندن رفرنس آرشیو‌شده به حالت فعال (اگر بازنگری اشتباه بود) */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!canManageReferences(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }

  try {
    const { referenceId, restore } = await req.json()
    const ref = await db.referenceItem.findUnique({ where: { id: referenceId } })
    if (!ref) return NextResponse.json({ error: 'رفرنس یافت نشد' }, { status: 404 })

    if (restore) {
      // نسخه جلوتر را آرشیو کن و این را فعال کن
      const newer = await db.referenceItem.findFirst({
        where: { projectId: ref.projectId, title: ref.title, status: 'active', version: { gt: ref.version } },
      })
      if (newer) {
        await db.referenceItem.update({ where: { id: newer.id }, data: { status: 'superseded' } })
      }
      await db.referenceItem.update({ where: { id: ref.id }, data: { status: 'active' } })
    } else {
      await db.referenceItem.update({ where: { id: ref.id }, data: { status: 'superseded' } })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 })
  }
}
