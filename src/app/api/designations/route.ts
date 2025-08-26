import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const designations = await db.designation.findMany({
      where: {
        workspaceId: workspaceId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: designations
    })
  } catch (error) {
    console.error('Error fetching designations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designations' },
      { status: 500 }
    )
  }
}