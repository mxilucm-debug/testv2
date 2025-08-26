import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status. Must be one of: OPEN, IN_PROGRESS, BLOCKED, DONE, CANCELLED' 
      }, { status: 400 })
    }

    const existingTask = await db.task.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await db.task.update({
      where: {
        id: params.id
      },
      data: {
        status: status
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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedTask })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ success: false, error: 'Failed to update task status' }, { status: 500 })
  }
}