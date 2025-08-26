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

// GET /api/payroll - Get payroll information
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Build where clause based on parameters
    const where: any = {}

    if (userId) {
      where.userId = userId
    } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      // Non-admin users can only see their own payroll
      where.userId = user.id
    }

    // Get payroll info for users in the workspace
    const payrollInfo = await db.payrollInfo.findMany({
      where: {
        ...where,
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
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    // Calculate salary breakdown for each payroll record
    const payrollWithBreakdown = payrollInfo.map(payroll => {
      const basic = payroll.basicSalary || 0
      const hra = payroll.hra || 0
      const allowances = payroll.otherAllowances || 0
      const grossSalary = basic + hra + allowances
      
      // Simple tax calculation (in real app, this would be more complex)
      const taxRegime = payroll.taxRegime || 'old'
      let tax = 0
      
      if (taxRegime === 'old') {
        // Old regime with deductions
        const taxableIncome = Math.max(0, grossSalary - 50000) // Standard deduction
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
        // New regime without deductions
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

      return {
        ...payroll,
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
    })

    return NextResponse.json(payrollWithBreakdown)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/payroll - Create or update payroll information
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      userId,
      bankAccount,
      bankIfsc,
      bankName,
      taxRegime,
      basicSalary,
      hra,
      otherAllowances
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists and belongs to the same workspace
    const targetUser = await db.user.findFirst({
      where: {
        id: userId,
        workspaceId: user.workspaceId,
        isActive: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if payroll info already exists for the user
    const existingPayroll = await db.payrollInfo.findUnique({
      where: { userId }
    })

    let payrollInfo

    if (existingPayroll) {
      // Update existing payroll info
      payrollInfo = await db.payrollInfo.update({
        where: { userId },
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
    } else {
      // Create new payroll info
      payrollInfo = await db.payrollInfo.create({
        data: {
          userId,
          bankAccount,
          bankIfsc,
          bankName,
          taxRegime: taxRegime || 'old',
          basicSalary,
          hra,
          otherAllowances
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
    }

    return NextResponse.json(payrollInfo)
  } catch (error) {
    console.error('Error creating/updating payroll:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}