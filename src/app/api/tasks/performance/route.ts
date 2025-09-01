import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    const period = searchParams.get('period') || 'all' // 'week', 'month', 'quarter', 'all'

    if (!workspaceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Workspace ID is required' 
      }, { status: 400 })
    }

    let dateFilter: any = {}
    
    // Apply date filter based on period
    if (period !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        default:
          startDate = new Date(0)
      }
      
      dateFilter = {
        gte: startDate
      }
    }

    // Get all tasks for the workspace with submissions
    const tasks = await db.task.findMany({
      where: {
        assignee: {
          workspaceId: workspaceId
        },
        ...(userId && { assignedTo: userId }),
        createdAt: dateFilter
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            role: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        submission: {
          select: {
            id: true,
            status: true,
            basePoints: true,
            qualityPoints: true,
            bonusPoints: true,
            submittedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate performance metrics
    const performanceData = tasks.reduce((acc, task) => {
      const userId = task.assignedTo
      
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: task.assignee.name,
          userEmail: task.assignee.email,
          employeeId: task.assignee.employeeId,
          role: task.assignee.role,
          department: task.assignee.department?.name,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          totalPointsEarned: 0,
          totalPossiblePoints: 0,
          onTimeSubmissions: 0,
          lateSubmissions: 0,
          averageQualityScore: 0,
          totalBonusPoints: 0
        }
      }

      acc[userId].totalTasks++
      
      // Check if task is overdue
      const now = new Date()
      const isOverdue = task.dueAt ? new Date(task.dueAt) < now && task.status !== 'DONE' : false
      
      if (isOverdue) {
        acc[userId].overdueTasks++
      }

      if (task.status === 'DONE') {
        acc[userId].completedTasks++
      } else if (task.status === 'OPEN') {
        acc[userId].pendingTasks++
      }

      // Calculate points for submissions
      if (task.submission) {
        const submission = task.submission
        const totalPoints = (submission.basePoints || 0) + 
                           (submission.qualityPoints || 0) + 
                           (submission.bonusPoints || 0)
        
        acc[userId].totalPointsEarned += totalPoints
        acc[userId].totalBonusPoints += submission.bonusPoints || 0

        // Check if submission was on time
        const submittedAt = new Date(submission.submittedAt)
        const dueAt = task.dueAt ? new Date(task.dueAt) : null
        
        if (dueAt && submittedAt <= dueAt) {
          acc[userId].onTimeSubmissions++
        } else {
          acc[userId].lateSubmissions++
        }

        // Calculate average quality score
        if (submission.qualityPoints && submission.qualityPoints > 0) {
          const currentAvg = acc[userId].averageQualityScore
          const completedCount = acc[userId].completedTasks
          acc[userId].averageQualityScore = ((currentAvg * (completedCount - 1)) + submission.qualityPoints) / completedCount
        }
      }

      // Calculate total possible points (assuming 5 base points + potential quality + bonus)
      acc[userId].totalPossiblePoints += 5 + 10 + 5 // Base + Max Quality + Max Bonus

      return acc
    }, {} as Record<string, any>)

    // Convert to array and calculate additional metrics
    const performanceArray = Object.values(performanceData).map((user: any) => {
      const completionRate = user.totalTasks > 0 ? (user.completedTasks / user.totalTasks) * 100 : 0
      const pointsEfficiency = user.totalPossiblePoints > 0 ? (user.totalPointsEarned / user.totalPossiblePoints) * 100 : 0
      const onTimeRate = (user.onTimeSubmissions + user.lateSubmissions) > 0 ? 
        (user.onTimeSubmissions / (user.onTimeSubmissions + user.lateSubmissions)) * 100 : 0

      return {
        ...user,
        completionRate: Math.round(completionRate * 100) / 100,
        pointsEfficiency: Math.round(pointsEfficiency * 100) / 100,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        averageQualityScore: Math.round(user.averageQualityScore * 100) / 100
      }
    })

    // Sort by total points earned (descending)
    performanceArray.sort((a: any, b: any) => b.totalPointsEarned - a.totalPointsEarned)

    // Calculate workspace-wide statistics
    const workspaceStats = {
      totalUsers: performanceArray.length,
      totalTasks: performanceArray.reduce((sum: number, user: any) => sum + user.totalTasks, 0),
      totalCompletedTasks: performanceArray.reduce((sum: number, user: any) => sum + user.completedTasks, 0),
      totalPointsEarned: performanceArray.reduce((sum: number, user: any) => sum + user.totalPointsEarned, 0),
      averageCompletionRate: performanceArray.length > 0 ? 
        performanceArray.reduce((sum: number, user: any) => sum + user.completionRate, 0) / performanceArray.length : 0,
      averagePointsEfficiency: performanceArray.length > 0 ? 
        performanceArray.reduce((sum: number, user: any) => sum + user.pointsEfficiency, 0) / performanceArray.length : 0
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        users: performanceArray,
        workspaceStats,
        period
      }
    })
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch performance data' 
    }, { status: 500 })
  }
}
