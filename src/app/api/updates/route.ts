import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { canSeeComment, ROLE_LABELS, accessibleProjects } from '@/lib/permissions'

export type UpdateItem = {
  type: 'comment' | 'event'
  id: string
  at: string
  projectTitle: string
  projectSlug: string
  projectId: string
  eventId: string
  eventTitle: string
  authorName: string
  authorRole: string
  authorRoleLabel: string
  snippet: string
  amount?: string | null
  needsFollowUp?: boolean
  resolvedAt?: string | null
  kind?: string
}

/* فید به‌روزرسانی‌های «پنل من»:
 * آخرین رویدادها و پیام‌های قابل‌مشاهدهٔ کاربر در همهٔ پروژه‌های در دسترس او.
 * مالک: گزارش‌ها + پرداخت‌ها + پیام‌های خطاب به خودش
 * ناظر: گزارش‌های رسمی (بدون پیام و بدون پرداخت)
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  /* داشبورد فقط پروژه‌های در حال اجرا را نشان می‌دهد —
     پروژه تمام‌شده با «آرشیو» از پنل خارج می‌شود */
  const all = await accessibleProjects(user)
  const projects = all.filter((p) => p.category === 'in-progress')
  if (projects.length === 0) return NextResponse.json({ updates: [] })

  const projectIds = projects.map((p) => p.id)
  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const isReportViewer = user.role === 'owner' || user.role === 'supervisor'
  const seesPayments = user.role === 'owner' || user.role === 'admin' || user.role === 'executor'

  /* ===== رویدادها ===== */
  const eventWhere: {
    projectId: { in: string[] }
    isReport?: boolean
    category?: { not: string }
  } = { projectId: { in: projectIds } }
  if (isReportViewer) {
    eventWhere.isReport = true
    if (!seesPayments) eventWhere.category = { not: 'payment' }
  } else if (!seesPayments) {
    eventWhere.category = { not: 'payment' }
  }

  const events = await db.timelineEvent.findMany({
    where: eventWhere,
    orderBy: { date: 'desc' },
    take: 14,
    include: { author: true },
  })

  /* ===== پیام‌ها ===== */
  // آخرین ۴۰ پیام پروژه‌های در دسترس — بعد فیلتر دید
  const comments = await db.comment.findMany({
    where: { event: { projectId: { in: projectIds } } },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: {
      author: true,
      event: { select: { id: true, title: true, date: true, projectId: true } },
    },
  })
  const visibleComments = comments.filter((c) =>
    canSeeComment(user, { authorId: c.authorId, visibility: c.visibility }),
  )

  /* مبالغ پرداخت روی رویدادها */
  const paymentMap = new Map<string, string>()
  if (seesPayments) {
    const pays = await db.paymentReceipt.findMany({
      where: { projectId: { in: projectIds } },
      select: { timelineEventId: true, amount: true },
    })
    for (const p of pays) if (p.timelineEventId) paymentMap.set(p.timelineEventId, p.amount)
  }

  const eventUpdates: UpdateItem[] = events.map((e) => ({
    type: 'event' as const,
    id: `ev-${e.id}`,
    at: e.date.toISOString(),
    projectId: e.projectId,
    projectTitle: projectMap.get(e.projectId)?.title || '',
    projectSlug: projectMap.get(e.projectId)?.slug || '',
    eventId: e.id,
    eventTitle: e.title,
    authorName: e.author?.fullName || '—',
    authorRole: e.author?.role || 'admin',
    authorRoleLabel: ROLE_LABELS[e.author?.role || ''] || '',
    snippet: e.description.slice(0, 140),
    amount: paymentMap.get(e.id) || null,
    kind: e.kind,
  }))

  const commentUpdates: UpdateItem[] = visibleComments.slice(0, 10).map((c) => ({
    type: 'comment' as const,
    id: `cm-${c.id}`,
    at: c.createdAt.toISOString(),
    projectId: c.event.projectId,
    projectTitle: projectMap.get(c.event.projectId)?.title || '',
    projectSlug: projectMap.get(c.event.projectId)?.slug || '',
    eventId: c.event.id,
    eventTitle: c.event.title,
    authorName: c.author.fullName,
    authorRole: c.author.role,
    authorRoleLabel: ROLE_LABELS[c.author.role] || c.author.role,
    snippet: c.text.slice(0, 160),
    needsFollowUp: c.needsFollowUp,
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
  }))

  const updates = [...eventUpdates, ...commentUpdates]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 18)

  return NextResponse.json({ updates })
}
