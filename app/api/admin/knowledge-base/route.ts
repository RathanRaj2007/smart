import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth'
import prisma from '@/lib/db'

// GET /api/admin/knowledge-base — list ALL admin master documents
export async function GET(request: Request) {
  try {
    const response = NextResponse.json({})
    const session = await getAppSession(request, response)

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
    }

    const documents = await prisma.document.findMany({
      where: { docSource: 'ADMIN_MASTER' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { chunks: true } },
      },
    })

    const safe = documents.map((d) => ({
      id: d.id,
      name: d.name,
      originalFilename: d.originalFilename,
      fileType: d.fileType,
      fileSize: d.fileSize,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      docSource: d.docSource,
      chunkCount: d._count.chunks,
    }))

    return NextResponse.json({ documents: safe })
  } catch (err) {
    console.error('Admin KB fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/knowledge-base — upload document as ADMIN_MASTER
export async function POST(request: Request) {
  try {
    const response = NextResponse.json({})
    const session = await getAppSession(request, response)

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    const title = (form.get('title') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const size = file.size
    if (!size || size <= 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 })
    }
    if (size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const ALLOWED_MIME = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const mime = file.type || 'application/octet-stream'
    if (!ALLOWED_MIME.includes(mime)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const { promises: fs } = await import('fs')
    const path = await import('path')
    const storageDir = path.join(process.cwd(), 'storage', 'admin-kb-docs')
    await fs.mkdir(storageDir, { recursive: true })

    const originalFilename = file.name ?? `upload-${Date.now()}`
    const ext = path.extname(originalFilename).toLowerCase()
    const safePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const filename = `${safePrefix}${ext}`
    const storagePath = path.join(storageDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(storagePath, buffer)

    const doc = await prisma.document.create({
      data: {
        name: title || originalFilename,
        originalFilename,
        fileType: ext.replace('.', '').toUpperCase() || mime,
        fileSize: size,
        storagePath,
        status: 'UPLOADED',
        userId: session.userId,
        docSource: 'ADMIN_MASTER',
      },
    })

    const { createAuditLog } = await import('@/lib/audit-log')
    createAuditLog({
      userId: session.userId,
      username: session.username,
      action: 'ADMIN_KB_DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc.id.toString(),
      metadata: { name: doc.name, fileSize: doc.fileSize, fileType: doc.fileType }
    })

    // Kick off background processing
    import('@/lib/knowledge-base/processDocument')
      .then(({ processDocument }) => processDocument(doc.id))
      .catch((e) => console.error('Background processing error:', e))

    return NextResponse.json({ success: true, document: { id: doc.id, status: 'UPLOADED' } }, { status: 202 })
  } catch (err) {
    console.error('Admin KB upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
