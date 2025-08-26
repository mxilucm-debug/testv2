import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for attendance record
const attendanceSchema = z.object({
  userId: z.string(),
  punchInTime: z.string().datetime().optional(),
  punchOutTime: z.string().datetime().optional(),
  punchInLocation: z.string().optional(),
  punchOutLocation: z.string().optional(),
  punchInSelfie: z.string().optional(),
  punchOutSelfie: z.string().optional(),
  shiftId: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day']).default('present'),
  remarks: z.string().optional(),
})

// Helper function to calculate total hours
function calculateTotalHours(punchInTime: Date, punchOutTime: Date): number {
  const diffMs = punchOutTime.getTime() - punchInTime.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
}

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
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
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [attendanceRecords, total] = await Promise.all([
      db.attendanceRecord.findMany({
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
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.attendanceRecord.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

// POST /api/attendance - Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = attendanceSchema.parse(body)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if there's already an attendance record for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingRecord = await db.attendanceRecord.findFirst({
      where: {
        userId: validatedData.userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    let attendanceRecord

    if (existingRecord) {
      // Update existing record
      const updateData: any = { ...validatedData }
      
      // Calculate total hours if both punch in and out times are provided
      if (validatedData.punchInTime && validatedData.punchOutTime) {
        updateData.totalHours = calculateTotalHours(
          new Date(validatedData.punchInTime),
          new Date(validatedData.punchOutTime)
        )
      }

      attendanceRecord = await db.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true
            }
          }
        }
      })
    } else {
      // Create new record
      const createData: any = { ...validatedData }
      
      // Calculate total hours if both punch in and out times are provided
      if (validatedData.punchInTime && validatedData.punchOutTime) {
        createData.totalHours = calculateTotalHours(
          new Date(validatedData.punchInTime),
          new Date(validatedData.punchOutTime)
        )
      }

      attendanceRecord = await db.attendanceRecord.create({
        data: createData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: existingRecord ? 'Attendance record updated successfully' : 'Attendance record created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating/updating attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create/update attendance record' },
      { status: 500 }
    )
  }
}

// POST /api/attendance/punch-in - Punch in
export async function punchIn(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, location, selfie } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already punched in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingRecord = await db.attendanceRecord.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingRecord && existingRecord.punchInTime) {
      return NextResponse.json(
        { success: false, error: 'Already punched in today' },
        { status: 400 }
      )
    }

    // Get user's shift for today
    const shift = await db.shift.findFirst({
      where: {
        workspaceId: user.workspaceId,
        isActive: true
      }
    })

    const now = new Date()
    const punchInData: any = {
      userId,
      punchInTime: now,
      punchInLocation: location ? JSON.stringify(location) : null,
      punchInSelfie: selfie,
      shiftId: shift?.id,
      status: 'present'
    }

    // Determine if late based on shift start time
    if (shift) {
      const [shiftHours, shiftMinutes] = shift.startTime.split(':').map(Number)
      const shiftStartTime = new Date(now)
      shiftStartTime.setHours(shiftHours, shiftMinutes, 0, 0)
      
      if (now > shiftStartTime) {
        const lateMinutes = Math.floor((now.getTime() - shiftStartTime.getTime()) / (1000 * 60))
        if (lateMinutes > (shift.gracePeriod || 0)) {
          punchInData.status = 'late'
        }
      }
    }

    let attendanceRecord

    if (existingRecord) {
      // Update existing record with punch in time
      attendanceRecord = await db.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: punchInData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true
            }
          }
        }
      })
    } else {
      // Create new record
      attendanceRecord = await db.attendanceRecord.create({
        data: punchInData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: 'Punched in successfully'
    })
  } catch (error) {
    console.error('Error punching in:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to punch in' },
      { status: 500 }
    )
  }
}

// POST /api/attendance/punch-out - Punch out
export async function punchOut(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, location, selfie } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Find today's attendance record
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingRecord = await db.attendanceRecord.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (!existingRecord || !existingRecord.punchInTime) {
      return NextResponse.json(
        { success: false, error: 'No punch in record found for today' },
        { status: 400 }
      )
    }

    if (existingRecord.punchOutTime) {
      return NextResponse.json(
        { success: false, error: 'Already punched out today' },
        { status: 400 }
      )
    }

    const now = new Date()
    const punchOutData: any = {
      punchOutTime: now,
      punchOutLocation: location ? JSON.stringify(location) : null,
      punchOutSelfie: selfie
    }

    // Calculate total hours
    const totalHours = calculateTotalHours(
      new Date(existingRecord.punchInTime),
      now
    )
    punchOutData.totalHours = totalHours

    // Update attendance record
    const attendanceRecord = await db.attendanceRecord.update({
      where: { id: existingRecord.id },
      data: punchOutData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: 'Punched out successfully'
    })
  } catch (error) {
    console.error('Error punching out:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to punch out' },
      { status: 500 }
    )
  }
}