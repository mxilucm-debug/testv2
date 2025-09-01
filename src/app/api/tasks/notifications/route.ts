import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    const type = searchParams.get('type') // 'pending_reviews', 'escalations', 'all'

    if (!userId || !workspaceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and workspace ID are required' 
      }, { status: 400 })
    }

    // Get user's role
    const user = await db.user.findFirst({
      where: {
        id: userId,
        workspaceId: workspaceId
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    let notifications: any[] = []

    // Get pending reviews for managers/admins
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      const pendingReviews = await db.taskSubmission.findMany({
        where: {
          status: 'pending_review',
          task: {
            assignee: {
              workspaceId: workspaceId,
              ...(user.role === 'MANAGER' && { reportingManagerId: userId })
            }
          }
        },
        include: {
          task: {
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      })

      // Add escalation notifications
      const escalatedReviews = pendingReviews.filter(review => {
        const submittedAt = new Date(review.submittedAt)
        const now = new Date()
        const hoursSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
        return hoursSinceSubmission > 48
      })

      notifications = [
        ...pendingReviews.map(review => ({
          id: `review_${review.id}`,
          type: 'pending_review',
          title: 'Task Review Required',
          message: `Task "${review.task.title}" submitted by ${review.user.name} needs your review`,
          priority: 'medium',
          createdAt: review.submittedAt,
          data: review
        })),
        ...escalatedReviews.map(review => ({
          id: `escalation_${review.id}`,
          type: 'escalation',
          title: 'Review Escalation',
          message: `Task "${review.task.title}" has been pending review for over 48 hours`,
          priority: 'high',
          createdAt: review.submittedAt,
          data: review
        }))
      ]
    }

    // Get notifications for employees about their submissions
    const userSubmissions = await db.taskSubmission.findMany({
      where: {
        userId: userId,
        status: {
          in: ['approved', 'rejected']
        }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10 // Recent notifications only
    })

    const submissionNotifications = userSubmissions.map(submission => ({
      id: `submission_${submission.id}`,
      type: 'submission_reviewed',
      title: `Task ${submission.status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your submission for "${submission.task.title}" has been ${submission.status}`,
      priority: submission.status === 'approved' ? 'low' : 'medium',
      createdAt: submission.submittedAt,
      data: submission
    }))

    notifications = [...notifications, ...submissionNotifications]

    // Sort by priority and creation date
    notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ 
      success: true, 
      data: notifications 
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      workspaceId,
      type,
      title,
      message,
      priority,
      data
    } = body

    if (!userId || !workspaceId || !type || !title || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID, workspace ID, type, title, and message are required' 
      }, { status: 400 })
    }

    // In a real application, you would store notifications in a database
    // For now, we'll just return success
    const notification = {
      id: `notification_${Date.now()}`,
      type,
      title,
      message,
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      data
    }

    return NextResponse.json({ 
      success: true, 
      data: notification 
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create notification' 
    }, { status: 500 })
  }
}
