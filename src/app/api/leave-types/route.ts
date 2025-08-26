import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for leave type
const leaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  daysAllowed: z.number().min(0, 'Days allowed must be non-negative').optional(),
  isPaid: z.boolean().default(true),
  workspaceId: z.string(),
  isActive: z.boolean().default(true)
})

// GET /api/leave-types - Get leave types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (workspaceId) {
      where.workspaceId = workspaceId
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const leaveTypes = await db.leaveType.findMany({
      where,
      include: {
        _count: {
          select: {
            leaveRequests: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: leaveTypes
    })
  } catch (error) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave types' },
      { status: 500 }
    )
  }
}

// POST /api/leave-types - Create leave type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = leaveTypeSchema.parse(body)

    // Check if leave type with same name already exists in workspace
    const existingLeaveType = await db.leaveType.findFirst({
      where: {
        name: validatedData.name,
        workspaceId: validatedData.workspaceId
      }
    })

    if (existingLeaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type with this name already exists in the workspace' },
        { status: 400 }
      )
    }

    const leaveType = await db.leaveType.create({
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
      message: 'Leave type created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating leave type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create leave type' },
      { status: 500 }
    )
  }
}