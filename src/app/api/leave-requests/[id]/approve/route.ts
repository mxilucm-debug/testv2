import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for leave approval
const approveLeaveSchema = z.object({
  approvedBy: z.string(),
  status: z.enum(['approved', 'rejected']),
  remarks: z.string().optional()
})

interface RouteParams {
  params: { id: string }
}

// POST /api/leave-requests/[id]/approve - Approve or reject leave request
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = approveLeaveSchema.parse(body)

    // Check if leave request exists
    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        leaveType: true
      }
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      )
    }

    // Check if leave request is still pending
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Leave request is already ${leaveRequest.status}` },
        { status: 400 }
      )
    }

    // Check if approver exists
    const approver = await db.user.findUnique({
      where: { id: validatedData.approvedBy }
    })

    if (!approver) {
      return NextResponse.json(
        { success: false, error: 'Approver not found' },
        { status: 404 }
      )
    }

    // Update leave request
    const updatedLeaveRequest = await db.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        approvedBy: validatedData.approvedBy,
        approvedAt: new Date(),
        remarks: validatedData.remarks
      },
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
    const startDate = new Date(updatedLeaveRequest.startDate)
    const endDate = new Date(updatedLeaveRequest.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const leaveRequestWithDays = {
      ...updatedLeaveRequest,
      leaveDays
    }

    return NextResponse.json({
      success: true,
      data: leaveRequestWithDays,
      message: `Leave request ${validatedData.status} successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error approving leave request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve leave request' },
      { status: 500 }
    )
  }
}