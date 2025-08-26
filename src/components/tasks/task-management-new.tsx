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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Download,
  Users,
  Plus
} from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

interface Task {
  id: string
  title: string
  description?: string
  objectives?: string
  startDate: string
  endDate?: string
  dueAt?: string
  assignedTo: string
  assignedBy: string
  assignedRole: "ADMIN" | "MANAGER" | "EMPLOYEE"
  createdBy: string
  createdRole: "ADMIN" | "MANAGER" | "EMPLOYEE"
  status: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  createdAt: string
  updatedAt: string
  assignee: {
    id: string
    name: string
    email: string
    employeeId?: string
    role: "ADMIN" | "MANAGER" | "EMPLOYEE"
    department?: {
      name: string
    }
  }
  creator: {
    id: string
    name: string
    email: string
    role: "ADMIN" | "MANAGER" | "EMPLOYEE"
  }
  submission?: {
    id: string
    report?: string
    fileUrl?: string
    submittedAt: string
    status: "pending_review" | "approved" | "rejected"
    basePoints: number
    qualityPoints: number
    bonusPoints: number
    totalPoints: number
  }
}

interface TaskFilters {
  search: string
  status: string
  priority: string
  assignedTo: string
  createdBy: string
  assignedRole: string
}

interface TaskCounts {
  assigned: number
  created: number
}

export function TaskManagementNew({ onTaskUpdate }: { onTaskUpdate: () => void }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    createdBy: 'all',
    assignedRole: 'all'
  })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({ assigned: 0, created: 0 })
  const [activeTab, setActiveTab] = useState("assigned")

  // Get current user from auth context
  const currentUserId = user?.id || "user-1"
  const currentUserRole = user?.role || "MANAGER"
  const workspaceId = user?.workspaceId || "workspace-1"

  const fetchTasks = async (view: string = 'assigned') => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('workspaceId', workspaceId)
      params.append('view', view)
      params.append('currentUserId', currentUserId)
      params.append('currentUserRole', currentUserRole)
      
      if (filters.search) params.append('search', filters.search)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.priority !== 'all') params.append('priority', filters.priority)
      if (filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo)
      if (filters.createdBy !== 'all') params.append('createdBy', filters.createdBy)
      if (filters.assignedRole !== 'all') params.append('assignedRole', filters.assignedRole)

      const response = await fetch(`/api/tasks?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setTasks(result.data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskCounts = async () => {
    try {
      // Fetch assigned tasks count
      const assignedResponse = await fetch(`/api/tasks?workspaceId=${workspaceId}&view=assigned&currentUserId=${currentUserId}&currentUserRole=${currentUserRole}`)
      const assignedResult = await assignedResponse.json()
      
      // Fetch created tasks count
      const createdResponse = await fetch(`/api/tasks?workspaceId=${workspaceId}&view=created&currentUserId=${currentUserId}&currentUserRole=${currentUserRole}`)
      const createdResult = await createdResponse.json()
      
      if (assignedResult.success && createdResult.success) {
        setTaskCounts({
          assigned: assignedResult.data.length,
          created: createdResult.data.length
        })
      }
    } catch (error) {
      console.error('Error fetching task counts:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?workspaceId=${workspaceId}`)
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchTaskCounts()
  }, [workspaceId])

  useEffect(() => {
    fetchTasks(activeTab)
  }, [filters, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />
      case 'BLOCKED':
        return <AlertTriangle className="h-4 w-4" />
      case 'OPEN':
        return <Clock className="h-4 w-4" />
      case 'CANCELLED':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const isTaskOverdue = (dueAt?: string, status?: string) => {
    if (!dueAt) return false
    return new Date(dueAt) < new Date() && status !== 'DONE'
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTasks(activeTab)
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTasks(activeTab)
        fetchTaskCounts()
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })

  const TaskDetails = ({ task }: { task: Task }) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
        )}
        {task.objectives && (
          <div>
            <h5 className="font-medium mb-1">Objectives:</h5>
            <p className="text-sm text-muted-foreground">{task.objectives}</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Assignee:</span>
          <div>{task.assignee.name}</div>
          <div className="text-muted-foreground">{task.assignee.email}</div>
        </div>
        <div>
          <span className="font-medium">Creator:</span>
          <div>{task.creator.name}</div>
          <div className="text-muted-foreground">{task.creator.email}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Start Date:</span>
          <div>{format(new Date(task.startDate), 'PPP')}</div>
        </div>
        {task.dueAt && (
          <div>
            <span className="font-medium">Due Date:</span>
            <div>{format(new Date(task.dueAt), 'PPP')}</div>
          </div>
        )}
      </div>
      
      {task.submission && (
        <div>
          <h5 className="font-medium mb-2">Submission</h5>
          <div className="text-sm space-y-1">
            <div>Status: <Badge className={
              task.submission.status === 'approved' ? 'bg-green-100 text-green-800' :
              task.submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }>{task.submission.status}</Badge></div>
            <div>Total Points: {task.submission.totalPoints}</div>
            {task.submission.report && (
              <div>Report: {task.submission.report}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.assignedRole} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedRole: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignee Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.assignedTo} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.createdBy} onValueChange={(value) => setFilters(prev => ({ ...prev, createdBy: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Manage and track tasks in the workspace
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assigned" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned to me ({taskCounts.assigned})
              </TabsTrigger>
              <TabsTrigger value="created" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Created by me ({taskCounts.created})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned" className="mt-4">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <span className="font-medium">{task.title}</span>
                              {isTaskOverdue(task.dueAt, task.status) && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{task.creator.name}</div>
                            <div className="text-muted-foreground">{task.creator.role}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.dueAt ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueAt), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.status)}
                              {task.status.replace('_', ' ')}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.submission ? (
                            <div className="space-y-1">
                              <Badge 
                                className={
                                  task.submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  task.submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {task.submission.status.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {task.submission.totalPoints} pts
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Task Details</DialogTitle>
                                </DialogHeader>
                                <TaskDetails task={task} />
                              </DialogContent>
                            </Dialog>
                            
                            <Select 
                              value={task.status} 
                              onValueChange={(value) => updateTaskStatus(task.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="BLOCKED">Blocked</SelectItem>
                                <SelectItem value="DONE">Done</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="created" className="mt-4">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned to</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <span className="font-medium">{task.title}</span>
                              {isTaskOverdue(task.dueAt, task.status) && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{task.assignee.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {task.assignee.role} • {task.assignee.department?.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.dueAt ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueAt), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.status)}
                              {task.status.replace('_', ' ')}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.submission ? (
                            <div className="space-y-1">
                              <Badge 
                                className={
                                  task.submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  task.submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {task.submission.status.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {task.submission.totalPoints} pts
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Task Details</DialogTitle>
                                </DialogHeader>
                                <TaskDetails task={task} />
                              </DialogContent>
                            </Dialog>
                            
                            <Select 
                              value={task.status} 
                              onValueChange={(value) => updateTaskStatus(task.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="BLOCKED">Blocked</SelectItem>
                                <SelectItem value="DONE">Done</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}