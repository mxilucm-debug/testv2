import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import path from 'path'
import { mkdir } from 'fs/promises'

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

// GET /api/documents - Get all documents for the current user/workspace
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const workspaceId = searchParams.get('workspaceId')

    // Build where clause based on parameters
    const where: any = {
      isActive: true
    }

    if (userId) {
      where.userId = userId
    }

    if (type) {
      where.type = type
    }

    if (workspaceId) {
      where.workspaceId = workspaceId
    } else {
      // Default to user's workspace
      where.workspaceId = user.workspaceId
    }

    const documents = await db.document.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/documents - Upload a new document
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.error('Error creating uploads directory:', error)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const filePath = path.join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record in database
    const document = await db.document.create({
      data: {
        name,
        type,
        fileUrl: `/uploads/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        userId: userId || user.id,
        workspaceId: user.workspaceId
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

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}