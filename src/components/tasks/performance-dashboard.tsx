"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Target, 
  Award, 
  Star, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  User,
  BarChart3,
  Trophy,
  Calendar,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface UserPerformance {
  userId: string
  userName: string
  userEmail: string
  employeeId?: string
  role: string
  department?: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  totalPointsEarned: number
  totalPossiblePoints: number
  onTimeSubmissions: number
  lateSubmissions: number
  averageQualityScore: number
  totalBonusPoints: number
  completionRate: number
  pointsEfficiency: number
  onTimeRate: number
}

interface WorkspaceStats {
  totalUsers: number
  totalTasks: number
  totalCompletedTasks: number
  totalPointsEarned: number
  averageCompletionRate: number
  averagePointsEfficiency: number
}

interface PerformanceData {
  users: UserPerformance[]
  workspaceStats: WorkspaceStats
  period: string
}

export function PerformanceDashboard() {
  const { user } = useAuth()
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Get current user info
  const workspaceId = user?.workspaceId || "workspace-1"
  const currentUserId = user?.id || "user-1"

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('workspaceId', workspaceId)
      params.append('period', selectedPeriod)
      if (selectedUserId) {
        params.append('userId', selectedUserId)
      }

      const response = await fetch(`/api/tasks/performance?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setPerformanceData(result.data)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [workspaceId, selectedPeriod, selectedUserId])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'EMPLOYEE': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (rate >= 80) return { text: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (rate >= 70) return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Needs Improvement', color: 'bg-red-100 text-red-800' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
        <p className="text-muted-foreground">
          No performance data available for the selected criteria.
        </p>
      </div>
    )
  }

  const { users, workspaceStats } = performanceData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Track team performance and individual achievements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Workspace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaceStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaceStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Assigned tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{workspaceStats.totalCompletedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {workspaceStats.totalTasks > 0 ? 
                Math.round((workspaceStats.totalCompletedTasks / workspaceStats.totalTasks) * 100) : 0
              }% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{workspaceStats.totalPointsEarned}</div>
            <p className="text-xs text-muted-foreground">Points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(workspaceStats.averageCompletionRate)}%
            </div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(workspaceStats.averagePointsEfficiency)}%
            </div>
            <p className="text-xs text-muted-foreground">Points efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
          <CardDescription>
            Team members with the highest performance scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users.slice(0, 3).map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative p-4 border rounded-lg"
              >
                {index === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {user.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{user.userName}</div>
                    <div className="text-sm text-muted-foreground">{user.role}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Points:</span>
                    <span className="font-medium">{user.totalPointsEarned}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completion:</span>
                    <span className={`font-medium ${getPerformanceColor(user.completionRate)}`}>
                      {user.completionRate}%
                    </span>
                  </div>
                  <Progress value={user.completionRate} className="h-2" />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for all team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Points Earned</TableHead>
                <TableHead>On-Time Rate</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const performanceBadge = getPerformanceBadge(user.completionRate)
                return (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {user.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.employeeId || user.userEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {user.completedTasks}/{user.totalTasks}
                        </div>
                        <Progress value={(user.completedTasks / user.totalTasks) * 100} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`text-sm font-medium ${getPerformanceColor(user.completionRate)}`}>
                          {user.completionRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.completedTasks} completed
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {user.totalPointsEarned}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.totalPossiblePoints} possible
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`text-sm font-medium ${getPerformanceColor(user.onTimeRate)}`}>
                          {user.onTimeRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.onTimeSubmissions} on-time
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">
                          {user.averageQualityScore.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={performanceBadge.color}>
                        {performanceBadge.text}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Highest Performer:</span>
                <span className="font-medium">
                  {users.length > 0 ? users[0].userName : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Most Points Earned:</span>
                <span className="font-medium">
                  {users.length > 0 ? users[0].totalPointsEarned : 0} pts
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Best Completion Rate:</span>
                <span className="font-medium">
                  {users.length > 0 ? `${users[0].completionRate}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Most On-Time:</span>
                <span className="font-medium">
                  {users.length > 0 ? `${users[0].onTimeRate}%` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Bonus Points:</span>
                <span className="font-medium">
                  {users.reduce((sum, user) => sum + user.totalBonusPoints, 0)} pts
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average Quality Score:</span>
                <span className="font-medium">
                  {users.length > 0 ? 
                    (users.reduce((sum, user) => sum + user.averageQualityScore, 0) / users.length).toFixed(1) : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overdue Tasks:</span>
                <span className="font-medium text-red-600">
                  {users.reduce((sum, user) => sum + user.overdueTasks, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Tasks:</span>
                <span className="font-medium text-yellow-600">
                  {users.reduce((sum, user) => sum + user.pendingTasks, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
