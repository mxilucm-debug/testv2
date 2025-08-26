import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating leave type
const updateLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().optional(),
  daysAllowed: z.number().min(0, 'Days allowed must be non-negative').optional(),
  isPaid: z.boolean().optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: { id: string }
}

// GET /api/leave-types/[id] - Get single leave type
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const leaveType = await db.leaveType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            leaveRequests: true
          }
        }
      }
    })

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: leaveType
    })
  } catch (error) {
    console.error('Error fetching leave type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave type' },
      { status: 500 }
    )
  }
}

// PUT /api/leave-types/[id] - Update leave type
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateLeaveTypeSchema.parse(body)

    // Check if leave type exists
    const existingLeaveType = await db.leaveType.findUnique({
      where: { id: params.id }
    })

    if (!existingLeaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      )
    }

    // Check if name is being updated and if it conflicts with existing leave type
    if (validatedData.name && validatedData.name !== existingLeaveType.name) {
      const nameConflict = await db.leaveType.findFirst({
        where: {
          name: validatedData.name,
          workspaceId: existingLeaveType.workspaceId,
          id: { not: params.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Leave type with this name already exists in the workspace' },
          { status: 400 }
        )
      }
    }

    const leaveType = await db.leaveType.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: {
            leaveRequests: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: leaveType,
      message: 'Leave type updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating leave type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update leave type' },
      { status: 500 }
    )
  }
}

// DELETE /api/leave-types/[id] - Delete leave type
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if leave type exists
    const existingLeaveType = await db.leaveType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            leaveRequests: true
          }
        }
      }
    })

    if (!existingLeaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 404 }
      )
    }

    // Check if leave type has associated leave requests
    if (existingLeaveType._count.leaveRequests > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete leave type with associated leave requests' },
        { status: 400 }
      )
    }

    await db.leaveType.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Leave type deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting leave type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete leave type' },
      { status: 500 }
    )
  }
}