import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { hasProjectAccess } from '@/lib/permissions'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await db.project.findUnique({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })

  const user = await getSessionUser()
  let timelineAccess = false
  if (user) timelineAccess = await hasProjectAccess(user, project.id)

  const { gallery, ...rest } = project
  return NextResponse.json({
    project: { ...rest, gallery: JSON.parse(gallery || '[]') },
    timelineAccess,
  })
}
