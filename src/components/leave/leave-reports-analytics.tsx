"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  PieChart,
  BarChart3,
  Activity,
  Filter,
  CalendarDays,
  Building
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

interface LeaveRequest {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    employeeId?: string
    department?: {
      name: string
    }
    designation?: {
      name: string
    }
  }
  leaveType: {
    id: string
    name: string
    isPaid: boolean
  }
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  leaveDays: number
  createdAt: string
}

interface LeaveAnalytics {
  totalRequests: number
  approvedRequests: number
  rejectedRequests: number
  pendingRequests: number
  approvalRate: number
  averageLeaveDays: number
  totalLeaveDays: number
  monthlyTrend: Array<{
    month: string
    requests: number
    approved: number
  }>
  departmentStats: Array<{
    department: string
    totalRequests: number
    approvedRequests: number
    totalDays: number
    avgDaysPerRequest: number
  }>
  leaveTypeStats: Array<{
    leaveType: string
    count: number
    percentage: number
    totalDays: number
  }>
  topUsers: Array<{
    user: string
    email: string
    department: string
    totalRequests: number
    approvedRequests: number
    totalDays: number
  }>
}

export function LeaveReportsAnalytics() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [analytics, setAnalytics] = useState<LeaveAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    period: '6months', // '1month', '3months', '6months', '1year', 'all'
    department: '',
    status: ''
  })
  const { toast } = useToast()

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"

  // Export functionality
  const handleExportReport = () => {
    try {
      if (!analytics) return

      let csvContent = "data:text/csv;charset=utf-8,"
      
      // Add summary data
      csvContent += "Leave Analytics Summary\n"
      csvContent += `Metric,Value\n`
      csvContent += `Total Requests,${analytics.totalRequests}\n`
      csvContent += `Approved Requests,${analytics.approvedRequests}\n`
      csvContent += `Rejected Requests,${analytics.rejectedRequests}\n`
      csvContent += `Pending Requests,${analytics.pendingRequests}\n`
      csvContent += `Approval Rate,${analytics.approvalRate}%\n`
      csvContent += `Total Leave Days,${analytics.totalLeaveDays}\n`
      csvContent += `Average Leave Days per Request,${analytics.averageLeaveDays}\n\n`
      
      // Add monthly trend data
      csvContent += "Monthly Trend\n"
      csvContent += "Month,Requests,Approved\n"
      analytics.monthlyTrend.forEach(month => {
        csvContent += `${month.month},${month.requests},${month.approved}\n`
      })
      
      // Add department statistics
      csvContent += "\nDepartment Statistics\n"
      csvContent += "Department,Total Requests,Approved Requests,Total Days,Avg Days Per Request\n"
      analytics.departmentStats.forEach(dept => {
        csvContent += `${dept.department},${dept.totalRequests},${dept.approvedRequests},${dept.totalDays},${dept.avgDaysPerRequest}\n`
      })
      
      // Add leave type statistics
      csvContent += "\nLeave Type Statistics\n"
      csvContent += "Leave Type,Count,Percentage,Total Days\n"
      analytics.leaveTypeStats.forEach(type => {
        csvContent += `${type.leaveType},${type.count},${type.percentage}%,${type.totalDays}\n`
      })
      
      // Add top users
      csvContent += "\nTop Users by Leave Days\n"
      csvContent += "User,Email,Department,Total Requests,Approved Requests,Total Days\n"
      analytics.topUsers.forEach(user => {
        csvContent += `${user.user},${user.email},${user.department},${user.totalRequests},${user.approvedRequests},${user.totalDays}\n`
      })
      
      // Create download link
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `leave-analytics-report-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export Successful",
        description: "Leave analytics report has been downloaded successfully",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export leave analytics report",
        variant: "destructive"
      })
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leave-requests?workspaceId=${workspaceId}`)
      const result = await response.json()
      
      if (result.success) {
        setLeaveRequests(result.data)
        calculateAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (requests: LeaveRequest[]) => {
    // Filter requests based on selected period
    const now = new Date()
    let filteredRequests = requests

    switch (filters.period) {
      case '1month':
        const oneMonthAgo = subMonths(now, 1)
        filteredRequests = requests.filter(r => 
          new Date(r.createdAt) >= oneMonthAgo
        )
        break
      case '3months':
        const threeMonthsAgo = subMonths(now, 3)
        filteredRequests = requests.filter(r => 
          new Date(r.createdAt) >= threeMonthsAgo
        )
        break
      case '6months':
        const sixMonthsAgo = subMonths(now, 6)
        filteredRequests = requests.filter(r => 
          new Date(r.createdAt) >= sixMonthsAgo
        )
        break
      case '1year':
        const oneYearAgo = subMonths(now, 12)
        filteredRequests = requests.filter(r => 
          new Date(r.createdAt) >= oneYearAgo
        )
        break
    }

    // Apply additional filters
    if (filters.department && filters.department !== "all") {
      filteredRequests = filteredRequests.filter(r => 
        r.user.department?.name === filters.department
      )
    }

    if (filters.status && filters.status !== "all") {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status)
    }

    // Basic statistics
    const totalRequests = filteredRequests.length
    const approvedRequests = filteredRequests.filter(r => r.status === 'approved').length
    const rejectedRequests = filteredRequests.filter(r => r.status === 'rejected').length
    const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0
    
    const totalLeaveDays = filteredRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.leaveDays, 0)
    
    const averageLeaveDays = approvedRequests > 0 ? totalLeaveDays / approvedRequests : 0

    // Monthly trend
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const monthRequests = filteredRequests.filter(r => 
        isWithinInterval(new Date(r.createdAt), { start: monthStart, end: monthEnd })
      )
      
      const monthApproved = monthRequests.filter(r => r.status === 'approved').length
      
      monthlyTrend.push({
        month: format(monthDate, 'MMM yyyy'),
        requests: monthRequests.length,
        approved: monthApproved
      })
    }

    // Department statistics
    const departmentMap = new Map()
    filteredRequests.forEach(r => {
      const dept = r.user.department?.name || 'Unknown'
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          department: dept,
          totalRequests: 0,
          approvedRequests: 0,
          totalDays: 0
        })
      }
      const deptStats = departmentMap.get(dept)!
      deptStats.totalRequests++
      if (r.status === 'approved') {
        deptStats.approvedRequests++
        deptStats.totalDays += r.leaveDays
      }
    })

    const departmentStats = Array.from(departmentMap.values()).map(dept => ({
      ...dept,
      avgDaysPerRequest: dept.approvedRequests > 0 ? dept.totalDays / dept.approvedRequests : 0
    }))

    // Leave type statistics
    const leaveTypeMap = new Map()
    filteredRequests.forEach(r => {
      const leaveType = r.leaveType.name
      if (!leaveTypeMap.has(leaveType)) {
        leaveTypeMap.set(leaveType, {
          leaveType,
          count: 0,
          totalDays: 0
        })
      }
      const typeStats = leaveTypeMap.get(leaveType)!
      typeStats.count++
      if (r.status === 'approved') {
        typeStats.totalDays += r.leaveDays
      }
    })

    const leaveTypeStats = Array.from(leaveTypeMap.values()).map(type => ({
      ...type,
      percentage: totalRequests > 0 ? (type.count / totalRequests) * 100 : 0
    }))

    // Top users
    const userMap = new Map()
    filteredRequests.forEach(r => {
      if (!userMap.has(r.userId)) {
        userMap.set(r.userId, {
          user: r.user.name,
          email: r.user.email,
          department: r.user.department?.name || 'Unknown',
          totalRequests: 0,
          approvedRequests: 0,
          totalDays: 0
        })
      }
      const userStats = userMap.get(r.userId)!
      userStats.totalRequests++
      if (r.status === 'approved') {
        userStats.approvedRequests++
        userStats.totalDays += r.leaveDays
      }
    })

    const topUsers = Array.from(userMap.values())
      .sort((a, b) => b.totalDays - a.totalDays)
      .slice(0, 10)

    setAnalytics({
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      approvalRate: Math.round(approvalRate * 100) / 100,
      averageLeaveDays: Math.round(averageLeaveDays * 100) / 100,
      totalLeaveDays,
      monthlyTrend,
      departmentStats,
      leaveTypeStats,
      topUsers
    })
  }

  useEffect(() => {
    fetchLeaveRequests()
  }, [workspaceId])

  useEffect(() => {
    if (leaveRequests.length > 0) {
      calculateAnalytics(leaveRequests)
    }
  }, [filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive leave management insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLeaveRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Time Period</label>
              <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(leaveRequests.map(r => r.user.department?.name).filter(Boolean))).map(dept => (
                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.approvedRequests} approved, {analytics.pendingRequests} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.rejectedRequests} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLeaveDays}</div>
            <p className="text-xs text-muted-foreground">
              Avg {analytics.averageLeaveDays} days per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Trend
          </CardTitle>
          <CardDescription>
            Leave request trends over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyTrend.map((month, index) => (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{month.month}</span>
                  <span>{month.requests} requests ({month.approved} approved)</span>
                </div>
                <div className="flex gap-2">
                  <Progress 
                    value={month.requests > 0 ? (month.approved / month.requests) * 100 : 0} 
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {month.requests > 0 ? Math.round((month.approved / month.requests) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead>Avg Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.departmentStats.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{dept.department}</TableCell>
                      <TableCell>{dept.totalRequests}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {dept.approvedRequests}
                          <span className="text-xs text-muted-foreground">
                            ({dept.totalRequests > 0 ? Math.round((dept.approvedRequests / dept.totalRequests) * 100) : 0}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{dept.totalDays}</TableCell>
                      <TableCell>{dept.avgDaysPerRequest.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Leave Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Leave Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.leaveTypeStats.map((type, index) => (
                <div key={type.leaveType} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{type.leaveType}</span>
                    <span>{type.count} ({type.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {type.totalDays} total days
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Leave Users
          </CardTitle>
          <CardDescription>
            Employees with the most leave days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Approval Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topUsers.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.user}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.totalRequests}</TableCell>
                    <TableCell>{user.approvedRequests}</TableCell>
                    <TableCell className="font-medium">{user.totalDays}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Progress 
                          value={user.totalRequests > 0 ? (user.approvedRequests / user.totalRequests) * 100 : 0} 
                          className="w-16 h-2"
                        />
                        <span className="text-xs">
                          {user.totalRequests > 0 ? Math.round((user.approvedRequests / user.totalRequests) * 100) : 0}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}