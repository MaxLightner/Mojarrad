import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TYPES = ['consulting', 'supplier', 'contractor', 'sale']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, name, phone, company, field, message } = body
    if (!TYPES.includes(type)) return NextResponse.json({ error: 'نوع درخواست نامعتبر' }, { status: 400 })
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'نام و شماره تماس الزامی است' }, { status: 400 })
    }
    if (!/^[۰-۹0-9+\s-]{8,15}$/.test(String(phone).trim())) {
      return NextResponse.json({ error: 'شماره تماس معتبر نیست' }, { status: 400 })
    }
    await db.requestLead.create({
      data: {
        type,
        name: String(name).trim(),
        phone: String(phone).trim(),
        company: company?.trim() || null,
        field: field?.trim() || null,
        message: String(message || '').trim(),
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطا در ثبت درخواست' }, { status: 500 })
  }
}
