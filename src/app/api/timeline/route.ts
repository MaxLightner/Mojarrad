import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { canSeeComment, canComment, hasProjectAccess, canManageProject, ROLE_LABELS } from '@/lib/permissions'
import { stageLabelByKey } from '@/lib/stages'

async function saveUploads(formData: FormData, field: 'images' | 'files'): Promise<string[]> {
  const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0)
  const saved: string[] = []
  if (files.length === 0) return saved
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  for (const file of files) {
    if (field === 'images' && !file.type.startsWith('image/')) continue
    if (file.size > 6 * 1024 * 1024) continue
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, name), buf)
    saved.push(`/uploads/${name}`)
  }
  return saved
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })

  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })

  if (!(await hasProjectAccess(user, projectId))) {
    return NextResponse.json({ error: 'شما به این پروژه دسترسی ندارید' }, { status: 403 })
  }

  const isReportViewer = user.role === 'owner' || user.role === 'supervisor'
  // رویدادهای مالی فقط برای مالک/مدیر/مجری — بقیه نباید مبالغ را ببینند
  const seesPayments = user.role === 'owner' || user.role === 'admin' || user.role === 'executor'

  const where: { projectId: string; isReport?: boolean; category?: { not: string } } = { projectId }
  if (isReportViewer) {
    // مالک: گزارش‌ها + پرداخت‌ها و رفرنس‌ها (isReport) | ناظر: گزارش‌ها بدون پرداخت
    where.isReport = true
    if (!seesPayments) where.category = { not: 'payment' }
  } else if (!seesPayments) {
    // مهندس/سرپرست/پیمانکار: همه رویدادها بدون پرداخت
    where.category = { not: 'payment' }
  }

  const events = await db.timelineEvent.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      comments: { orderBy: { createdAt: 'asc' }, include: { author: true } },
      author: true,
      eventImages: { where: { status: 'approved' } },
    },
  })

  // هر بیننده فقط کامنت‌هایی را می‌بیند که مخاطب آن‌هاست
  const visibleComments = (comments: (typeof events)[number]['comments']) =>
    comments.filter((c) => canSeeComment(user, { authorId: c.authorId, visibility: c.visibility }))

  // مبالغ پرداخت‌های ثبت‌شده روی رویدادها (یک کوئری)
  const paymentMap = new Map<string, string>()
  if (seesPayments) {
    const pays = await db.paymentReceipt.findMany({
      where: { projectId },
      select: { timelineEventId: true, amount: true },
    })
    for (const p of pays) if (p.timelineEventId) paymentMap.set(p.timelineEventId, p.amount)
  }

  return NextResponse.json({
    events: events.map((e) => {
      const baseImages: string[] = JSON.parse(e.images || '[]')
      const approved = e.eventImages.map((i) => i.url)
      const comments = visibleComments(e.comments).map((c) => ({
        id: c.id,
        text: c.text,
        image: c.image,
        authorId: c.authorId,
        authorName: c.author.fullName,
        authorRole: c.author.role,
        authorRoleLabel: ROLE_LABELS[c.author.role] || c.author.role,
        visibility: c.visibility,
        needsFollowUp: c.needsFollowUp,
        resolvedAt: c.resolvedAt,
        createdAt: c.createdAt,
      }))
      return {
        id: e.id,
        date: e.date,
        category: e.category,
        kind: e.kind,
        stageKey: e.stageKey,
        stageGroup: e.stageGroup,
        title: e.title,
        description: e.description,
        isReport: e.isReport,
        images: [...baseImages, ...approved],
        files: JSON.parse(e.files || '[]'),
        authorName: e.author ? e.author.fullName : null,
        comments,
        paymentAmount: paymentMap.get(e.id) || null,
      }
    }),
    viewer: {
      role: user.role,
      roleLabel: ROLE_LABELS[user.role] || user.role,
      seesComments: user.role !== 'supervisor',
      canComment: canComment(user),
      reportOnly: isReportViewer,
      canManage: canManageProject(user),
      canUploadPhoto: true,
    },
  })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
  if (!canManageProject(user)) {
    return NextResponse.json({ error: 'برای ثبت رویداد دسترسی ندارید' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const projectId = String(formData.get('projectId') || '')
    // kind: point | stage_start | stage_end
    const kindRaw = String(formData.get('kind') || 'point')
    const kind = ['point', 'stage_start', 'stage_end'].includes(kindRaw) ? kindRaw : 'point'
    const stageKey = kind !== 'point' ? String(formData.get('stageKey') || '').trim() || null : null
    const stageGroup = kind !== 'point' ? String(formData.get('stageGroup') || '').trim() || null : null

    let title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    let category = String(formData.get('category') || 'execution')
    const isReport = formData.get('isReport') === 'true' || formData.get('isReport') === 'on'
    const jy = Number(formData.get('jy'))
    const jm = Number(formData.get('jm'))
    const jd = Number(formData.get('jd'))

    if (!projectId) {
      return NextResponse.json({ error: 'پروژه الزامی است' }, { status: 400 })
    }

    // عنوان خودکار برای رکورد مرحله‌ای
    if (!title && stageKey) {
      const label = stageLabelByKey(stageKey)
      if (label) title = kind === 'stage_start' ? `شروع ${label}` : `پایان ${label}`
    }
    if (!title) {
      return NextResponse.json({ error: 'عنوان الزامی است' }, { status: 400 })
    }
    // رکورد مرحله‌ای همیشه گزارش رسمی است و در دسته اجرا ثبت می‌شود
    if (kind !== 'point') category = 'execution'
    const isReportFinal = kind !== 'point' || isReport
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    let date = new Date()
    if (jy && jm && jd) {
      const { jalaliToDate } = await import('@/lib/jalali')
      const d = jalaliToDate(jy, jm, jd)
      if (!Number.isNaN(d.getTime())) date = d
    }

    const images = await saveUploads(formData, 'images')
    const filePaths = await saveUploads(formData, 'files')
    const fileNames = formData.getAll('fileNames').map((n) => String(n))
    const files = filePaths.map((url, i) => ({ name: fileNames[i] || url.split('/').pop() || 'فایل', url }))

    const event = await db.timelineEvent.create({
      data: {
        projectId,
        title,
        description,
        category,
        kind,
        stageKey,
        stageGroup,
        isReport: isReportFinal,
        date,
        images: JSON.stringify(images),
        files: JSON.stringify(files),
        authorId: user.id,
      },
    })
    return NextResponse.json({ event: { id: event.id } })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت رویداد' }, { status: 500 })
  }
}
