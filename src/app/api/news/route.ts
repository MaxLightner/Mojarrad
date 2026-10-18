import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const news = await db.newsItem.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json({ news })
}
