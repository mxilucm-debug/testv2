import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
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