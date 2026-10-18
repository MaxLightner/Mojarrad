import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { hasProjectAccess, ROLE_LABELS } from '@/lib/permissions'

/** پرسش‌وپاسخ روی رفرنس — هر عضو پروژه (به‌جز ناظر) می‌تواند پیام بدهد */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })

  try {
    const { referenceId, text } = await req.json()
    if (!referenceId || !text?.trim()) {
      return NextResponse.json({ error: 'متن پیام الزامی است' }, { status: 400 })
    }
    if (user.role === 'supervisor') {
      return NextResponse.json({ error: 'برای گفتگو روی رفرنس دسترسی ندارید' }, { status: 403 })
    }

    const ref = await db.referenceItem.findUnique({ where: { id: referenceId } })
    if (!ref) return NextResponse.json({ error: 'رفرنس یافت نشد' }, { status: 404 })
    if (!(await hasProjectAccess(user, ref.projectId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
    }

    await db.referenceMessage.create({
      data: {
        referenceId,
        authorId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        text: String(text).trim(),
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت پیام' }, { status: 500 })
  }
}
