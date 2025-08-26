import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating leave request
const updateLeaveRequestSchema = z.object({
  leaveTypeId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reason: z.string().optional(),
  attachment: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional()
})

// Helper function to calculate leave days
function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end dates
}

// Helper function to check for overlapping leave requests
async function hasOverlappingLeave(userId: string, startDate: Date, endDate: Date, excludeRequestId?: string): Promise<boolean> {
  const where: any = {
    userId,
    status: { in: ['pending', 'approved'] },
    OR: [
      {
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      }
    ]
  }

  if (excludeRequestId) {
    where.id = { not: excludeRequestId }
  }

  const overlappingRequests = await db.leaveRequest.count({ where })
  return overlappingRequests > 0
}

interface RouteParams {
  params: { id: string }
}

// GET /api/leave-requests/[id] - Get single leave request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true
              }
            },
            designation: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            isPaid: true,
            daysAllowed: true
          }
        }
      }
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      )
    }

    // Calculate leave days
    const leaveDays = calculateLeaveDays(new Date(leaveRequest.startDate), new Date(leaveRequest.endDate))

    const leaveRequestWithDays = {
      ...leaveRequest,
      leaveDays
    }

    return NextResponse.json({
      success: true,
      data: leaveRequestWithDays
    })
  } catch (error) {
    console.error('Error fetching leave request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave request' },
      { status: 500 }
    )
  }
}

// PUT /api/leave-requests/[id] - Update leave request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateLeaveRequestSchema.parse(body)

    // Check if leave request exists
    const existingLeaveRequest = await db.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        leaveType: true
      }
    })

    if (!existingLeaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      )
    }

    // If status is being changed to approved or rejected, set approvedBy and approvedAt
    let updateData = { ...validatedData }
    if (validatedData.status && validatedData.status !== existingLeaveRequest.status) {
      if (validatedData.status === 'approved' || validatedData.status === 'rejected') {
        updateData.approvedAt = new Date()
      } else if (validatedData.status === 'pending') {
        updateData.approvedBy = null
        updateData.approvedAt = null
      }
    }

    // Validate dates if they are being updated
    let startDate = existingLeaveRequest.startDate
    let endDate = existingLeaveRequest.endDate

    if (validatedData.startDate) {
      startDate = new Date(validatedData.startDate)
    }
    if (validatedData.endDate) {
      endDate = new Date(validatedData.endDate)
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before or equal to end date' },
        { status: 400 }
      )
    }

    // Check for overlapping leave requests (excluding current request)
    if (validatedData.startDate || validatedData.endDate) {
      const hasOverlap = await hasOverlappingLeave(
        existingLeaveRequest.userId, 
        startDate, 
        endDate, 
        params.id
      )
      if (hasOverlap) {
        return NextResponse.json(
          { success: false, error: 'You have overlapping leave requests for this period' },
          { status: 400 }
        )
      }
    }

    // Check leave type if it's being updated
    if (validatedData.leaveTypeId) {
      const leaveType = await db.leaveType.findFirst({
        where: {
          id: validatedData.leaveTypeId,
          workspaceId: existingLeaveRequest.user.workspaceId,
          isActive: true
        }
      })

      if (!leaveType) {
        return NextResponse.json(
          { success: false, error: 'Leave type not found or inactive' },
          { status: 404 }
        )
      }
    }

    const leaveRequest = await db.leaveRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true
              }
            },
            designation: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            isPaid: true,
            daysAllowed: true
          }
        }
      }
    })

    // Calculate leave days
    const leaveDays = calculateLeaveDays(new Date(leaveRequest.startDate), new Date(leaveRequest.endDate))

    const leaveRequestWithDays = {
      ...leaveRequest,
      leaveDays
    }

    return NextResponse.json({
      success: true,
      data: leaveRequestWithDays,
      message: 'Leave request updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating leave request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update leave request' },
      { status: 500 }
    )
  }
}

// DELETE /api/leave-requests/[id] - Delete leave request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if leave request exists
    const existingLeaveRequest = await db.leaveRequest.findUnique({
      where: { id: params.id }
    })

    if (!existingLeaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      )
    }

    // Cannot delete approved leave requests
    if (existingLeaveRequest.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete approved leave requests' },
        { status: 400 }
      )
    }

    await db.leaveRequest.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting leave request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete leave request' },
      { status: 500 }
    )
  }
}