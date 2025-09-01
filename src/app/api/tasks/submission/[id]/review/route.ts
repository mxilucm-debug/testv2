import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      reviewerId,
      reviewerRole,
      status, // 'approved' | 'rejected'
      qualityPoints,
      bonusPoints,
      remarks,
      workspaceId
    } = body

    if (!reviewerId || !reviewerRole || !status || !workspaceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reviewer ID, role, status, and workspace ID are required' 
      }, { status: 400 })
    }

    // Get the submission with task details
    const submission = await db.taskSubmission.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: {
            assignee: true,
            creator: true
          }
        },
        user: true
      }
    })

    if (!submission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task submission not found' 
      }, { status: 404 })
    }

    // Check if submission is already reviewed
    if (submission.status !== 'pending_review') {
      return NextResponse.json({ 
        success: false, 
        error: 'Task submission is already reviewed' 
      }, { status: 400 })
    }

    // Verify reviewer exists and belongs to workspace
    const reviewer = await db.user.findFirst({
      where: {
        id: reviewerId,
        workspaceId: workspaceId
      }
    })

    if (!reviewer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reviewer not found in workspace' 
      }, { status: 404 })
    }

    // Calculate automatic base points (5 points for on-time submission)
    let basePoints = 0
    const task = submission.task
    const submittedAt = new Date(submission.submittedAt)
    const dueAt = task.dueAt ? new Date(task.dueAt) : null

    if (dueAt && submittedAt <= dueAt) {
      basePoints = 5 // Default 5 points for on-time submission
    }

    // Update submission with review details
    const updatedSubmission = await db.taskSubmission.update({
      where: { id: params.id },
      data: {
        status: status,
        basePoints: basePoints,
        qualityPoints: qualityPoints || 0,
        bonusPoints: bonusPoints || 0,
        remarks: remarks || null
      },
      include: {
        task: {
          include: {
            assignee: true,
            creator: true
          }
        },
        user: true
      }
    })

    // Update task status to DONE if approved
    if (status === 'approved') {
      await db.task.update({
        where: { id: task.id },
        data: { status: 'DONE' }
      })
    }

    // Calculate total points
    const totalPoints = basePoints + (qualityPoints || 0) + (bonusPoints || 0)

    const submissionWithTotalPoints = {
      ...updatedSubmission,
      totalPoints
    }

    return NextResponse.json({ 
      success: true, 
      data: submissionWithTotalPoints,
      message: `Task submission ${status} successfully`
    })
  } catch (error) {
    console.error('Error reviewing task submission:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to review task submission' 
    }, { status: 500 })
  }
}

// GET endpoint to check if submission needs escalation
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submission = await db.taskSubmission.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: {
            assignee: true,
            creator: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task submission not found' 
      }, { status: 404 })
    }

    // Check if submission needs escalation (pending for more than 48 hours)
    const submittedAt = new Date(submission.submittedAt)
    const now = new Date()
    const hoursSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
    const needsEscalation = hoursSinceSubmission > 48 && submission.status === 'pending_review'

    return NextResponse.json({ 
      success: true, 
      data: {
        submission,
        needsEscalation,
        hoursSinceSubmission: Math.round(hoursSinceSubmission)
      }
    })
  } catch (error) {
    console.error('Error checking submission escalation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check submission escalation' 
    }, { status: 500 })
  }
}
