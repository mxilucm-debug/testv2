import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      taskId,
      userId,
      report,
      fileUrl
    } = body

    if (!taskId || !userId || !report) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task ID, user ID, and report are required' 
      }, { status: 400 })
    }

    // Check if task exists and is assigned to the user
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        assignedTo: userId
      }
    })

    if (!task) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task not found or not assigned to this user' 
      }, { status: 404 })
    }

    // Check if submission already exists
    const existingSubmission = await db.taskSubmission.findUnique({
      where: {
        taskId: taskId
      }
    })

    if (existingSubmission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task already submitted' 
      }, { status: 400 })
    }

    // Create submission
    const submission = await db.taskSubmission.create({
      data: {
        taskId: taskId,
        userId: userId,
        report: report,
        fileUrl: fileUrl || null,
        basePoints: 0, // Will be calculated during review
        qualityPoints: 0, // Will be assigned during review
        bonusPoints: 0, // Will be assigned during review
        status: 'pending_review'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    // Update task status to IN_PROGRESS if it's still OPEN
    if (task.status === 'OPEN') {
      await db.task.update({
        where: {
          id: taskId
        },
        data: {
          status: 'IN_PROGRESS'
        }
      })
    }

    // Calculate total points (will be 0 until reviewed)
    const totalPoints = (submission.basePoints || 0) + 
                       (submission.qualityPoints || 0) + 
                       (submission.bonusPoints || 0)

    const submissionWithTotalPoints = {
      ...submission,
      totalPoints
    }

    return NextResponse.json({ success: true, data: submissionWithTotalPoints })
  } catch (error) {
    console.error('Error creating task submission:', error)
    return NextResponse.json({ success: false, error: 'Failed to create task submission' }, { status: 500 })
  }
}