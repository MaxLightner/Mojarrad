import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// وضعیت پیمانکاری — فقط مجری و مدیر سیستم
async function guard() {
  const user = await getSessionUser()
  if (!user) return { error: NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (user.role !== 'admin' && user.role !== 'executor') {
    return { error: NextResponse.json({ error: 'این بخش فقط برای مجری و مدیر سیستم است' }, { status: 403 }) }
  }
  return { user }
}

export async function GET(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })

  const info = await db.contractInfo.findUnique({ where: { projectId } })
  return NextResponse.json({ info })
}

export async function PATCH(req: NextRequest) {
  const g = await guard()
  if (g.error) return g.error

  try {
    const body = await req.json()
    const { projectId, contractorName, startDate, endDate, financialStatus, totalPaid, note } = body
    if (!projectId) return NextResponse.json({ error: 'شناسه پروژه الزامی است' }, { status: 400 })
    if (!['balanced', 'debtor', 'creditor'].includes(String(financialStatus))) {
      return NextResponse.json({ error: 'وضعیت حساب نامعتبر است' }, { status: 400 })
    }
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })

    const data = {
      contractorName: String(contractorName || '').trim() || '—',
      startDate: String(startDate || '').trim() || '—',
      endDate: String(endDate || '').trim() || '—',
      financialStatus: String(financialStatus),
      totalPaid: String(totalPaid || '').trim() || '—',
      note: note?.trim() || null,
    }

    const info = await db.contractInfo.upsert({
      where: { projectId },
      update: data,
      create: { projectId, ...data },
    })
    return NextResponse.json({ info })
  } catch {
    return NextResponse.json({ error: 'خطا در ذخیره وضعیت پیمانکاری' }, { status: 500 })
  }
}
