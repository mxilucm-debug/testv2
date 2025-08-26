"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Target,
  DollarSign,
  FileText,
  AlertCircle,
  TrendingUp,
  LogOut,
  Plus,
  Download,
  Bell
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface EmployeeStats {
  attendanceRate: number
  tasksCompleted: number
  tasksPending: number
  leaveBalance: {
    annual: number
    sick: number
    casual: number
  }
  performanceScore: number
  onTimeAttendance: number
}

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  progress: number
  points: number
}

interface LeaveRequest {
  id: string
  type: string
  startDate: string
  endDate: string
  status: "pending" | "approved" | "rejected"
  days: number
}

interface Payslip {
  id: string
  month: string
  year: string
  grossSalary: number
  netSalary: number
  status: "generated" | "pending"
}

interface Announcement {
  id: string
  title: string
  message: string
  date: string
  priority: "low" | "medium" | "high"
}

export function EmployeeDashboard() {
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    attendanceRate: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    leaveBalance: {
      annual: 0,
      sick: 0,
      casual: 0
    },
    performanceScore: 0,
    onTimeAttendance: 0
  })

  const [tasks, setTasks] = useState<Task[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    // Mock data - in real app, this would come from API
    const mockEmployeeStats: EmployeeStats = {
      attendanceRate: 94,
      tasksCompleted: 8,
      tasksPending: 3,
      leaveBalance: {
        annual: 15,
        sick: 8,
        casual: 5
      },
      performanceScore: 87,
      onTimeAttendance: 91
    }

    const mockTasks: Task[] = [
      { 
        id: "1", 
        title: "Complete user profile", 
        description: "Fill in all personal and professional details", 
        dueDate: "2024-01-18", 
        priority: "high", 
        status: "in_progress", 
        progress: 75,
        points: 100
      },
      { 
        id: "2", 
        title: "Submit timesheet", 
        description: "Weekly timesheet submission", 
        dueDate: "2024-01-19", 
        priority: "medium", 
        status: "pending", 
        progress: 0,
        points: 50
      },
      { 
        id: "3", 
        title: "Attend training session", 
        description: "Mandatory security training", 
        dueDate: "2024-01-20", 
        priority: "high", 
        status: "pending", 
        progress: 0,
        points: 75
      },
      { 
        id: "4", 
        title: "Code review", 
        description: "Review pull requests from team", 
        dueDate: "2024-01-17", 
        priority: "medium", 
        status: "completed", 
        progress: 100,
        points: 60
      }
    ]

    const mockLeaveRequests: LeaveRequest[] = [
      { id: "1", type: "Annual Leave", startDate: "2024-01-25", endDate: "2024-01-26", status: "approved", days: 2 },
      { id: "2", type: "Sick Leave", startDate: "2024-01-10", endDate: "2024-01-10", status: "approved", days: 1 }
    ]

    const mockPayslips: Payslip[] = [
      { id: "1", month: "December", year: "2023", grossSalary: 8500, netSalary: 7200, status: "generated" },
      { id: "2", month: "November", year: "2023", grossSalary: 8500, netSalary: 7200, status: "generated" },
      { id: "3", month: "October", year: "2023", grossSalary: 8500, netSalary: 7200, status: "generated" }
    ]

    const mockAnnouncements: Announcement[] = [
      { 
        id: "1", 
        title: "Company Holiday", 
        message: "Monday will be a holiday for Republic Day", 
        date: "2024-01-15", 
        priority: "medium" 
      },
      { 
        id: "2", 
        title: "Training Session", 
        message: "New security training mandatory for all employees", 
        date: "2024-01-14", 
        priority: "high" 
      },
      { 
        id: "3", 
        title: "Office Renovation", 
        message: "Office will be renovated next weekend", 
        date: "2024-01-13", 
        priority: "low" 
      }
    ]

    setEmployeeStats(mockEmployeeStats)
    setTasks(mockTasks)
    setLeaveRequests(mockLeaveRequests)
    setPayslips(mockPayslips)
    setAnnouncements(mockAnnouncements)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const leaveBalanceData = [
    { name: "Annual", value: employeeStats.leaveBalance.annual, color: "#3b82f6" },
    { name: "Sick", value: employeeStats.leaveBalance.sick, color: "#22c55e" },
    { name: "Casual", value: employeeStats.leaveBalance.casual, color: "#f59e0b" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, John! Here's your overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {employeeStats.onTimeAttendance}% on time
              </p>
              <Progress value={employeeStats.attendanceRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground">
                {employeeStats.tasksPending} pending
              </p>
              <Progress 
                value={(employeeStats.tasksCompleted / (employeeStats.tasksCompleted + employeeStats.tasksPending)) * 100} 
                className="mt-2 h-2" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.performanceScore}%</div>
              <p className="text-xs text-muted-foreground">
                Above average
              </p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Excellent</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employeeStats.leaveBalance.annual + employeeStats.leaveBalance.sick + employeeStats.leaveBalance.casual}
              </div>
              <p className="text-xs text-muted-foreground">
                Total days available
              </p>
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {employeeStats.leaveBalance.annual}A
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {employeeStats.leaveBalance.sick}S
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {employeeStats.leaveBalance.casual}C
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leave Balance Chart and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>Your available leave days by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leaveBalanceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {leaveBalanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Your current task assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                        <Progress value={task.progress} className="mt-1 h-2" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{task.points}pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Announcements and Payslips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Latest company updates and notices</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            {announcement.title}
                            <Badge className={getPriorityColor(announcement.priority)}>
                              {announcement.priority}
                            </Badge>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {announcement.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {announcement.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Payslips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Payslips</CardTitle>
              <CardDescription>Your salary statements and downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{payslip.month} {payslip.year}</h4>
                        <p className="text-xs text-muted-foreground">
                          Gross: ${payslip.grossSalary.toLocaleString()} • Net: ${payslip.netSalary.toLocaleString()}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {payslip.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common employee tasks and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Apply Leave</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Clock className="h-6 w-6" />
                <span className="text-sm">Mark Attendance</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">View Payslips</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <User className="h-6 w-6" />
                <span className="text-sm">Update Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}