import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions'
import { ROLE_LABELS } from '@/lib/permissions'
import { randomBytes } from 'crypto'
import { mkdir, stat, rm } from 'fs/promises'
import path from 'path'
import { ZipArchive } from 'archiver'
import { createWriteStream } from 'fs'

export const runtime = 'nodejs'

/* آرشیو پروژه: کل سابقه در یک فایل ZIP ذخیره → پروژه از دیتابیس حذف می‌شود
 * زیپ شامل: خروجی JSON کامل + همه فایل‌های مرتبط (عکس‌ها، رسیدها، اسناد)
 * فقط مدیر سیستم می‌تواند آرشیو کند */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'فقط مدیر سیستم می‌تواند پروژه را آرشیو کند' }, { status: 403 })
  }
  const { slug } = await params

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      events: {
        orderBy: { date: 'asc' },
        include: { comments: { orderBy: { createdAt: 'asc' }, include: { author: true } }, author: true, eventImages: true },
      },
      documents: true,
      workers: true,
      accesses: { include: { user: true } },
      contractInfo: true,
      referenceItems: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
      payments: true,
    },
  })
  if (!project) return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 })

  try {
    /* ===== ۱) خروجی JSON کامل ===== */
    const json2 = (s: string | null) => JSON.parse(s || '[]')
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.fullName,
      project: {
        ...project,
        gallery: json2(project.gallery),
        events: project.events.map((e) => ({
          id: e.id,
          date: e.date,
          category: e.category,
          kind: e.kind,
          stageKey: e.stageKey,
          stageGroup: e.stageGroup,
          title: e.title,
          description: e.description,
          isReport: e.isReport,
          images: json2(e.images),
          files: json2(e.files),
          authorName: e.author?.fullName || null,
          authorRole: e.author ? ROLE_LABELS[e.author.role] || e.author.role : null,
          pendingImages: e.eventImages.map((i) => ({ url: i.url, caption: i.caption, status: i.status })),
          comments: e.comments.map((c) => ({
            at: c.createdAt,
            authorName: c.author.fullName,
            authorRole: ROLE_LABELS[c.author.role] || c.author.role,
            text: c.text,
            image: c.image,
            visibility: c.visibility,
            needsFollowUp: c.needsFollowUp,
            resolvedAt: c.resolvedAt,
          })),
        })),
        documents: project.documents,
        workers: project.workers,
        contractInfo: project.contractInfo,
        references: project.referenceItems.map((r) => ({
          title: r.title,
          category: r.category,
          description: r.description,
          fileUrl: r.fileUrl,
          version: r.version,
          status: r.status,
          addedByName: r.addedByName,
          messages: r.messages.map((m) => ({
            at: m.createdAt,
            authorName: m.authorName,
            authorRole: m.authorRole,
            text: m.text,
          })),
        })),
        payments: project.payments.map((p) => ({
          date: p.date,
          amount: p.amount,
          description: p.description,
          receiptImage: p.receiptImage,
          addedByName: p.addedByName,
        })),
        members: project.accesses.map((a) => ({
          fullName: a.user.fullName,
          role: ROLE_LABELS[a.user.role] || a.user.role,
          username: a.user.username,
        })),
      },
    }

    const commentCount = project.events.reduce((n, e) => n + e.comments.length, 0)
    const photoCount =
      project.events.reduce((n, e) => n + json2(e.images).length + e.eventImages.length, 0) +
      project.events.reduce((n, e) => n + e.comments.filter((c) => c.image).length, 0) +
      project.payments.filter((p) => p.receiptImage).length +
      project.referenceItems.filter((r) => r.fileUrl).length

    /* ===== ۲) ساخت ZIP ===== */
    const dir = path.join(process.cwd(), 'archives')
    await mkdir(dir, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `archive-${project.slug}-${stamp}-${randomBytes(3).toString('hex')}.zip`
    const zipPath = path.join(dir, fileName)

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath)
      const archive = new ZipArchive({ zlib: { level: 9 } })
      output.on('close', resolve)
      output.on('error', reject)
      archive.on('error', reject)
      archive.pipe(output)
      archive.append(Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8'), { name: 'project-data.json' })
      archive.append(
        Buffer.from(
          `آرشیو پروژه «${project.title}»\n` +
            `تاریخ آرشیو: ${new Date().toLocaleString('fa-IR')}\n` +
            `آرشیوکننده: ${user.fullName}\n\n` +
            `این بسته شامل:\n` +
            `- project-data.json: کل داده‌های پروژه (رویدادها، گفتگوها، پرداخت‌ها، اسناد، رفرنس‌ها، اعضا)\n` +
            `- files/: همه فایل‌های مرتبط (عکس رویدادها، پیام‌ها، رسیدها، اسناد)\n\n` +
            `این پروژه از داشبورد حذف شده و این فایل تنها سابقهٔ کامل آن است.`,
          'utf-8',
        ),
        { name: 'README.txt' },
      )

      /* فایل‌های محلی مرتبط — از public سرو می‌شوند */
      const urlToLocal = (u: unknown) => {
        const url = typeof u === 'string' ? u : (u && typeof u === 'object' && 'url' in (u as object) ? String((u as { url?: unknown }).url ?? '') : '')
        if (!url || !url.startsWith('/')) return null
        return path.join(process.cwd(), 'public', url.replace(/^\//, ''))
      }
      const addFile = async (url: string, prefix: string) => {
        const local = urlToLocal(url)
        if (!local) return
        try {
          const st = await stat(local)
          if (st.isFile() && st.size > 0 && st.size < 30 * 1024 * 1024) {
            archive.file(local, { name: `files/${prefix}/${path.basename(local)}` })
          }
        } catch {
          /* فایل نبود — نادیده بگیر */
        }
      }
      const addAll = async (urls: string[], prefix: string) => {
        for (const u of urls) await addFile(u, prefix)
      }

      const jobs: Promise<void>[] = []
      for (let i = 0; i < project.events.length; i++) {
        const e = project.events[i]
        jobs.push(addAll(json2(e.images), `event-${String(i + 1).padStart(2, '0')}`))
        for (const c of e.comments) if (c.image) jobs.push(addFile(c.image, `comments`))
        for (const ei of e.eventImages) jobs.push(addFile(ei.url, `event-${String(i + 1).padStart(2, '0')}-pending`))
        jobs.push(addAll(json2(e.files), `event-${String(i + 1).padStart(2, '0')}`))
      }
      for (const p of project.payments) if (p.receiptImage) jobs.push(addFile(p.receiptImage, 'payments'))
      for (const r of project.referenceItems) if (r.fileUrl) jobs.push(addFile(r.fileUrl, 'references'))
      for (const d of project.documents) if (d.fileUrl) jobs.push(addFile(d.fileUrl, 'documents'))
      jobs.push(addFile(project.coverImage, 'project'))
      jobs.push(addAll(json2(project.gallery), 'project'))

      Promise.all(jobs)
        .then(() => archive.finalize())
        .catch(reject)
    })

    const st = await stat(zipPath)
    await db.projectArchive.create({
      data: {
        projectTitle: project.title,
        slug: project.slug,
        fileName,
        sizeBytes: st.size,
        eventCount: project.events.length,
        summary: JSON.stringify({
          events: project.events.length,
          comments: commentCount,
          photos: photoCount,
          payments: project.payments.length,
          documents: project.documents.length,
          references: project.referenceItems.length,
          workers: project.workers.length,
          members: project.accesses.length,
        }),
        createdById: user.id,
        createdByName: user.fullName,
      },
    })

    /* ===== ۳) حذف پروژه (کاسکید: رویدادها/کامنت‌ها/اسناد/...) ===== */
    await db.project.delete({ where: { id: project.id } })

    /* فایل‌های آپلودی این پروژه از دیسک هم پاک شوند (داخل ZIP هستند) */
    const removeLocal = async (url: string) => {
      if (!url || !url.startsWith('/uploads/')) return
      try {
        await rm(path.join(process.cwd(), 'public', url.replace(/^\//, '')))
      } catch {
        /* ignore */
      }
    }
    for (const e of project.events) {
      for (const img of json2(e.images)) await removeLocal(img)
      for (const ei of e.eventImages) await removeLocal(ei.url)
      for (const c of e.comments) if (c.image) await removeLocal(c.image)
      for (const f of json2(e.files)) await removeLocal(f.url)
    }
    for (const p of project.payments) if (p.receiptImage) await removeLocal(p.receiptImage)
    for (const r of project.referenceItems) if (r.fileUrl) await removeLocal(r.fileUrl)
    for (const d of project.documents) if (d.fileUrl) await removeLocal(d.fileUrl)

    return NextResponse.json({
      ok: true,
      fileName,
      sizeBytes: st.size,
      summary: { events: project.events.length, comments: commentCount, photos: photoCount },
    })
  } catch (e) {
    console.error('archive error', e)
    return NextResponse.json({ error: 'خطا در ساخت آرشیو' }, { status: 500 })
  }
}
