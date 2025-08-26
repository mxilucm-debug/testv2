import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to get user from request (simplified for demo)
async function getUserFromRequest(request: NextRequest) {
  // In a real app, you would verify the JWT token here
  // For demo purposes, we'll use a hardcoded user
  return {
    id: 'cmepn2wo4000vptfyqbh6cqsj',
    workspaceId: 'cmepn2vxh0007ptfyxsfwyr2w',
    role: 'EMPLOYEE'
  }
}

// GET /api/payroll/[id] - Get specific payroll information
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payrollInfo = await db.payrollInfo.findFirst({
      where: {
        userId: params.id,
        user: {
          workspaceId: user.workspaceId,
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true
              }
            },
            designation: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!payrollInfo) {
      return NextResponse.json({ error: 'Payroll information not found' }, { status: 404 })
    }

    // Check if user has permission to view this payroll info
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.id !== params.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate salary breakdown
    const basic = payrollInfo.basicSalary || 0
    const hra = payrollInfo.hra || 0
    const allowances = payrollInfo.otherAllowances || 0
    const grossSalary = basic + hra + allowances
    
    // Simple tax calculation
    const taxRegime = payrollInfo.taxRegime || 'old'
    let tax = 0
    
    if (taxRegime === 'old') {
      const taxableIncome = Math.max(0, grossSalary - 50000)
      if (taxableIncome <= 250000) {
        tax = 0
      } else if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.2
      } else {
        tax = 112500 + (taxableIncome - 1000000) * 0.3
      }
    } else {
      if (grossSalary <= 250000) {
        tax = 0
      } else if (grossSalary <= 500000) {
        tax = (grossSalary - 250000) * 0.05
      } else if (grossSalary <= 1000000) {
        tax = 12500 + (grossSalary - 500000) * 0.2
      } else {
        tax = 112500 + (grossSalary - 1000000) * 0.3
      }
    }

    const netSalary = grossSalary - tax

    const payrollWithBreakdown = {
      ...payrollInfo,
      salaryBreakdown: {
        basic,
        hra,
        allowances,
        grossSalary,
        tax,
        netSalary,
        taxRegime
      }
    }

    return NextResponse.json(payrollWithBreakdown)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/payroll/[id] - Update payroll information
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      bankAccount,
      bankIfsc,
      bankName,
      taxRegime,
      basicSalary,
      hra,
      otherAllowances
    } = await request.json()

    // Check if payroll info exists and user belongs to workspace
    const existingPayroll = await db.payrollInfo.findFirst({
      where: {
        userId: params.id,
        user: {
          workspaceId: user.workspaceId,
          isActive: true
        }
      }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll information not found' }, { status: 404 })
    }

    const updatedPayroll = await db.payrollInfo.update({
      where: { userId: params.id },
      data: {
        ...(bankAccount !== undefined && { bankAccount }),
        ...(bankIfsc !== undefined && { bankIfsc }),
        ...(bankName !== undefined && { bankName }),
        ...(taxRegime !== undefined && { taxRegime }),
        ...(basicSalary !== undefined && { basicSalary }),
        ...(hra !== undefined && { hra }),
        ...(otherAllowances !== undefined && { otherAllowances })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true
          }
        }
      }
    })

    return NextResponse.json(updatedPayroll)
  } catch (error) {
    console.error('Error updating payroll:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/payroll/[id] - Delete payroll information
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if payroll info exists and user belongs to workspace
    const existingPayroll = await db.payrollInfo.findFirst({
      where: {
        userId: params.id,
        user: {
          workspaceId: user.workspaceId,
          isActive: true
        }
      }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll information not found' }, { status: 404 })
    }

    await db.payrollInfo.delete({
      where: { userId: params.id }
    })

    return NextResponse.json({ message: 'Payroll information deleted successfully' })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}