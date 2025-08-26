import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace ID is required' }, { status: 400 })
    }

    // Get all tasks for the workspace
    const tasks = await db.task.findMany({
      where: {
        assignee: {
          workspaceId: workspaceId
        }
      }
    })

    // Calculate statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'DONE').length
    const pendingTasks = tasks.filter(task => task.status === 'OPEN').length
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
    
    // Calculate overdue tasks (tasks that are past their due date and not completed)
    const now = new Date()
    const overdueTasks = tasks.filter(task => {
      if (!task.dueAt) return false
      const dueDate = new Date(task.dueAt)
      return dueDate < now && task.status !== 'DONE'
    }).length

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching task stats:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch task stats' }, { status: 500 })
  }
}