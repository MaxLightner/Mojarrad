import { db } from '@/lib/db'
import type { SessionUser } from '@/lib/auth'

export const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر سیستم',
  executor: 'مجری',
  engineer: 'مهندس',
  foreman: 'سرپرست کارگاه',
  supervisor: 'ناظر',
  owner: 'مالک',
  contractor: 'پیمانکار',
}

export const TEAM_ROLES = ['admin', 'executor', 'engineer', 'foreman']
export const REPORT_VIEWER_ROLES = ['owner', 'supervisor']

export function isTeam(role: string) {
  return TEAM_ROLES.includes(role)
}

export function isAdmin(role: string) {
  return role === 'admin'
}

/* ================= دید کامنت‌ها (سطح پیام، نه پروژه) =================
 * visibility → چه کسی علاوه بر نویسنده پیام را می‌بیند:
 *   management: مدیر + مجری (داخلی)
 *   team:       مدیر + مجری + مهندس + سرپرست کارگاه
 *   owner:      مدیر + مجری + مالک
 *   contractor: مدیر + مجری + پیمانکار
 * ناظر هیچ کامنتی نمی‌بیند (فقط گزارش‌های رسمی).
 */
export const COMMENT_VISIBILITY_LABELS: Record<string, string> = {
  management: 'داخلی (مدیر و مجری)',
  team: 'تیم اجرا',
  owner: 'مالک',
  contractor: 'پیمانکار',
}

export function canSeeComment(
  user: { id: string; role: string },
  comment: { authorId: string; visibility: string },
) {
  if (isAdmin(user.role) || user.role === 'executor') return true
  if (user.role === 'supervisor') return false
  if (comment.authorId === user.id) return true
  switch (comment.visibility) {
    case 'team':
      return user.role === 'engineer' || user.role === 'foreman'
    case 'owner':
      return user.role === 'owner'
    case 'contractor':
      return user.role === 'contractor'
    default:
      return false
  }
}

/** مخاطب پیش‌فرض کامنت بر اساس نقش نویسنده */
export function defaultVisibilityFor(role: string) {
  if (role === 'owner') return 'owner'
  if (role === 'contractor') return 'contractor'
  if (role === 'engineer' || role === 'foreman') return 'team'
  return 'management'
}

/** چه visibilityهایی این نقش می‌تواند انتخاب کند */
export function allowedVisibilities(role: string) {
  if (isAdmin(role) || role === 'executor') return ['management', 'team', 'owner', 'contractor']
  if (role === 'owner') return ['owner', 'team']
  if (role === 'contractor') return ['contractor', 'management']
  if (role === 'engineer' || role === 'foreman') return ['team', 'management']
  return []
}

/** چه کسی می‌تواند کامنت بگذارد؟ همه به‌جز ناظر (گفتگو حول رویدادها) */
export function canComment(user: SessionUser) {
  return user.role !== 'supervisor'
}

/** چه کسی می‌تواند پیگیری را «انجام‌شده» کند: نویسنده، مدیر یا مجری */
export function canResolveComment(user: SessionUser, comment: { authorId: string }) {
  return isAdmin(user.role) || user.role === 'executor' || comment.authorId === user.id
}

/** مالی پروژه: فقط مالک، مدیر و مجری */
export function canSeePayments(role: string) {
  return role === 'owner' || role === 'admin' || role === 'executor'
}

/** افزودن/ویرایش رفرنس: مالک، مدیر و مجری */
export function canManageReferences(role: string) {
  return role === 'owner' || role === 'admin' || role === 'executor'
}

export function canManageProject(user: SessionUser) {
  return isTeam(user.role)
}

/** دسترسی کاربر به پروژه: مدیر و مجری به همه، بقیه با دسترسی صریح */
export async function hasProjectAccess(user: SessionUser, projectId: string) {
  if (isAdmin(user.role) || user.role === 'executor') return true
  const acc = await db.projectAccess.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  })
  return !!acc
}

export async function accessibleProjects(user: SessionUser) {
  if (isAdmin(user.role) || user.role === 'executor') {
    return db.project.findMany({ orderBy: { order: 'asc' } })
  }
  const accs = await db.projectAccess.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { project: { order: 'asc' } },
  })
  return accs.map((a) => a.project)
}
