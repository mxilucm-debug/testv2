import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for leave request
const leaveRequestSchema = z.object({
  userId: z.string(),
  leaveTypeId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  attachment: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending')
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

// GET /api/leave-requests - Get leave requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status')
    const leaveTypeId = searchParams.get('leaveTypeId')
    const managerId = searchParams.get('managerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (workspaceId) {
      where.user = {
        workspaceId: workspaceId
      }
    }
    
    if (status) {
      where.status = status
    }

    if (leaveTypeId) {
      where.leaveTypeId = leaveTypeId
    }

    if (managerId) {
      where.user = {
        ...where.user,
        reportingManagerId: managerId
      }
    }

    const [leaveRequests, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.leaveRequest.count({ where })
    ])

    // Calculate leave days for each request
    const leaveRequestsWithDays = leaveRequests.map(request => ({
      ...request,
      leaveDays: calculateLeaveDays(new Date(request.startDate), new Date(request.endDate))
    }))

    return NextResponse.json({
      success: true,
      data: leaveRequestsWithDays,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave requests' },
      { status: 500 }
    )
  }
}

// POST /api/leave-requests - Create leave request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = leaveRequestSchema.parse(body)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
      include: { workspace: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if leave type exists and belongs to user's workspace
    const leaveType = await db.leaveType.findFirst({
      where: {
        id: validatedData.leaveTypeId,
        workspaceId: user.workspaceId,
        isActive: true
      }
    })

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found or inactive' },
        { status: 404 }
      )
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before or equal to end date' },
        { status: 400 }
      )
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Start date cannot be in the past' },
        { status: 400 }
      )
    }

    // Check for overlapping leave requests
    const hasOverlap = await hasOverlappingLeave(validatedData.userId, startDate, endDate)
    if (hasOverlap) {
      return NextResponse.json(
        { success: false, error: 'You have overlapping leave requests for this period' },
        { status: 400 }
      )
    }

    // Calculate leave days
    const leaveDays = calculateLeaveDays(startDate, endDate)

    // Check if leave days exceed allowed days (if specified)
    if (leaveType.daysAllowed && leaveDays > leaveType.daysAllowed) {
      return NextResponse.json(
        { success: false, error: `Leave days (${leaveDays}) exceed allowed days (${leaveType.daysAllowed}) for this leave type` },
        { status: 400 }
      )
    }

    const leaveRequest = await db.leaveRequest.create({
      data: validatedData,
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

    // Add leave days to the response
    const leaveRequestWithDays = {
      ...leaveRequest,
      leaveDays
    }

    return NextResponse.json({
      success: true,
      data: leaveRequestWithDays,
      message: 'Leave request created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating leave request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
}