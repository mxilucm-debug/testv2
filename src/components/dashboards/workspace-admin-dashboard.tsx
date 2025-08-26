"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign,
  FileText,
  UserPlus,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Building2
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"

interface EmployeeStats {
  total: number
  active: number
  onLeave: number
  newThisMonth: number
  departments: Array<{
    name: string
    count: number
  }>
}

interface AttendanceStats {
  present: number
  absent: number
  late: number
  halfDay: number
  weeklyData: Array<{
    day: string
    present: number
    absent: number
  }>
}

interface FinancialStats {
  monthlyPayroll: number
  pendingApprovals: number
  budgetUtilization: number
  monthlyTrend: Array<{
    month: string
    amount: number
  }>
}

interface LeaveRequest {
  id: string
  employeeName: string
  type: string
  startDate: string
  endDate: string
  status: "pending" | "approved" | "rejected"
  days: number
}

export function WorkspaceAdminDashboard() {
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    onLeave: 0,
    newThisMonth: 0,
    departments: []
  })
  
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    weeklyData: []
  })
  
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    monthlyPayroll: 0,
    pendingApprovals: 0,
    budgetUtilization: 0,
    monthlyTrend: []
  })
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  useEffect(() => {
    // Mock data - in real app, this would come from API
    const mockEmployeeStats: EmployeeStats = {
      total: 156,
      active: 148,
      onLeave: 8,
      newThisMonth: 12,
      departments: [
        { name: "Engineering", count: 45 },
        { name: "Sales", count: 32 },
        { name: "Marketing", count: 28 },
        { name: "HR", count: 18 },
        { name: "Finance", count: 15 },
        { name: "Operations", count: 18 }
      ]
    }

    const mockAttendanceStats: AttendanceStats = {
      present: 142,
      absent: 8,
      late: 12,
      halfDay: 6,
      weeklyData: [
        { day: "Mon", present: 145, absent: 11 },
        { day: "Tue", present: 148, absent: 8 },
        { day: "Wed", present: 142, absent: 14 },
        { day: "Thu", present: 150, absent: 6 },
        { day: "Fri", present: 146, absent: 10 },
        { day: "Sat", present: 25, absent: 2 },
        { day: "Sun", present: 18, absent: 1 }
      ]
    }

    const mockFinancialStats: FinancialStats = {
      monthlyPayroll: 1250000,
      pendingApprovals: 5,
      budgetUtilization: 78,
      monthlyTrend: [
        { month: "Jan", amount: 1100000 },
        { month: "Feb", amount: 1150000 },
        { month: "Mar", amount: 1200000 },
        { month: "Apr", amount: 1180000 },
        { month: "May", amount: 1220000 },
        { month: "Jun", amount: 1250000 }
      ]
    }

    const mockLeaveRequests: LeaveRequest[] = [
      { id: "1", employeeName: "John Doe", type: "Annual Leave", startDate: "2024-01-15", endDate: "2024-01-17", status: "pending", days: 3 },
      { id: "2", employeeName: "Jane Smith", type: "Sick Leave", startDate: "2024-01-14", endDate: "2024-01-14", status: "pending", days: 1 },
      { id: "3", employeeName: "Mike Johnson", type: "Casual Leave", startDate: "2024-01-16", endDate: "2024-01-16", status: "approved", days: 1 },
      { id: "4", employeeName: "Sarah Wilson", type: "Maternity Leave", startDate: "2024-01-10", endDate: "2024-04-10", status: "approved", days: 90 }
    ]

    setEmployeeStats(mockEmployeeStats)
    setAttendanceStats(mockAttendanceStats)
    setFinancialStats(mockFinancialStats)
    setLeaveRequests(mockLeaveRequests)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Dashboard</h1>
          <p className="text-muted-foreground">TechCorp - Overview and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Workspace Settings
          </Button>
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Employee
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
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{employeeStats.newThisMonth} new this month
              </p>
              <Progress value={(employeeStats.active / employeeStats.total) * 100} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((employeeStats.active / employeeStats.total) * 100)}% active
              </p>
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
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceStats.present}</div>
              <p className="text-xs text-muted-foreground">
                {attendanceStats.absent} absent, {attendanceStats.late} late
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {Math.round((attendanceStats.present / employeeStats.total) * 100)}% present
                </Badge>
              </div>
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
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(financialStats.monthlyPayroll / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">
                {financialStats.pendingApprovals} pending approvals
              </p>
              <Progress value={financialStats.budgetUtilization} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {financialStats.budgetUtilization}% budget utilized
              </p>
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
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaveRequests.filter(lr => lr.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">
                {leaveRequests.filter(lr => lr.status === "approved").length} approved this month
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-yellow-50">
                  {employeeStats.onLeave} on leave today
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Employee count by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeStats.departments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
              <CardDescription>Daily attendance over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceStats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial Trend and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Payroll Trend</CardTitle>
              <CardDescription>Monthly payroll expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={financialStats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Leave Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Requests</CardTitle>
              <CardDescription>Pending and recent leave approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {leaveRequests.slice(0, 6).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{request.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{request.type} • {request.days} days</p>
                        <p className="text-xs text-muted-foreground">
                          {request.startDate} to {request.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.status === "pending" && (
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        )}
                      </div>
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
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Add Employee</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Manage Leave</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generate Reports</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Payroll Run</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}