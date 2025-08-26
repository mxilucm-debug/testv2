import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for workspace update
const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').optional(),
  notificationEmail: z.string().email('Invalid email address').optional(),
  notificationPhone: z.string().optional(),
  notificationProvider: z.enum(['email', 'whatsapp', 'push']).optional(),
  workingDays: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Validation schema for workspace toggle
const toggleWorkspaceSchema = z.object({
  isActive: z.boolean(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/workspaces/[id] - Get single workspace
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const workspace = await db.workspace.findUnique({
      where: {
        id: params.id
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

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: workspace
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workspace' },
      { status: 500 }
    )
  }
}

// PUT /api/workspaces/[id] - Update workspace
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateWorkspaceSchema.parse(body)

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

    // Check if workspace with same name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingWorkspace.name) {
      const nameExists = await db.workspace.findFirst({
        where: {
          name: validatedData.name,
          id: { not: params.id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Workspace with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update workspace
    const workspace = await db.workspace.update({
      where: {
        id: params.id
      },
      data: validatedData,
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
      message: 'Workspace updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workspace' },
      { status: 500 }
    )
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if workspace exists
    const existingWorkspace = await db.workspace.findUnique({
      where: {
        id: params.id
      },
      include: {
        _count: {
          select: {
            users: true,
          }
        }
      }
    })

    if (!existingWorkspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Check if workspace has users
    if (existingWorkspace._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete workspace with active users' },
        { status: 400 }
      )
    }

    // Delete workspace (cascade delete will handle related records)
    await db.workspace.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Workspace deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workspace' },
      { status: 500 }
    )
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