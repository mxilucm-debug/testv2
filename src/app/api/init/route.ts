import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Check if workspace already exists
    let workspace = await db.workspace.findFirst()
    
    if (!workspace) {
      // Create default workspace
      workspace = await db.workspace.create({
        data: {
          name: "Default Workspace",
          notificationEmail: "hr@company.com",
          notificationPhone: "+91 98765 43210",
          notificationProvider: "email",
          workingDays: "1,2,3,4,5", // Mon-Fri
          isActive: true
        }
      })
    }

    // Create default department
    let department = await db.department.findFirst({
      where: { workspaceId: workspace.id }
    })
    
    if (!department) {
      department = await db.department.create({
        data: {
          name: "Engineering",
          workspaceId: workspace.id,
          isActive: true
        }
      })
    }

    // Create default designation
    let designation = await db.designation.findFirst({
      where: { workspaceId: workspace.id }
    })
    
    if (!designation) {
      designation = await db.designation.create({
        data: {
          name: "Software Engineer",
          workspaceId: workspace.id,
          isActive: true
        }
      })
    }

    // Create default leave types
    const leaveTypesCount = await db.leaveType.count({
      where: { workspaceId: workspace.id }
    })
    
    if (leaveTypesCount === 0) {
      await db.leaveType.createMany({
        data: [
          {
            name: "Annual Leave",
            description: "Paid annual leave",
            daysAllowed: 21,
            isPaid: true,
            workspaceId: workspace.id,
            isActive: true
          },
          {
            name: "Sick Leave",
            description: "Paid sick leave",
            daysAllowed: 12,
            isPaid: true,
            workspaceId: workspace.id,
            isActive: true
          },
          {
            name: "Casual Leave",
            description: "Paid casual leave",
            daysAllowed: 7,
            isPaid: true,
            workspaceId: workspace.id,
            isActive: true
          },
          {
            name: "Unpaid Leave",
            description: "Unpaid leave",
            daysAllowed: 0,
            isPaid: false,
            workspaceId: workspace.id,
            isActive: true
          }
        ]
      })
    }

    // Create default shift
    let shift = await db.shift.findFirst({
      where: { workspaceId: workspace.id }
    })
    
    if (!shift) {
      shift = await db.shift.create({
        data: {
          name: "General Shift",
          startTime: "09:00",
          endTime: "18:00",
          breakTime: 60,
          gracePeriod: 15,
          workspaceId: workspace.id,
          isActive: true
        }
      })
    }

    return NextResponse.json({ 
      message: 'Workspace initialized successfully',
      workspace: {
        id: workspace.id,
        name: workspace.name
      }
    })
  } catch (error) {
    console.error('Error initializing workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}