import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { hasProjectAccess } from '@/lib/permissions'

// آپلود عکس توسط کاربران روی رویداد — با تأیید مدیر روی سیستم می‌نشیند
// مجری و مدیر: تأیید خودکار | بقیه کاربران مجاز: در صف تأیید
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  try {
    const formData = await req.formData()
    const eventId = String(formData.get('eventId') || '')
    const caption = String(formData.get('caption') || '').trim() || null
    const file = formData.get('image')

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'فایل عکس ارسال نشده است' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'فقط فایل تصویری مجاز است' }, { status: 400 })
    }
    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم عکس باید کمتر از ۶ مگابایت باشد' }, { status: 400 })
    }

    const event = await db.timelineEvent.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'رویداد یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, event.projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const name = `up-${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
    const url = `/uploads/${name}`

    const isManagement = user.role === 'admin' || user.role === 'executor'
    if (isManagement) {
      // تأیید خودکار و افزودن مستقیم به گالری رویداد
      const images: string[] = JSON.parse(event.images || '[]')
      images.push(url)
      await db.timelineEvent.update({ where: { id: eventId }, data: { images: JSON.stringify(images) } })
      return NextResponse.json({ status: 'approved', url })
    }

    await db.eventImage.create({
      data: { eventId, url, caption, uploadedById: user.id, status: 'pending' },
    })
    return NextResponse.json({ status: 'pending', url })
  } catch {
    return NextResponse.json({ error: 'خطا در آپلود عکس' }, { status: 500 })
  }
}
