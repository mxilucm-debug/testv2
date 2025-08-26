import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const createdBy = searchParams.get('createdBy')
    const assignedRole = searchParams.get('assignedRole')
    const view = searchParams.get('view') // 'assigned' | 'created' | 'all'
    const currentUserId = searchParams.get('currentUserId')
    const currentUserRole = searchParams.get('currentUserRole')

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace ID is required' }, { status: 400 })
    }

    let whereClause: any = {}

    // Base workspace filter - ensure task belongs to workspace
    whereClause.AND = [
      {
        OR: [
          {
            assignee: {
              workspaceId: workspaceId
            }
          },
          {
            creator: {
              workspaceId: workspaceId
            }
          }
        ]
      }
    ]

    // View-based filtering
    if (view === 'assigned' && currentUserId) {
      whereClause.AND.push({ assignedTo: currentUserId })
    } else if (view === 'created' && currentUserId) {
      whereClause.AND.push({ createdBy: currentUserId })
    }

    // Search filter
    if (search) {
      whereClause.AND.push({
        title: {
          contains: search,
          mode: 'insensitive'
        }
      })
    }

    // Status filter
    if (status && status !== 'all') {
      whereClause.AND.push({ status: status })
    }

    // Priority filter
    if (priority && priority !== 'all') {
      whereClause.AND.push({ priority: priority })
    }

    // Assignee filter
    if (assignedTo && assignedTo !== 'all') {
      whereClause.AND.push({ assignedTo: assignedTo })
    }

    // Creator filter
    if (createdBy && createdBy !== 'all') {
      whereClause.AND.push({ createdBy: createdBy })
    }

    // Assigned role filter
    if (assignedRole && assignedRole !== 'all') {
      whereClause.AND.push({ assignedRole: assignedRole })
    }

    const tasks = await db.task.findMany({
      where: whereClause,
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

    // Calculate total points for submissions
    const tasksWithTotalPoints = tasks.map(task => ({
      ...task,
      submission: task.submission ? {
        ...task.submission,
        totalPoints: (task.submission.basePoints || 0) + 
                     (task.submission.qualityPoints || 0) + 
                     (task.submission.bonusPoints || 0)
      } : null
    }))

    return NextResponse.json({ success: true, data: tasksWithTotalPoints })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      objectives,
      startDate,
      endDate,
      dueAt,
      assignedTo,
      priority,
      workspaceId,
      // Current user info (in real app, this would come from authentication)
      currentUserId,
      currentUserRole
    } = body

    if (!title || !startDate || !assignedTo || !workspaceId || !currentUserId || !currentUserRole) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, start date, assignee, workspace ID, and current user info are required' 
      }, { status: 400 })
    }

    // Check if assignee exists and belongs to workspace
    const assignee = await db.user.findFirst({
      where: {
        id: assignedTo,
        workspaceId: workspaceId
      }
    })

    if (!assignee) {
      return NextResponse.json({ success: false, error: 'Assignee not found in workspace' }, { status: 404 })
    }

    // Check if creator exists and belongs to workspace
    const creator = await db.user.findFirst({
      where: {
        id: currentUserId,
        workspaceId: workspaceId
      }
    })

    if (!creator) {
      return NextResponse.json({ success: false, error: 'Creator not found in workspace' }, { status: 404 })
    }

    // Validate role-based assignment rules
    if (currentUserRole === 'EMPLOYEE' && assignee.role !== 'EMPLOYEE') {
      return NextResponse.json({ 
        success: false, 
        error: 'Employees can only create tasks for other employees' 
      }, { status: 403 })
    }

    // Create task with new schema structure
    const task = await db.task.create({
      data: {
        title,
        description,
        objectives,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        dueAt: dueAt ? new Date(dueAt) : null,
        assignedTo,
        assignedBy: currentUserId,
        assignedRole: assignee.role as any, // Manager | Employee
        createdBy: currentUserId,
        createdRole: currentUserRole as any, // Admin | Manager | Employee
        priority: priority || 'MEDIUM',
        status: 'OPEN'
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

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 })
  }
}