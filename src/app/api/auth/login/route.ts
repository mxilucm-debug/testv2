import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const user = await db.user.findFirst({
      where: {
        email,
        isActive: true,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        designation: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if workspace is active
    if (!user.workspace.isActive) {
      return NextResponse.json(
        { success: false, error: 'Workspace is inactive' },
        { status: 401 }
      )
    }

    // Verify password (for demo purposes, we'll use plain text comparison)
    // In production, you should use bcrypt.compare(password, user.password)
    const isPasswordValid = password === user.password // For demo, using plain text
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create user session data (without sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace.name,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      profileImage: user.profileImage,
    }

    // In a real app, you would create and return a JWT token here
    // For demo purposes, we'll return the user data directly
    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        // In production, include JWT token here
        token: 'demo-token-' + Math.random().toString(36).substr(2, 9),
      },
      message: 'Login successful'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}