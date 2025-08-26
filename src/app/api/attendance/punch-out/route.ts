import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to calculate total hours
function calculateTotalHours(punchInTime: Date, punchOutTime: Date): number {
  const diffMs = punchOutTime.getTime() - punchInTime.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
}

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