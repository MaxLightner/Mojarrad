import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions'

export const runtime = 'nodejs'

const CATEGORIES = ['prices', 'policy', 'company', 'occasion']

/* پنل کنترل محتوا — مدیریت اخبار و مناسبت‌ها (مدیر سیستم) */
export async function GET() {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  const news = await db.newsItem.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json({ news })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  try {
    const { title, category, excerpt, content, coverImage, date } = await req.json()
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'عنوان و متن الزامی است' }, { status: 400 })
    }
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'دسته نامعتبر' }, { status: 400 })
    }
    const created = await db.newsItem.create({
      data: {
        title: String(title).trim(),
        category,
        excerpt: excerpt ? String(excerpt).trim() : String(content).slice(0, 120),
        content: String(content),
        coverImage: coverImage || null,
        date: date ? new Date(date) : new Date(),
      },
    })
    return NextResponse.json({ ok: true, id: created.id })
  } catch {
    return NextResponse.json({ error: 'خطا در ایجاد خبر' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  try {
    const { id, title, category, excerpt, content, coverImage, date } = await req.json()
    if (!id) return NextResponse.json({ error: 'شناسه الزامی' }, { status: 400 })
    const existing = await db.newsItem.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'خبر یافت نشد' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = String(title).trim()
    if (category !== undefined && CATEGORIES.includes(category)) data.category = category
    if (excerpt !== undefined) data.excerpt = String(excerpt).trim()
    if (content !== undefined) data.content = String(content)
    if (coverImage !== undefined) data.coverImage = coverImage || null
    if (date !== undefined) data.date = new Date(date)

    await db.newsItem.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ویرایش خبر' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'شناسه الزامی' }, { status: 400 })
  await db.newsItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
