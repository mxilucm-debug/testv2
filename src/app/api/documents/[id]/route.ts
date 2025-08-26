import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

// Helper function to get user from request (simplified for demo)
async function getUserFromRequest(request: NextRequest) {
  // In a real app, you would verify the JWT token here
  // For demo purposes, we'll use a hardcoded user
  return {
    id: 'cmepn2wo4000vptfyqbh6cqsj',
    workspaceId: 'cmepn2vxh0007ptfyxsfwyr2w',
    role: 'EMPLOYEE'
  }
}

// GET /api/documents/[id] - Get a specific document
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await db.document.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, type } = await request.json()

    const document = await db.document.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
        isActive: true
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updatedDocument = await db.document.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await db.document.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
        isActive: true
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete the file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', document.fileUrl)
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
    }

    // Soft delete the document
    await db.document.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}