import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import {
  canComment,
  hasProjectAccess,
  canResolveComment,
  allowedVisibilities,
  defaultVisibilityFor,
  COMMENT_VISIBILITY_LABELS,
} from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  try {
    const { eventId, text, imageDataUrl, visibility, needsFollowUp } = await req.json()
    if (!eventId || !text?.trim()) {
      return NextResponse.json({ error: 'متن کامنت الزامی است' }, { status: 400 })
    }
    const event = await db.timelineEvent.findUnique({ where: { id: eventId }, include: { project: true } })
    if (!event) return NextResponse.json({ error: 'رویداد یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, event.projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }
    if (!canComment(user)) {
      return NextResponse.json({ error: 'برای کامنت‌گذاری دسترسی ندارید' }, { status: 403 })
    }

    // مخاطب پیام: نقش‌های مجاز فقط؛ در غیر این صورت مقدار پیش‌فرض نقش
    const allowed = allowedVisibilities(user.role)
    const vis = allowed.includes(visibility) ? visibility : defaultVisibilityFor(user.role)
    const followUp = needsFollowUp === true

    // عکس مشروح‌شده (خط/فلش روی تصویر) — ذخیره فایل و پیوست به کامنت
    let image: string | null = null
    if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
      const m = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/)
      if (m && m[2].length < 3_500_000) {
        const dir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(dir, { recursive: true })
        const name = `annot-${Date.now()}-${randomBytes(6).toString('hex')}.png`
        await writeFile(path.join(dir, name), Buffer.from(m[2], 'base64'))
        image = `/uploads/${name}`
      }
    }

    await db.comment.create({
      data: {
        eventId,
        authorId: user.id,
        text: String(text).trim(),
        image,
        visibility: vis,
        needsFollowUp: followUp,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت کامنت' }, { status: 500 })
  }
}

/** حل پیگیری: نویسنده پیام، مدیر یا مجری می‌تواند اعلام کند انجام شد */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  try {
    const { commentId } = await req.json()
    if (!commentId) return NextResponse.json({ error: 'شناسه کامنت الزامی است' }, { status: 400 })

    const comment = await db.comment.findUnique({ where: { id: commentId } })
    if (!comment) return NextResponse.json({ error: 'کامنت یافت نشد' }, { status: 404 })
    if (!canResolveComment(user, { authorId: comment.authorId })) {
      return NextResponse.json({ error: 'اجازه اعلام انجام ندارید' }, { status: 403 })
    }

    const resolved = !comment.resolvedAt
    await db.comment.update({
      where: { id: commentId },
      data: { resolvedAt: resolved ? new Date() : null },
    })
    return NextResponse.json({ ok: true, resolved, visibility: COMMENT_VISIBILITY_LABELS[comment.visibility] })
  } catch {
    return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 })
  }
}
