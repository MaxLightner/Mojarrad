import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { accessibleProjects } from '@/lib/permissions'

export async function GET() {
  const user = await getSessionUser()
  let accessible: string[] = []
  if (user) {
    const projects = await accessibleProjects(user)
    accessible = projects.map((p) => p.slug)
  }
  const projects = await db.project.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      category: true,
      status: true,
      location: true,
      area: true,
      year: true,
      progress: true,
      coverImage: true,
      startDate: true,
      endDate: true,
      forSale: true,
      salePrice: true,
      saleDescription: true,
    },
  })
  return NextResponse.json({ projects, accessible })
}
