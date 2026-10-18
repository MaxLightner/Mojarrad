import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'mojarrad_session'
const SESSION_DAYS = 14

export function hashPassword(pw: string, salt = randomBytes(8).toString('hex')) {
  const h = createHash('sha256').update(`${salt}:${pw}`).digest('hex')
  return `${salt}:${h}`
}

export function verifyPassword(pw: string, stored: string) {
  const [salt] = stored.split(':')
  return hashPassword(pw, salt) === stored
}

export type SessionUser = {
  id: string
  username: string
  fullName: string
  role: string
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.session.create({ data: { token, userId, expiresAt } })
  return token
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return null
    if (session.expiresAt < new Date() || !session.user.active) return null
    return {
      id: session.user.id,
      username: session.user.username,
      fullName: session.user.fullName,
      role: session.user.role,
    }
  } catch {
    return null
  }
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { token } })
  }
}
