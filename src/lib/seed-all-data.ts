import { db } from './db'

export async function seedAllData() {
  try {
    console.log('Seeding all data...')

    // Seed demo users first
    const { seedDemoUsers } = await import('./seed-demo-users')
    await seedDemoUsers()

    // Seed shifts for each workspace
    const workspaces = await db.workspace.findMany()
    
    for (const workspace of workspaces) {
      // Create default shift if it doesn't exist
      const existingShift = await db.shift.findFirst({
        where: {
          workspaceId: workspace.id,
          name: 'General Shift'
        }
      })

      if (!existingShift) {
        await db.shift.create({
          data: {
            name: 'General Shift',
            startTime: '09:00',
            endTime: '18:00',
            breakTime: 60,
            gracePeriod: 15,
            workspaceId: workspace.id,
            isActive: true
          }
        })
        console.log(`Created General Shift for workspace: ${workspace.name}`)
      }

      // Create leave types
      const leaveTypes = [
        { name: 'Casual Leave', daysAllowed: 12, isPaid: true },
        { name: 'Sick Leave', daysAllowed: 12, isPaid: true },
        { name: 'Earned Leave', daysAllowed: 15, isPaid: true },
        { name: 'Maternity Leave', daysAllowed: 180, isPaid: true },
        { name: 'Paternity Leave', daysAllowed: 15, isPaid: true },
        { name: 'Unpaid Leave', daysAllowed: 0, isPaid: false }
      ]

      for (const leaveType of leaveTypes) {
        const existingLeaveType = await db.leaveType.findFirst({
          where: {
            workspaceId: workspace.id,
            name: leaveType.name
          }
        })

        if (!existingLeaveType) {
          await db.leaveType.create({
            data: {
              name: leaveType.name,
              daysAllowed: leaveType.daysAllowed,
              isPaid: leaveType.isPaid,
              workspaceId: workspace.id,
              isActive: true
            }
          })
          console.log(`Created leave type: ${leaveType.name} for workspace: ${workspace.name}`)
        }
      }

      // Create some holidays
      const holidays = [
        { name: 'New Year', date: new Date(new Date().getFullYear(), 0, 1) },
        { name: 'Republic Day', date: new Date(new Date().getFullYear(), 0, 26) },
        { name: 'Independence Day', date: new Date(new Date().getFullYear(), 7, 15) },
        { name: 'Diwali', date: new Date(new Date().getFullYear(), 10, 1) },
        { name: 'Christmas', date: new Date(new Date().getFullYear(), 11, 25) }
      ]

      for (const holiday of holidays) {
        const existingHoliday = await db.holiday.findFirst({
          where: {
            workspaceId: workspace.id,
            name: holiday.name,
            date: holiday.date
          }
        })

        if (!existingHoliday) {
          await db.holiday.create({
            data: {
              name: holiday.name,
              date: holiday.date,
              isRecurring: true,
              workspaceId: workspace.id
            }
          })
          console.log(`Created holiday: ${holiday.name} for workspace: ${workspace.name}`)
        }
      }
    }

    console.log('All data seeded successfully!')
  } catch (error) {
    console.error('Error seeding data:', error)
    throw error
  }
}

// Run this function if called directly
if (require.main === module) {
  seedAllData()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}