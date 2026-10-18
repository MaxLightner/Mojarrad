import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, hashPassword } from '@/lib/auth'
import { isAdmin, ROLE_LABELS } from '@/lib/permissions'

export async function GET() {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { accesses: { include: { project: { select: { id: true, title: true } } } } },
  })
  const projects = await db.project.findMany({
    select: { id: true, title: true, category: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      roleLabel: ROLE_LABELS[u.role] || u.role,
      active: u.active,
      projects: u.accesses.map((a) => ({ id: a.project.id, title: a.project.title })),
    })),
    projects,
  })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const { username, password, fullName, role, projectIds } = await req.json()
    if (!username?.trim() || !password || !fullName?.trim()) {
      return NextResponse.json({ error: 'همه فیلدها الزامی است' }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'رمز عبور حداقل ۶ کاراکتر' }, { status: 400 })
    }
    if (!ROLE_LABELS[role]) {
      return NextResponse.json({ error: 'نقش نامعتبر' }, { status: 400 })
    }
    const exists = await db.user.findUnique({ where: { username: String(username).trim() } })
    if (exists) return NextResponse.json({ error: 'این نام کاربری قبلاً ثبت شده' }, { status: 409 })

    /* کاربر نقش‌محور: مدیر/مجری به همه پروژه‌ها دسترسی دارند؛
       مالک/ناظر/پیمانکار/مهندس/سرپرست فقط به پروژه‌های تخصیص‌یافته */
    const needsAssignment = ['owner', 'supervisor', 'contractor', 'engineer', 'foreman'].includes(role)
    if (needsAssignment && (!Array.isArray(projectIds) || projectIds.length === 0)) {
      return NextResponse.json(
        { error: 'برای این نقش، حداقل یک پروژه باید انتخاب شود (مدیر و مجری به همه پروژه‌ها دسترسی دارند)' },
        { status: 400 },
      )
    }

    const created = await db.user.create({
      data: {
        username: String(username).trim(),
        passwordHash: hashPassword(String(password)),
        fullName: String(fullName).trim(),
        role,
        ...(Array.isArray(projectIds) && projectIds.length > 0
          ? { accesses: { create: projectIds.map((pid: string) => ({ projectId: pid })) } }
          : {}),
      },
    })
    return NextResponse.json({ ok: true, id: created.id })
  } catch {
    return NextResponse.json({ error: 'خطا در ایجاد کاربر' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  try {
    const { userId, active, projectId, grant } = await req.json()
    if (!userId) return NextResponse.json({ error: 'شناسه کاربر الزامی' }, { status: 400 })
    const target = await db.user.findUnique({ where: { id: userId } })
    if (!target) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })

    if (typeof active === 'boolean') {
      await db.user.update({ where: { id: userId }, data: { active } })
    }
    if (projectId && typeof grant === 'boolean') {
      if (grant) {
        await db.projectAccess.upsert({
          where: { userId_projectId: { userId, projectId } },
          create: { userId, projectId },
          update: {},
        })
      } else {
        await db.projectAccess.deleteMany({ where: { userId, projectId } })
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ویرایش' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
  }
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'شناسه الزامی' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'حذف حساب خودتان ممکن نیست' }, { status: 400 })
  await db.session.deleteMany({ where: { userId } })
  await db.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
