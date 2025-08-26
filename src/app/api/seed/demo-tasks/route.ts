import { NextRequest, NextResponse } from 'next/server'
import { main } from '@/lib/seed-demo-tasks'

export async function POST(request: NextRequest) {
  try {
    await main()
    return NextResponse.json({ 
      success: true, 
      message: 'Demo tasks seeded successfully' 
    })
  } catch (error) {
    console.error('Error seeding demo tasks:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed demo tasks' 
    }, { status: 500 })
  }
}