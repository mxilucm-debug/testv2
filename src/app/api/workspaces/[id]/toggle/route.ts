import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for workspace toggle
const toggleWorkspaceSchema = z.object({
  isActive: z.boolean(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// PATCH /api/workspaces/[id]/toggle - Toggle workspace active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { isActive } = toggleWorkspaceSchema.parse(body)

    // Check if workspace exists
    const existingWorkspace = await db.workspace.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingWorkspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Toggle workspace status
    const workspace = await db.workspace.update({
      where: {
        id: params.id
      },
      data: {
        isActive
      },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            designations: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: workspace,
      message: `Workspace ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error toggling workspace status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle workspace status' },
      { status: 500 }
    )
  }
}