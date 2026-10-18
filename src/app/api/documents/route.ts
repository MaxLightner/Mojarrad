import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { canManageProject, hasProjectAccess } from '@/lib/permissions'

/** چه کسی اسناد/نقشه‌ها را می‌بیند: تیم اجرا + مالک + ناظر (فقط مشاهده و دانلود) */
function canViewDocuments(role: string) {
  return ['admin', 'executor', 'engineer', 'foreman', 'owner', 'supervisor'].includes(role)
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !canViewDocuments(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })
  if (!(await hasProjectAccess(user, projectId))) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  const documents = await db.document.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !canManageProject(user)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const formData = await req.formData()
    const projectId = String(formData.get('projectId') || '')
    const title = String(formData.get('title') || '').trim()
    const category = String(formData.get('category') || 'other')
    const note = String(formData.get('note') || '').trim()
    if (!projectId || !title) return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 })
    if (!(await hasProjectAccess(user, projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    let fileUrl: string | null = null
    const file = formData.get('file')
    if (file instanceof File && file.size > 0 && file.size < 8 * 1024 * 1024) {
      const dir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(dir, { recursive: true })
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
      const name = `doc-${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
      await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
      fileUrl = `/uploads/${name}`
    }

    await db.document.create({ data: { projectId, title, category, note: note || null, fileUrl } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت سند' }, { status: 500 })
  }
}
