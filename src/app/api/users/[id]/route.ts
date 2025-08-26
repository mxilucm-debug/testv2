import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  employeeId: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  workspaceId: z.string().min(1, "Workspace is required").optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  contactNumber: z.string().optional(),
  dateOfJoining: z.string().optional(),
  lastWorkingDay: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        workspace: true,
        department: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email already exists for different user
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Check if employee ID already exists for different user
    if (validatedData.employeeId && validatedData.employeeId !== existingUser.employeeId) {
      const employeeIdExists = await db.user.findUnique({
        where: { employeeId: validatedData.employeeId }
      })

      if (employeeIdExists) {
        return NextResponse.json(
          { success: false, error: 'Employee ID already exists' },
          { status: 400 }
        )
      }
    }

    // Update the user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.employeeId && { employeeId: validatedData.employeeId }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.workspaceId && { workspaceId: validatedData.workspaceId }),
        ...(validatedData.departmentId !== undefined && { departmentId: validatedData.departmentId || null }),
        ...(validatedData.designationId !== undefined && { designationId: validatedData.designationId || null }),
        ...(validatedData.reportingManagerId !== undefined && { reportingManagerId: validatedData.reportingManagerId || null }),
        ...(validatedData.contactNumber !== undefined && { contactNumber: validatedData.contactNumber }),
        ...(validatedData.dateOfJoining && { dateOfJoining: new Date(validatedData.dateOfJoining) }),
        ...(validatedData.lastWorkingDay !== undefined && { lastWorkingDay: validatedData.lastWorkingDay ? new Date(validatedData.lastWorkingDay) : null }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      include: {
        workspace: true,
        department: true,
        designation: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the user
    await db.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}