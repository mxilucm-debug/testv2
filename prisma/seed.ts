import { db } from '../src/lib/db'

async function main() {
  console.log('Seeding database...')

  // Create workspace
  const workspace = await db.workspace.upsert({
    where: { id: 'cmepn2vxh0007ptfyxsfwyr2w' },
    update: {},
    create: {
      id: 'cmepn2vxh0007ptfyxsfwyr2w',
      name: 'TechCorp',
      notificationEmail: 'hr@techcorp.com',
      workingDays: '1,2,3,4,5', // Mon-Fri
    },
  })

  // Create second workspace
  const workspace2 = await db.workspace.upsert({
    where: { id: 'cmepn2vxh0008ptfyxsfwyr2x' },
    update: {},
    create: {
      id: 'cmepn2vxh0008ptfyxsfwyr2x',
      name: 'StartupXYZ',
      notificationEmail: 'hr@startupxyz.com',
      workingDays: '1,2,3,4,5', // Mon-Fri
    },
  })

  // Create demo users
  const users = [
    {
      id: 'cmepn2wo4000vptfyqbh6cqsj',
      email: 'employee@techcorp.com',
      password: 'employee123',
      name: 'Mike Employee',
      employeeId: 'EMP001',
      workspaceId: workspace.id,
      role: 'EMPLOYEE',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2023-01-01'),
    },
    {
      id: 'cmepn2wo4000wptfyqbh6cqsk',
      email: 'manager@techcorp.com',
      password: 'manager123',
      name: 'Sarah Manager',
      employeeId: 'MGR001',
      workspaceId: workspace.id,
      role: 'MANAGER',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2022-06-15'),
    },
    {
      id: 'cmepn2wo4000xptfyqbh6cqsl',
      email: 'admin@techcorp.com',
      password: 'admin123',
      name: 'John Admin',
      employeeId: 'ADM001',
      workspaceId: workspace.id,
      role: 'ADMIN',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2022-01-10'),
    },
    {
      id: 'cmepn2wo4000yptfyqbh6cqsm',
      email: 'superadmin@hrms.com',
      password: 'superadmin123',
      name: 'Super Admin',
      employeeId: 'SUP001',
      workspaceId: workspace.id,
      role: 'SUPER_ADMIN',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2021-01-01'),
    },
    // StartupXYZ users
    {
      id: 'cmepn2wo4000zptfyqbh6cqsn',
      email: 'employee@startupxyz.com',
      password: 'employee123',
      name: 'Lisa Employee',
      employeeId: 'EMP002',
      workspaceId: workspace2.id,
      role: 'EMPLOYEE',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2023-03-15'),
    },
    {
      id: 'cmepn2wo40010ptfyqbh6cqso',
      email: 'manager@startupxyz.com',
      password: 'manager123',
      name: 'David Manager',
      employeeId: 'MGR002',
      workspaceId: workspace2.id,
      role: 'MANAGER',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2022-09-20'),
    },
    {
      id: 'cmepn2wo40011ptfyqbh6cqsp',
      email: 'admin@startupxyz.com',
      password: 'admin123',
      name: 'Jane Admin',
      employeeId: 'ADM002',
      workspaceId: workspace2.id,
      role: 'ADMIN',
      employmentStatus: 'ACTIVE',
      dateOfJoining: new Date('2022-04-05'),
    },
  ]

  for (const userData of users) {
    await db.user.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    })
  }

  // Create shift
  const shift = await db.shift.upsert({
    where: { id: 'cmepn2wo40012ptfyqbh6cqsq' },
    update: {},
    create: {
      id: 'cmepn2wo40012ptfyqbh6cqsq',
      name: 'Regular Shift',
      startTime: '09:00',
      endTime: '18:00',
      breakTime: 60,
      gracePeriod: 15,
      workspaceId: workspace.id,
    },
  })

  // Create leave types
  const casualLeave = await db.leaveType.upsert({
    where: { id: 'cmepn2wo40013ptfyqbh6cqsr' },
    update: {},
    create: {
      id: 'cmepn2wo40013ptfyqbh6cqsr',
      name: 'Casual Leave',
      description: 'For personal emergencies and short leaves',
      daysAllowed: 12,
      isPaid: true,
      workspaceId: workspace.id,
    },
  })

  const sickLeave = await db.leaveType.upsert({
    where: { id: 'cmepn2wo40014ptfyqbh6cqss' },
    update: {},
    create: {
      id: 'cmepn2wo40014ptfyqbh6cqss',
      name: 'Sick Leave',
      description: 'For medical reasons and health issues',
      daysAllowed: 12,
      isPaid: true,
      workspaceId: workspace.id,
    },
  })

  const annualLeave = await db.leaveType.upsert({
    where: { id: 'cmepn2wo40015ptfyqbh6cqst' },
    update: {},
    create: {
      id: 'cmepn2wo40015ptfyqbh6cqst',
      name: 'Annual Leave',
      description: 'For vacation and long-term planning',
      daysAllowed: 20,
      isPaid: true,
      workspaceId: workspace.id,
    },
  })

  // Create some holidays
  const newYear = await db.holiday.upsert({
    where: { id: 'cmepn2wo40016ptfyqbh6cqsu' },
    update: {},
    create: {
      id: 'cmepn2wo40016ptfyqbh6cqsu',
      name: 'New Year',
      date: new Date('2025-01-01'),
      isRecurring: true,
      workspaceId: workspace.id,
    },
  })

  const independenceDay = await db.holiday.upsert({
    where: { id: 'cmepn2wo40017ptfyqbh6cqsv' },
    update: {},
    create: {
      id: 'cmepn2wo40017ptfyqbh6cqsv',
      name: 'Independence Day',
      date: new Date('2025-08-15'),
      isRecurring: true,
      workspaceId: workspace.id,
    },
  })

  console.log('Database seeded successfully!')
  console.log('Workspaces:', workspace.name, workspace2.name)
  console.log('Users:', users.map(u => `${u.name} (${u.email})`).join(', '))
  console.log('Shift:', shift.name)
  console.log('Leave Types:', [casualLeave.name, sickLeave.name, annualLeave.name].join(', '))
  console.log('Holidays:', [newYear.name, independenceDay.name].join(', '))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })