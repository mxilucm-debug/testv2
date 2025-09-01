import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewerId = searchParams.get('reviewerId')
    const reviewerRole = searchParams.get('reviewerRole')
    const workspaceId = searchParams.get('workspaceId')

    if (!reviewerId || !reviewerRole || !workspaceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reviewer ID, role, and workspace ID are required' 
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

    let pendingReviews: any[] = []

    if (reviewerRole === 'ADMIN') {
      // Admin can review all pending submissions
      pendingReviews = await db.taskSubmission.findMany({
        where: {
          status: 'pending_review',
          task: {
            assignee: {
              workspaceId: workspaceId
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      })
    } else if (reviewerRole === 'MANAGER') {
      // Manager can review submissions from their direct reports
      pendingReviews = await db.taskSubmission.findMany({
        where: {
          status: 'pending_review',
          task: {
            assignee: {
              workspaceId: workspaceId,
              reportingManagerId: reviewerId
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      })
    }

    // Add escalation information and calculate total points
    const reviewsWithEscalation = pendingReviews.map(review => {
      const submittedAt = new Date(review.submittedAt)
      const now = new Date()
      const hoursSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
      const needsEscalation = hoursSinceSubmission > 48

      return {
        ...review,
        hoursSinceSubmission: Math.round(hoursSinceSubmission),
        needsEscalation,
        totalPoints: (review.basePoints || 0) + (review.qualityPoints || 0) + (review.bonusPoints || 0)
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: reviewsWithEscalation 
    })
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch pending reviews' 
    }, { status: 500 })
  }
}
