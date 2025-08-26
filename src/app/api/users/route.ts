import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  workspaceId: z.string().min(1, "Workspace is required"),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  contactNumber: z.string().optional(),
  dateOfJoining: z.string().optional(),
  lastWorkingDay: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const role = searchParams.get('role')

    let whereClause: any = {}
    
    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }
    
    if (role) {
      whereClause.role = role
    }

    const users = await db.user.findMany({
      where: whereClause,
      include: {
        workspace: true,
        department: true,
        designation: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace.name,
      department: user.department ? {
        id: user.department.id,
        name: user.department.name
      } : undefined,
      designation: user.designation ? {
        id: user.designation.id,
        name: user.designation.name
      } : undefined,
      contactNumber: user.contactNumber,
      dateOfJoining: user.dateOfJoining?.toISOString(),
      employmentStatus: user.employmentStatus,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: transformedUsers
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if employee ID already exists
    if (validatedData.employeeId) {
      const existingEmployeeId = await db.user.findUnique({
        where: { employeeId: validatedData.employeeId }
      })

      if (existingEmployeeId) {
        return NextResponse.json(
          { success: false, error: 'Employee ID already exists' },
          { status: 400 }
        )
      }
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8)

    // Create the user
    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        employeeId: validatedData.employeeId,
        role: validatedData.role,
        workspaceId: validatedData.workspaceId,
        departmentId: validatedData.departmentId || null,
        designationId: validatedData.designationId || null,
        reportingManagerId: validatedData.reportingManagerId || null,
        contactNumber: validatedData.contactNumber,
        dateOfJoining: validatedData.dateOfJoining ? new Date(validatedData.dateOfJoining) : null,
        lastWorkingDay: validatedData.lastWorkingDay ? new Date(validatedData.lastWorkingDay) : null,
        isActive: validatedData.isActive ?? true,
        password: validatedData.password, // In production, hash this password
        forcePasswordReset: true,
      },
      include: {
        workspace: true,
        department: true,
        designation: true,
      }
    })

    // Transform the data to match the frontend interface
    const transformedUser = {
      id: newUser.id,
      email: newUser.email,
      employeeId: newUser.employeeId,
      name: newUser.name,
      profileImage: newUser.profileImage,
      role: newUser.role,
      workspaceId: newUser.workspaceId,
      workspaceName: newUser.workspace.name,
      department: newUser.department ? {
        id: newUser.department.id,
        name: newUser.department.name
      } : undefined,
      designation: newUser.designation ? {
        id: newUser.designation.id,
        name: newUser.designation.name
      } : undefined,
      contactNumber: newUser.contactNumber,
      dateOfJoining: newUser.dateOfJoining?.toISOString(),
      employmentStatus: newUser.employmentStatus,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: transformedUser,
      message: 'User created successfully.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}