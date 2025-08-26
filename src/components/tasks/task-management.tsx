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
  Download
} from "lucide-react"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string
  objectives?: string
  startDate: string
  endDate: string
  assignedTo: string
  assignedBy: string
  status: "pending" | "in_progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
  assignee: {
    id: string
    name: string
    email: string
    employeeId?: string
    department?: {
      name: string
    }
  }
  creator: {
    id: string
    name: string
    email: string
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
}

export function TaskManagement({ onTaskUpdate }: { onTaskUpdate: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignedTo: 'all'
  })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<any[]>([])

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('workspaceId', workspaceId)
      if (filters.search) params.append('search', filters.search)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.priority !== 'all') params.append('priority', filters.priority)
      if (filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo)

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
    fetchTasks()
    fetchUsers()
  }, [workspaceId])

  useEffect(() => {
    fetchTasks()
  }, [filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const isTaskOverdue = (endDate: string, status: string) => {
    return new Date(endDate) < new Date() && status !== 'completed'
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
        fetchTasks()
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
        fetchTasks()
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Manage and track all tasks in the workspace
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Timeline</TableHead>
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
                          {isTaskOverdue(task.endDate, task.status) && (
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
                          {task.assignee.employeeId} • {task.assignee.department?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{task.creator.name}</div>
                        <div className="text-muted-foreground">{task.creator.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.startDate), 'MMM dd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {format(new Date(task.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
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
        </CardContent>
      </Card>
    </div>
  )
}

function TaskDetails({ task }: { task: Task }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
      </div>
      
      {task.objectives && (
        <div>
          <h5 className="font-medium mb-2">Objectives</h5>
          <p className="text-sm text-muted-foreground">{task.objectives}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-1">Assignee</h5>
          <p className="text-sm">{task.assignee.name}</p>
          <p className="text-xs text-muted-foreground">{task.assignee.email}</p>
        </div>
        <div>
          <h5 className="font-medium mb-1">Creator</h5>
          <p className="text-sm">{task.creator.name}</p>
          <p className="text-xs text-muted-foreground">{task.creator.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-1">Start Date</h5>
          <p className="text-sm">{format(new Date(task.startDate), 'PPP')}</p>
        </div>
        <div>
          <h5 className="font-medium mb-1">End Date</h5>
          <p className="text-sm">{format(new Date(task.endDate), 'PPP')}</p>
        </div>
      </div>
      
      {task.submission && (
        <div>
          <h5 className="font-medium mb-2">Submission Details</h5>
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <Badge className={
                task.submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                task.submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }>
                {task.submission.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Submitted:</span>
              <span>{format(new Date(task.submission.submittedAt), 'PPP')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Base Points:</span>
              <span>{task.submission.basePoints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quality Points:</span>
              <span>{task.submission.qualityPoints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bonus Points:</span>
              <span>{task.submission.bonusPoints}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Total Points:</span>
              <span>{task.submission.totalPoints}</span>
            </div>
            {task.submission.report && (
              <div>
                <h6 className="font-medium mb-1">Report</h6>
                <p className="text-sm text-muted-foreground">{task.submission.report}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}