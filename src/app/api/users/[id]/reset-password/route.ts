import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-8)

    // Update user with new password and force reset
    await db.user.update({
      where: { id: params.id },
      data: {
        password: tempPassword, // In production, hash this password
        forcePasswordReset: true,
      }
    })

    // In a real application, you would send an email here
    // For now, we'll just return the new password
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      email: user.email
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}