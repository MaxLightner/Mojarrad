import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions'
import { randomBytes } from 'crypto'

const CATEGORIES = ['in-progress', 'completed', 'future']

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const { title, subtitle, location, area, year, status, progress, description, coverImage, category } =
      await req.json()

    if (!title?.trim() || !location?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'عنوان، محل و توضیحات الزامی است' }, { status: 400 })
    }

    // اسلاگ یکتا از عنوان + پسوند تصادفی
    const base = String(title)
      .trim()
      .replace(/[\s\u200c]+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .slice(0, 40)
      .toLowerCase() || 'project'
    const slug = `${base}-${randomBytes(3).toString('hex')}`

    const maxOrder = await db.project.aggregate({ _max: { order: true } })

    const project = await db.project.create({
      data: {
        slug,
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        category: CATEGORIES.includes(category) ? category : 'in-progress',
        status: status ? String(status).trim() : 'در حال اجرا',
        location: String(location).trim(),
        area: area ? String(area).trim() : '—',
        year: year ? String(year).trim() : '—',
        progress: Number.isFinite(Number(progress)) ? Math.max(0, Math.min(100, Math.round(Number(progress)))) : 0,
        description: String(description).trim(),
        coverImage: coverImage || '/images/cons-n-1.jpg',
        startDate: new Date().toLocaleDateString('fa-IR'),
        order: (maxOrder._max.order || 0) + 1,
      },
    })

    return NextResponse.json({ ok: true, project: { id: project.id, slug: project.slug, title: project.title } })
  } catch {
    return NextResponse.json({ error: 'خطا در ایجاد پروژه' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const { projectId, commentsVisibility } = await req.json()
    if (!projectId || !['management', 'team', 'all'].includes(commentsVisibility)) {
      return NextResponse.json({ error: 'داده نامعتبر' }, { status: 400 })
    }
    await db.project.update({ where: { id: projectId }, data: { commentsVisibility } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 })
  }
}
