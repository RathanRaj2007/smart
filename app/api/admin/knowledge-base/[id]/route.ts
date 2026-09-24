import { NextResponse, NextRequest } from 'next/server'
import { getAppSession } from '@/lib/auth'
import prisma from '@/lib/db'

// DELETE /api/admin/knowledge-base/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const response = NextResponse.json({})
    const session = await getAppSession(request, response)

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
    }

    const { id: idStr } = await context.params
    const id = parseInt(idStr, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    if (doc.docSource !== 'ADMIN_MASTER') {
      return NextResponse.json({ error: 'Not an admin master document' }, { status: 400 })
    }

    // Delete file from disk (best-effort)
    try {
      const { promises: fs } = await import('fs')
      if (doc.storagePath) await fs.unlink(doc.storagePath)
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException
      if (err?.code !== 'ENOENT') console.error('File delete error:', e)
    }

    // Delete admin document (chunks cascade automatically)
    await prisma.document.delete({ where: { id } })

    const { createAuditLog } = await import('@/lib/audit-log')
    createAuditLog({
      userId: session.userId,
      username: session.username,
      action: 'ADMIN_KB_DOCUMENT_DELETED',
      entityType: 'Document',
      entityId: id.toString(),
      metadata: { name: doc.name }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin KB delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
