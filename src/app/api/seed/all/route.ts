import { NextRequest, NextResponse } from 'next/server'
import { seedAllData } from '@/lib/seed-all-data'

export async function POST(request: NextRequest) {
  try {
    await seedAllData()
    
    return NextResponse.json({
      success: true,
      message: 'All data seeded successfully'
    })
  } catch (error) {
    console.error('Error seeding all data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed all data' },
      { status: 500 }
    )
  }
}