"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Building2, 
  Users, 
  Settings, 
  Activity, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Edit,
  Power,
  PowerOff,
  Trash2,
  BarChart3,
  PieChart,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  FileText
} from "lucide-react"

interface WorkspaceDetails {
  id: string
  name: string
  notificationEmail: string
  notificationPhone?: string
  notificationProvider: string
  workingDays: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    users: number
    departments: number
    designations: number
  }
}

interface WorkspaceStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalDepartments: number
  totalDesignations: number
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
  userGrowth: Array<{
    date: string
    users: number
  }>
  departmentDistribution: Array<{
    name: string
    users: number
  }>
}

interface WorkspaceDetailsViewProps {
  workspaceId: string
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onClose: () => void
}

export function WorkspaceDetailsView({ 
  workspaceId, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onClose 
}: WorkspaceDetailsViewProps) {
  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null)
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkspaceDetails()
  }, [workspaceId])

  const fetchWorkspaceDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch workspace details
      const workspaceResponse = await fetch(`/api/workspaces/${workspaceId}`)
      const workspaceResult = await workspaceResponse.json()
      
      if (workspaceResult.success) {
        setWorkspace(workspaceResult.data)
        
        // Mock stats data - replace with actual API calls
        setStats({
          totalUsers: workspaceResult.data._count.users,
          activeUsers: Math.round(workspaceResult.data._count.users * 0.85),
          inactiveUsers: Math.round(workspaceResult.data._count.users * 0.15),
          totalDepartments: workspaceResult.data._count.departments,
          totalDesignations: workspaceResult.data._count.designations,
          recentActivity: [
            { type: "user_created", description: "New user joined", timestamp: "2 hours ago" },
            { type: "workspace_updated", description: "Settings updated", timestamp: "1 day ago" },
            { type: "department_created", description: "New department added", timestamp: "3 days ago" },
            { type: "user_login", description: "User login activity", timestamp: "5 days ago" },
          ],
          userGrowth: [
            { date: "Jan", users: 45 },
            { date: "Feb", users: 52 },
            { date: "Mar", users: 48 },
            { date: "Apr", users: 61 },
            { date: "May", users: 58 },
          ],
          departmentDistribution: [
            { name: "Engineering", users: 25 },
            { name: "Sales", users: 15 },
            { name: "Marketing", users: 10 },
            { name: "HR", users: 5 },
            { name: "Finance", users: 3 },
          ]
        })
      } else {
        setError(workspaceResult.error || 'Failed to fetch workspace details')
      }
    } catch (error) {
      console.error('Error fetching workspace details:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getWorkingDaysLabel = (days: string) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayNumbers = days.split(',').map(d => parseInt(d.trim()))
    return dayNumbers.map(d => dayNames[d - 1]).join(', ')
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_created":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "user_login":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "workspace_updated":
        return <Settings className="h-4 w-4 text-purple-600" />
      case "department_created":
        return <Building2 className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !workspace || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Failed to load workspace details'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{workspace.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(workspace.isActive)}>
                {workspace.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={onToggleStatus}
            className={workspace.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
          >
            {workspace.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active, {stats.inactiveUsers} inactive
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
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDepartments}</div>
              <p className="text-xs text-muted-foreground">
                Active departments
              </p>
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
              <CardTitle className="text-sm font-medium">Designations</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDesignations}</div>
              <p className="text-xs text-muted-foreground">
                Job titles available
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
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent activities
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Information</CardTitle>
                <CardDescription>Basic workspace details and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Workspace Name</p>
                    <p className="font-medium">{workspace.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(workspace.isActive)}>
                      {workspace.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notification Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {workspace.notificationEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notification Provider</p>
                    <p className="font-medium">{workspace.notificationProvider}</p>
                  </div>
                  {workspace.notificationPhone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notification Phone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {workspace.notificationPhone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Working Days</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {getWorkingDaysLabel(workspace.workingDays)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>User growth trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">+12.5%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stats.userGrowth.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{item.date}</span>
                        <span className="font-medium">{item.users} users</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>Detailed user analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Active Users</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <Progress 
                      value={(stats.activeUsers / stats.totalUsers) * 100} 
                      className="h-2 mt-2" 
                    />
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserX className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Inactive Users</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.inactiveUsers}</div>
                    <Progress 
                      value={(stats.inactiveUsers / stats.totalUsers) * 100} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Users across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.departmentDistribution.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-[${
                          ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
                        }]`}></div>
                        <span className="text-sm font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{dept.users} users</span>
                        <Progress 
                          value={(dept.users / stats.totalUsers) * 100} 
                          className="h-2 w-20" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>Current configuration and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Notification Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{workspace.notificationEmail}</span>
                      </div>
                      {workspace.notificationPhone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{workspace.notificationPhone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="capitalize">{workspace.notificationProvider}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Working Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Working Days:</span>
                        <span>{getWorkingDaysLabel(workspace.workingDays)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(workspace.isActive)}>
                          {workspace.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest activities in this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}