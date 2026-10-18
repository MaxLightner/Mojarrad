import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const officials = await db.official.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ officials })
}
