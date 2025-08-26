import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')

    if (!userId || !workspaceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and workspace ID are required' 
      }, { status: 400 })
    }

    // Verify user exists and belongs to workspace
    const user = await db.user.findFirst({
      where: {
        id: userId,
        workspaceId: workspaceId
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in workspace' 
      }, { status: 404 })
    }

    // Get tasks assigned to the user
    const tasks = await db.task.findMany({
      where: {
        assignedTo: userId,
        assignee: {
          workspaceId: workspaceId
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        submission: {
          select: {
            id: true,
            report: true,
            fileUrl: true,
            submittedAt: true,
            status: true,
            basePoints: true,
            qualityPoints: true,
            bonusPoints: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate total points for submissions and check for overdue tasks
    const tasksWithDetails = tasks.map(task => {
      const now = new Date()
      const isOverdue = task.dueAt ? new Date(task.dueAt) < now && task.status !== 'DONE' : false
      
      return {
        ...task,
        isOverdue,
        submission: task.submission ? {
          ...task.submission,
          totalPoints: (task.submission.basePoints || 0) + 
                       (task.submission.qualityPoints || 0) + 
                       (task.submission.bonusPoints || 0)
        } : null
      }
    })

    return NextResponse.json({ success: true, data: tasksWithDetails })
  } catch (error) {
    console.error('Error fetching assigned tasks:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch assigned tasks' }, { status: 500 })
  }
}