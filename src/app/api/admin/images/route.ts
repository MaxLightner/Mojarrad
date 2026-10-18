import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/permissions'

// مدیریت عکس‌های پیشنهادی کاربران — فقط مدیر سیستم
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'فقط مدیر سیستم' }, { status: 403 })
  }

  const pending = await db.eventImage.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    include: {
      event: { select: { id: true, title: true, date: true, project: { select: { title: true } } } },
      uploader: { select: { fullName: true, role: true } },
    },
  })

  return NextResponse.json({
    pending: pending.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      createdAt: p.createdAt,
      eventTitle: p.event.title,
      eventDate: p.event.date,
      projectTitle: p.event.project.title,
      uploaderName: p.uploader?.fullName || '—',
      uploaderRoleLabel: p.uploader ? ROLE_LABELS[p.uploader.role] || p.uploader.role : '—',
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'فقط مدیر سیستم' }, { status: 403 })
  }

  try {
    const { id, action } = await req.json()
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'پارامتر نامعتبر' }, { status: 400 })
    }
    const img = await db.eventImage.findUnique({ where: { id }, include: { event: true } })
    if (!img) return NextResponse.json({ error: 'عکس یافت نشد' }, { status: 404 })

    if (action === 'approve') {
      const images: string[] = JSON.parse(img.event.images || '[]')
      images.push(img.url)
      await db.timelineEvent.update({ where: { id: img.eventId }, data: { images: JSON.stringify(images) } })
      await db.eventImage.update({ where: { id }, data: { status: 'approved' } })
    } else {
      await db.eventImage.update({ where: { id }, data: { status: 'rejected' } })
      // حذف فایل ردشده
      try {
        await unlink(path.join(process.cwd(), 'public', img.url.replace(/^\//, '')))
      } catch {}
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در پردازش' }, { status: 500 })
  }
}
