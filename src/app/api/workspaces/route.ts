import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for workspace creation
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  notificationEmail: z.string().email('Invalid email address'),
  notificationPhone: z.string().optional(),
  notificationProvider: z.enum(['email', 'whatsapp', 'push']).default('email'),
  workingDays: z.string().default('1,2,3,4,5'),
})

// GET /api/workspaces - Get all workspaces (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const workspaces = await db.workspace.findMany({
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            designations: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: workspaces
    })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}

// POST /api/workspaces - Create new workspace (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createWorkspaceSchema.parse(body)

    // Check if workspace with same name already exists
    const existingWorkspace = await db.workspace.findFirst({
      where: {
        name: validatedData.name
      }
    })

    if (existingWorkspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace with this name already exists' },
        { status: 400 }
      )
    }

    // Create workspace
    const workspace = await db.workspace.create({
      data: validatedData
    })

    // Create default departments for the workspace
    const defaultDepartments = [
      { name: 'Human Resources', description: 'HR Department' },
      { name: 'Engineering', description: 'Engineering Department' },
      { name: 'Finance', description: 'Finance Department' },
      { name: 'Operations', description: 'Operations Department' },
    ]

    await db.department.createMany({
      data: defaultDepartments.map(dept => ({
        ...dept,
        workspaceId: workspace.id
      }))
    })

    // Create default designations for the workspace
    const defaultDesignations = [
      { name: 'CEO', description: 'Chief Executive Officer' },
      { name: 'Manager', description: 'Department Manager' },
      { name: 'Senior Employee', description: 'Senior Level Employee' },
      { name: 'Employee', description: 'Regular Employee' },
      { name: 'Intern', description: 'Intern' },
    ]

    await db.designation.createMany({
      data: defaultDesignations.map(designation => ({
        ...designation,
        workspaceId: workspace.id
      }))
    })

    // Create default leave types for the workspace
    const defaultLeaveTypes = [
      { name: 'Annual Leave', description: 'Paid annual leave', daysAllowed: 20, isPaid: true },
      { name: 'Sick Leave', description: 'Paid sick leave', daysAllowed: 12, isPaid: true },
      { name: 'Casual Leave', description: 'Paid casual leave', daysAllowed: 8, isPaid: true },
      { name: 'Maternity Leave', description: 'Paid maternity leave', daysAllowed: 180, isPaid: true },
      { name: 'Paternity Leave', description: 'Paid paternity leave', daysAllowed: 15, isPaid: true },
    ]

    await db.leaveType.createMany({
      data: defaultLeaveTypes.map(leaveType => ({
        ...leaveType,
        workspaceId: workspace.id
      }))
    })

    // Create default shifts for the workspace
    const defaultShifts = [
      { name: 'General Shift', startTime: '09:00', endTime: '18:00', breakTime: 60, gracePeriod: 15 },
      { name: 'Morning Shift', startTime: '06:00', endTime: '15:00', breakTime: 30, gracePeriod: 15 },
      { name: 'Evening Shift', startTime: '14:00', endTime: '23:00', breakTime: 30, gracePeriod: 15 },
      { name: 'Night Shift', startTime: '22:00', endTime: '07:00', breakTime: 45, gracePeriod: 15 },
    ]

    await db.shift.createMany({
      data: defaultShifts.map(shift => ({
        ...shift,
        workspaceId: workspace.id
      }))
    })

    return NextResponse.json({
      success: true,
      data: workspace,
      message: 'Workspace created successfully with default settings'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}