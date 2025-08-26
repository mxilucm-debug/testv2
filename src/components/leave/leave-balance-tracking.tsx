"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  User, 
  Mail, 
  Building,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  PieChart
} from "lucide-react"

interface LeaveBalance {
  userId: string
  userName: string
  userEmail: string
  employeeId?: string
  leaveType: {
    id: string
    name: string
    isPaid: boolean
    daysAllowed?: number
  }
  usedDays: number
  pendingDays: number
  remainingDays: number
  totalAllowed: number
  year: number
}

interface LeaveBalanceSummary {
  totalEmployees: number
  totalLeaveTypes: number
  averageUtilization: number
  criticalBalances: number
  upcomingExpirations: number
}

export function LeaveBalanceTracking() {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [summary, setSummary] = useState<LeaveBalanceSummary>({
    totalEmployees: 0,
    totalLeaveTypes: 0,
    averageUtilization: 0,
    criticalBalances: 0,
    upcomingExpirations: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: '',
    year: new Date().getFullYear().toString(),
    leaveType: ''
  })

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('workspaceId', workspaceId)
      params.append('year', filters.year)
      if (filters.userId && filters.userId !== "all") params.append('userId', filters.userId)

      const response = await fetch(`/api/leave-balance?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setLeaveBalances(result.data)
        calculateSummary(result.data)
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (balances: LeaveBalance[]) => {
    const uniqueEmployees = new Set(balances.map(b => b.userId)).size
    const uniqueLeaveTypes = new Set(balances.map(b => b.leaveType.id)).size
    
    const totalUtilization = balances.reduce((sum, balance) => {
      if (balance.totalAllowed > 0) {
        return sum + (balance.usedDays / balance.totalAllowed)
      }
      return sum
    }, 0)
    
    const averageUtilization = balances.length > 0 ? (totalUtilization / balances.length) * 100 : 0
    
    const criticalBalances = balances.filter(b => 
      b.totalAllowed > 0 && (b.remainingDays / b.totalAllowed) <= 0.2
    ).length
    
    const upcomingExpirations = balances.filter(b => 
      b.totalAllowed > 0 && (b.remainingDays / b.totalAllowed) <= 0.1
    ).length

    setSummary({
      totalEmployees: uniqueEmployees,
      totalLeaveTypes: uniqueLeaveTypes,
      averageUtilization: Math.round(averageUtilization),
      criticalBalances,
      upcomingExpirations
    })
  }

  useEffect(() => {
    fetchLeaveBalances()
  }, [workspaceId, filters.year, filters.userId])

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getBalanceStatus = (balance: LeaveBalance) => {
    if (balance.totalAllowed === 0) return 'unlimited'
    
    const utilizationPercentage = (balance.usedDays / balance.totalAllowed) * 100
    if (utilizationPercentage >= 90) return 'critical'
    if (utilizationPercentage >= 70) return 'warning'
    return 'healthy'
  }

  const getBalanceStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const filteredBalances = leaveBalances.filter(balance => {
    if (filters.leaveType && filters.leaveType !== "all" && balance.leaveType.id !== filters.leaveType) {
      return false
    }
    return true
  })

  // Group by employee for better viewing
  const groupedBalances = filteredBalances.reduce((acc, balance) => {
    if (!acc[balance.userId]) {
      acc[balance.userId] = {
        user: {
          name: balance.userName,
          email: balance.userEmail,
          employeeId: balance.employeeId
        },
        balances: []
      }
    }
    acc[balance.userId].balances.push(balance)
    return acc
  }, {} as any)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Balance Tracking</h1>
          <p className="text-muted-foreground">Monitor and manage employee leave balances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLeaveBalances}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Types</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeaveTypes}</div>
            <p className="text-xs text-muted-foreground">Available types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUtilizationColor(summary.averageUtilization)}`}>
              {summary.averageUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">Across all types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Balances</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.criticalBalances}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Balance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.upcomingExpirations}</div>
            <p className="text-xs text-muted-foreground">Expiring soon</p>
          </CardContent>
        </Card>
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
              <label className="text-sm font-medium">Year</label>
              <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                  <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                  <SelectItem value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Employee</label>
              <Select value={filters.userId} onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {Array.from(new Set(leaveBalances.map(b => ({ id: b.userId, name: b.userName })))).map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={filters.leaveType} onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(new Set(leaveBalances.map(b => b.leaveType))).map(leaveType => (
                    <SelectItem key={leaveType.id} value={leaveType.id}>{leaveType.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
          <CardDescription>
            Detailed view of employee leave balances and utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Total Allowed</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance) => {
                  const utilizationPercentage = balance.totalAllowed > 0 
                    ? Math.round((balance.usedDays / balance.totalAllowed) * 100) 
                    : 0
                  const status = getBalanceStatus(balance)

                  return (
                    <TableRow key={`${balance.userId}-${balance.leaveType.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{balance.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {balance.userEmail}
                          </div>
                          {balance.employeeId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {balance.employeeId}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-medium">{balance.leaveType.name}</span>
                          <div className="text-xs">
                            <Badge variant={balance.leaveType.isPaid ? 'default' : 'secondary'}>
                              {balance.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {balance.totalAllowed || 'Unlimited'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{balance.usedDays}</span>
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{balance.pendingDays}</span>
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${balance.remainingDays <= 2 ? 'text-red-600' : ''}`}>
                            {balance.remainingDays}
                          </span>
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getUtilizationColor(utilizationPercentage)}`}>
                              {utilizationPercentage}%
                            </span>
                          </div>
                          {balance.totalAllowed > 0 && (
                            <Progress 
                              value={utilizationPercentage} 
                              className="h-2"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getBalanceStatusColor(status)}>
                          <div className="flex items-center gap-1">
                            {status === 'critical' && <AlertTriangle className="h-3 w-3" />}
                            {status === 'warning' && <Clock className="h-3 w-3" />}
                            {status === 'healthy' && <CheckCircle className="h-3 w-3" />}
                            {status === 'unlimited' && <Calendar className="h-3 w-3" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="h-3 w-3" />
                Healthy
              </Badge>
              <span className="text-sm text-muted-foreground">Good balance</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <Clock className="h-3 w-3" />
                Warning
              </Badge>
              <span className="text-sm text-muted-foreground">70-90% used</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <AlertTriangle className="h-3 w-3" />
                Critical
              </Badge>
              <span className="text-sm text-muted-foreground">90%+ used</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <Calendar className="h-3 w-3" />
                Unlimited
              </Badge>
              <span className="text-sm text-muted-foreground">No limit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}