import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to calculate used leave days
async function calculateUsedLeaveDays(userId: string, leaveTypeId: string, year: number): Promise<number> {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)

  const approvedLeaveRequests = await db.leaveRequest.findMany({
    where: {
      userId,
      leaveTypeId,
      status: 'approved',
      startDate: {
        gte: startOfYear
      },
      endDate: {
        lte: endOfYear
      }
    }
  })

  let totalUsedDays = 0
  for (const request of approvedLeaveRequests) {
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    totalUsedDays += leaveDays
  }

  return totalUsedDays
}

// Helper function to calculate pending leave days
async function calculatePendingLeaveDays(userId: string, leaveTypeId: string, year: number): Promise<number> {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)

  const pendingLeaveRequests = await db.leaveRequest.findMany({
    where: {
      userId,
      leaveTypeId,
      status: 'pending',
      startDate: {
        gte: startOfYear
      },
      endDate: {
        lte: endOfYear
      }
    }
  })

  let totalPendingDays = 0
  for (const request of pendingLeaveRequests) {
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    totalPendingDays += leaveDays
  }

  return totalPendingDays
}

// GET /api/leave-balance - Get leave balance for users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    if (!userId && !workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Either userId or workspaceId is required' },
        { status: 400 }
      )
    }

    let users = []
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          workspace: {
            include: {
              leaveTypes: {
                where: { isActive: true }
              }
            }
          }
        }
      })
      if (user) {
        users = [user]
      }
    } else {
      users = await db.user.findMany({
        where: { workspaceId },
        include: {
          workspace: {
            include: {
              leaveTypes: {
                where: { isActive: true }
              }
            }
          }
        }
      })
    }

    const leaveBalances = []

    for (const user of users) {
      const userLeaveBalances = []

      for (const leaveType of user.workspace.leaveTypes) {
        const usedDays = await calculateUsedLeaveDays(user.id, leaveType.id, year)
        const pendingDays = await calculatePendingLeaveDays(user.id, leaveType.id, year)
        const totalAllowed = leaveType.daysAllowed || 0
        const remainingDays = Math.max(0, totalAllowed - usedDays)

        userLeaveBalances.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          employeeId: user.employeeId,
          leaveType: {
            id: leaveType.id,
            name: leaveType.name,
            isPaid: leaveType.isPaid,
            daysAllowed: leaveType.daysAllowed
          },
          usedDays,
          pendingDays,
          remainingDays,
          totalAllowed,
          year
        })
      }

      leaveBalances.push(...userLeaveBalances)
    }

    return NextResponse.json({
      success: true,
      data: leaveBalances
    })
  } catch (error) {
    console.error('Error fetching leave balance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave balance' },
      { status: 500 }
    )
  }
}