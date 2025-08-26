import { NextRequest, NextResponse } from 'next/server'
import { seedDemoUsers } from '@/lib/seed-demo-users'

export async function POST(request: NextRequest) {
  try {
    await seedDemoUsers()
    
    return NextResponse.json({
      success: true,
      message: 'Demo users seeded successfully'
    })
  } catch (error) {
    console.error('Error seeding demo users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed demo users' },
      { status: 500 }
    )
  }
}