import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { canManageProject, hasProjectAccess } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !canManageProject(user)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })
  if (!(await hasProjectAccess(user, projectId))) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }

  const workers = await db.worker.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    workers: workers.map((w) => ({
      id: w.id,
      fullName: w.fullName,
      job: w.job,
      phone: w.phone,
      active: w.active,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !canManageProject(user)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const { projectId, fullName, job, phone } = await req.json()
    if (!projectId || !fullName?.trim()) {
      return NextResponse.json({ error: 'نام کارگر و پروژه الزامی است' }, { status: 400 })
    }
    if (!(await hasProjectAccess(user, projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }
    await db.worker.create({
      data: { projectId, fullName: String(fullName).trim(), job: String(job || '').trim(), phone: phone?.trim() || null },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت کارگر' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !canManageProject(user)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const { workerId, active } = await req.json()
    if (!workerId || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'داده نامعتبر' }, { status: 400 })
    }
    const worker = await db.worker.findUnique({ where: { id: workerId } })
    if (!worker) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, worker.projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }
    await db.worker.update({ where: { id: workerId }, data: { active } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در تغییر وضعیت' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !canManageProject(user)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 })
  const worker = await db.worker.findUnique({ where: { id } })
  if (!worker) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
  if (!(await hasProjectAccess(user, worker.projectId))) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  await db.worker.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
