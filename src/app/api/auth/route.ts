import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, destroySession, getSessionUser, verifyPassword, SESSION_COOKIE } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  return NextResponse.json({ user })
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { username: String(username).trim() } })
    if (!user || !user.active || !verifyPassword(String(password), user.passwordHash)) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 })
    }
    const token = await createSession(user.id)
    const res = NextResponse.json({
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

export async function DELETE() {
  await destroySession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
