import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await db.task.findUnique({
      where: {
        id: params.id
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
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
            bonusPoints: true,
            remarks: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Calculate total points for submission
    const taskWithTotalPoints = {
      ...task,
      submission: task.submission ? {
        ...task.submission,
        totalPoints: (task.submission.basePoints || 0) + 
                     (task.submission.qualityPoints || 0) + 
                     (task.submission.bonusPoints || 0)
      } : null
    }

    return NextResponse.json({ success: true, data: taskWithTotalPoints })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, description, objectives, startDate, endDate, assignedTo, priority } = body

    const existingTask = await db.task.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (objectives !== undefined) updateData.objectives = objectives
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (priority !== undefined) updateData.priority = priority

    const updatedTask = await db.task.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedTask })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existingTask = await db.task.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Delete associated submission if exists
    if (existingTask.submission) {
      await db.taskSubmission.delete({
        where: {
          taskId: params.id
        }
      })
    }

    await db.task.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true, message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 })
  }
}