import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo tasks...')

  // Get demo workspace and users
  const workspace = await prisma.workspace.findFirst({
    where: { name: 'TechCorp' }
  })

  if (!workspace) {
    console.error('Demo workspace not found')
    return
  }

  const users = await prisma.user.findMany({
    where: { workspaceId: workspace.id },
    take: 5
  })

  if (users.length < 2) {
    console.error('Not enough users found in workspace')
    return
  }

  // Create demo tasks
  const demoTasks = [
    {
      title: 'Complete Q4 Performance Review',
      description: 'Prepare and submit the quarterly performance review for all team members',
      objectives: '• Review individual performance metrics\n• Identify areas for improvement\n• Set goals for next quarter\n• Provide constructive feedback',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      assignedTo: users[1].id,
      assignedBy: users[0].id,
      priority: 'high',
      status: 'in_progress'
    },
    {
      title: 'Update Employee Handbook',
      description: 'Review and update the company employee handbook with new policies and procedures',
      objectives: '• Review current policies\n• Add new remote work guidelines\n• Update code of conduct\n• Get legal review',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-15'),
      assignedTo: users[1].id,
      assignedBy: users[0].id,
      priority: 'medium',
      status: 'pending'
    },
    {
      title: 'Implement New Training Program',
      description: 'Develop and implement a comprehensive training program for new hires',
      objectives: '• Create training materials\n• Schedule training sessions\n• Assess training effectiveness\n• Gather feedback from participants',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-31'),
      assignedTo: users[1].id,
      assignedBy: users[0].id,
      priority: 'high',
      status: 'pending'
    },
    {
      title: 'Monthly Report Analysis',
      description: 'Analyze monthly departmental reports and present findings to management',
      objectives: '• Collect monthly data\n• Analyze trends and patterns\n• Create presentation slides\n• Present to management team',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-10'),
      assignedTo: users[1].id,
      assignedBy: users[0].id,
      priority: 'medium',
      status: 'completed'
    },
    {
      title: 'Client Onboarding Process Improvement',
      description: 'Streamline the client onboarding process to improve efficiency and client satisfaction',
      objectives: '• Map current onboarding process\n• Identify bottlenecks\n• Design improved workflow\n• Implement and test new process',
      startDate: new Date('2023-12-01'),
      endDate: new Date('2024-01-15'),
      assignedTo: users[1].id,
      assignedBy: users[0].id,
      priority: 'high',
      status: 'overdue'
    }
  ]

  for (const taskData of demoTasks) {
    const existingTask = await prisma.task.findFirst({
      where: {
        title: taskData.title,
        assignedTo: taskData.assignedTo
      }
    })

    if (!existingTask) {
      await prisma.task.create({
        data: taskData
      })
      console.log(`Created task: ${taskData.title}`)
    } else {
      console.log(`Task already exists: ${taskData.title}`)
    }
  }

  // Create a demo task submission
  const completedTask = await prisma.task.findFirst({
    where: {
      title: 'Monthly Report Analysis',
      status: 'completed'
    }
  })

  if (completedTask) {
    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        taskId: completedTask.id
      }
    })

    if (!existingSubmission) {
      await prisma.taskSubmission.create({
        data: {
          taskId: completedTask.id,
          userId: completedTask.assignedTo,
          report: 'Successfully completed the monthly report analysis. Identified key trends in sales performance and customer satisfaction. Presented findings to management with actionable recommendations for improvement.',
          basePoints: 85,
          qualityPoints: 40,
          bonusPoints: 15,
          status: 'approved'
        }
      })
      console.log('Created demo task submission')
    }
  }

  console.log('Demo tasks seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })