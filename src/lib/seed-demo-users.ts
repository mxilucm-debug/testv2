import { db } from './db'

interface DemoUser {
  email: string
  password: string
  name: string
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"
  workspaceName: string
  employeeId?: string
  departmentName?: string
  designationName?: string
}

const demoUsers: DemoUser[] = [
  {
    email: "superadmin@hrms.com",
    password: "superadmin123",
    name: "Super Admin",
    role: "SUPER_ADMIN",
    workspaceName: "System",
    employeeId: "SA001"
  },
  {
    email: "admin@techcorp.com",
    password: "admin123",
    name: "John Admin",
    role: "ADMIN",
    workspaceName: "TechCorp",
    employeeId: "TC001",
    departmentName: "Human Resources",
    designationName: "HR Manager"
  },
  {
    email: "manager@techcorp.com",
    password: "manager123",
    name: "Sarah Manager",
    role: "MANAGER",
    workspaceName: "TechCorp",
    employeeId: "TC002",
    departmentName: "Engineering",
    designationName: "Engineering Manager"
  },
  {
    email: "employee@techcorp.com",
    password: "employee123",
    name: "Mike Employee",
    role: "EMPLOYEE",
    workspaceName: "TechCorp",
    employeeId: "TC003",
    departmentName: "Engineering",
    designationName: "Software Developer"
  },
  {
    email: "admin@startupxyz.com",
    password: "admin123",
    name: "Jane Admin",
    role: "ADMIN",
    workspaceName: "StartupXYZ",
    employeeId: "SX001",
    departmentName: "Operations",
    designationName: "Operations Manager"
  },
  {
    email: "manager@startupxyz.com",
    password: "manager123",
    name: "David Manager",
    role: "MANAGER",
    workspaceName: "StartupXYZ",
    employeeId: "SX002",
    departmentName: "Marketing",
    designationName: "Marketing Manager"
  },
  {
    email: "employee@startupxyz.com",
    password: "employee123",
    name: "Lisa Employee",
    role: "EMPLOYEE",
    workspaceName: "StartupXYZ",
    employeeId: "SX003",
    departmentName: "Marketing",
    designationName: "Marketing Specialist"
  }
]

export async function seedDemoUsers() {
  try {
    console.log('Seeding demo users...')

    for (const user of demoUsers) {
      // Find or create workspace
      let workspace = await db.workspace.findFirst({
        where: { name: user.workspaceName }
      })

      if (!workspace) {
        // Create workspace if it doesn't exist
        workspace = await db.workspace.create({
          data: {
            name: user.workspaceName,
            notificationEmail: user.email,
            workingDays: "1,2,3,4,5",
            isActive: true
          }
        })
        console.log(`Created workspace: ${user.workspaceName}`)
      }

      // Find department
      let department = null
      if (user.departmentName) {
        department = await db.department.findFirst({
          where: {
            name: user.departmentName,
            workspaceId: workspace.id
          }
        })

        if (!department) {
          department = await db.department.create({
            data: {
              name: user.departmentName,
              workspaceId: workspace.id,
              isActive: true
            }
          })
          console.log(`Created department: ${user.departmentName}`)
        }
      }

      // Find designation
      let designation = null
      if (user.designationName) {
        designation = await db.designation.findFirst({
          where: {
            name: user.designationName,
            workspaceId: workspace.id
          }
        })

        if (!designation) {
          designation = await db.designation.create({
            data: {
              name: user.designationName,
              workspaceId: workspace.id,
              isActive: true
            }
          })
          console.log(`Created designation: ${user.designationName}`)
        }
      }

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: { email: user.email }
      })

      if (!existingUser) {
        // Create user
        const newUser = await db.user.create({
          data: {
            email: user.email,
            password: user.password, // In production, hash this password
            name: user.name,
            role: user.role,
            workspaceId: workspace.id,
            employeeId: user.employeeId,
            departmentId: department?.id,
            designationId: designation?.id,
            employmentType: "PERMANENT",
            employmentStatus: "ACTIVE",
            dateOfJoining: new Date(),
            isActive: true,
            isEmailVerified: true,
            forcePasswordReset: false
          }
        })

        // Create statutory info
        await db.statutoryInfo.create({
          data: {
            userId: newUser.id
          }
        })

        // Create payroll info
        await db.payrollInfo.create({
          data: {
            userId: newUser.id,
            bankAccount: "1234567890",
            bankIfsc: "HDFC0001234",
            bankName: "HDFC Bank",
            taxRegime: "old"
          }
        })

        console.log(`Created user: ${user.name} (${user.email})`)
      } else {
        console.log(`User already exists: ${user.email}`)
      }
    }

    console.log('Demo users seeded successfully!')
  } catch (error) {
    console.error('Error seeding demo users:', error)
  }
}

// Run this function if called directly
if (require.main === module) {
  seedDemoUsers()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}