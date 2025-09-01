import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

// GET /api/user/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    // For now, let's use a mock user since auth is not set up yet
    // In real implementation, this would use proper authentication
    const mockUserEmail = "john.doe@company.com"

    const user = await db.user.findUnique({
      where: { email: mockUserEmail },
      include: {
        workspace: true,
        department: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true
          }
        },
        statutoryInfo: true,
        payrollInfo: true,
        educationalBackground: true,
        previousEmployment: true,
        documents: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            fileUrl: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      // Create a mock user if none exists
      const workspace = await db.workspace.findFirst()
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      }

      // Check if employeeId already exists and generate a unique one if needed
      let employeeId = "EMP001"
      let counter = 1
      while (true) {
        const existingUser = await db.user.findUnique({
          where: { employeeId }
        })
        if (!existingUser) break
        employeeId = `EMP${counter.toString().padStart(3, '0')}`
        counter++
      }

      const newUser = await db.user.create({
        data: {
          email: mockUserEmail,
          name: "John Doe",
          employeeId: employeeId,
          password: "mockpassword", // In real app, this would be hashed
          workspaceId: workspace.id,
          role: UserRole.EMPLOYEE,
          dateOfJoining: new Date("2022-01-15"),
          employmentType: "PERMANENT",
          employmentStatus: "ACTIVE",
          confirmationDate: new Date("2022-07-15"),
          statutoryInfo: {
            create: {
              pan: "ABCDE1234F",
              aadhaar: "XXXX-XXXX-1234",
              uan: "123456789012",
              epfNumber: "BGGBNG1234567890",
              esiNumber: "1234567890"
            }
          },
          payrollInfo: {
            create: {
              bankAccount: "1234567890",
              bankIfsc: "HDFC0001234",
              bankName: "HDFC Bank",
              taxRegime: "old"
            }
          },
          educationalBackground: {
            create: {
              degree: "B.Tech Computer Science",
              institution: "ABC Engineering College",
              university: "Some University",
              yearOfPassing: 2012,
              percentage: 75.5
            }
          },
          previousEmployment: {
            create: {
              companyName: "Tech Solutions Pvt Ltd",
              position: "Junior Developer",
              duration: "2 years",
              startDate: new Date("2020-01-01"),
              endDate: new Date("2022-01-14"),
              reasonForLeaving: "Career Growth"
            }
          }
        },
        include: {
          workspace: true,
          department: true,
          designation: true,
          reportingManager: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true
            }
          },
          statutoryInfo: true,
          payrollInfo: true,
          educationalBackground: true,
          previousEmployment: true,
          documents: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
              fileUrl: true,
              createdAt: true
            }
          }
        }
      })

      return transformUserProfile(newUser)
    }

    return transformUserProfile(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    // For now, let's use a mock user since auth is not set up yet
    const mockUserEmail = "john.doe@company.com"

    const body = await request.json()
    const { personal, employment, statutory, payroll } = body

    const user = await db.user.findUnique({
      where: { email: mockUserEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update personal information
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(personal && {
          name: personal.name,
          employeeId: personal.employeeId,
          dateOfBirth: personal.dateOfBirth ? new Date(personal.dateOfBirth) : null,
          gender: personal.gender,
          maritalStatus: personal.maritalStatus,
          nationality: personal.nationality,
          contactNumber: personal.contactNumber,
          emergencyContactName: personal.emergencyContactName,
          emergencyContactRelationship: personal.emergencyContactRelationship,
          emergencyContactNumber: personal.emergencyContactNumber,
          currentAddress: personal.currentAddress,
          permanentAddress: personal.permanentAddress
        }),
        ...(employment && {
          dateOfJoining: employment.dateOfJoining ? new Date(employment.dateOfJoining) : null,
          employmentType: employment.employmentType,
          workLocation: employment.workLocation,
          employmentStatus: employment.employmentStatus,
          confirmationDate: employment.confirmationDate ? new Date(employment.confirmationDate) : null
        })
      }
    })

    // Update statutory information if provided
    if (statutory) {
      await db.statutoryInfo.upsert({
        where: { userId: user.id },
        update: {
          pan: statutory.pan,
          aadhaar: statutory.aadhaar,
          uan: statutory.uan,
          epfNumber: statutory.epfNumber,
          esiNumber: statutory.esiNumber
        },
        create: {
          userId: user.id,
          pan: statutory.pan,
          aadhaar: statutory.aadhaar,
          uan: statutory.uan,
          epfNumber: statutory.epfNumber,
          esiNumber: statutory.esiNumber
        }
      })
    }

    // Update payroll information if provided
    if (payroll) {
      await db.payrollInfo.upsert({
        where: { userId: user.id },
        update: {
          bankAccount: payroll.bankAccount,
          bankIfsc: payroll.bankIfsc,
          bankName: payroll.bankName,
          taxRegime: payroll.taxRegime
        },
        create: {
          userId: user.id,
          bankAccount: payroll.bankAccount,
          bankIfsc: payroll.bankIfsc,
          bankName: payroll.bankName,
          taxRegime: payroll.taxRegime
        }
      })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function transformUserProfile(user: any) {
  const profileData = {
    personal: {
      name: user.name,
      employeeId: user.employeeId,
      email: user.email,
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] || null,
      gender: user.gender,
      maritalStatus: user.maritalStatus,
      nationality: user.nationality,
      contactNumber: user.contactNumber,
      emergencyContactName: user.emergencyContactName,
      emergencyContactRelationship: user.emergencyContactRelationship,
      emergencyContactNumber: user.emergencyContactNumber,
      currentAddress: user.currentAddress,
      permanentAddress: user.permanentAddress
    },
    employment: {
      dateOfJoining: user.dateOfJoining?.toISOString().split('T')[0] || null,
      employmentType: user.employmentType,
      department: user.department?.name || null,
      designation: user.designation?.name || null,
      reportingManager: user.reportingManager?.name || null,
      workLocation: user.workLocation,
      employmentStatus: user.employmentStatus,
      confirmationDate: user.confirmationDate?.toISOString().split('T')[0] || null
    },
    statutory: user.statutoryInfo ? {
      pan: user.statutoryInfo.pan,
      aadhaar: user.statutoryInfo.aadhaar,
      uan: user.statutoryInfo.uan,
      epfNumber: user.statutoryInfo.epfNumber,
      esiNumber: user.statutoryInfo.esiNumber
    } : null,
    payroll: user.payrollInfo ? {
      bankAccount: user.payrollInfo.bankAccount,
      bankIfsc: user.payrollInfo.bankIfsc,
      bankName: user.payrollInfo.bankName,
      taxRegime: user.payrollInfo.taxRegime
    } : null,
    education: user.educationalBackground.map((edu: any) => ({
      id: edu.id,
      degree: edu.degree,
      institution: edu.institution,
      university: edu.university,
      yearOfPassing: edu.yearOfPassing,
      percentage: edu.percentage
    })),
    previousEmployment: user.previousEmployment.map((emp: any) => ({
      id: emp.id,
      companyName: emp.companyName,
      position: emp.position,
      duration: emp.duration,
      startDate: emp.startDate?.toISOString().split('T')[0] || null,
      endDate: emp.endDate?.toISOString().split('T')[0] || null,
      reasonForLeaving: emp.reasonForLeaving
    })),
    exit: {
      dateOfResignation: user.lastWorkingDay ? user.lastWorkingDay.toISOString().split('T')[0] : null,
      lastWorkingDay: user.lastWorkingDay?.toISOString().split('T')[0] || null
    },
    documents: user.documents
  }

  return NextResponse.json(profileData)
}