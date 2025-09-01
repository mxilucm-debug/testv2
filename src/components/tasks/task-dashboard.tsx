"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskCreationForm } from "./task-creation-form"
import { TaskManagementNew } from "./task-management-new"
import { TaskSubmissionForm } from "./task-submission-form"
import { TaskReviewSystem } from "./task-review-system"
import { PerformanceDashboard } from "./performance-dashboard"
import { 
  CheckSquare, 
  Plus, 
  List, 
  Upload, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Target,
  Eye,
  BarChart3
} from "lucide-react"

interface TaskStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  inProgressTasks: number
}

export function TaskDashboard() {
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    inProgressTasks: 0
  })
  const [loading, setLoading] = useState(true)

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"

  const fetchTaskStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/stats?workspaceId=${workspaceId}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching task stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTaskStats()
  }, [workspaceId])

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
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">Create, assign, and track tasks efficiently</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTaskStats}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="management" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Task Management
          </TabsTrigger>
          <TabsTrigger value="creation" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </TabsTrigger>
          <TabsTrigger value="submission" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Submit Task
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Review Tasks
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <TaskManagementNew onTaskUpdate={fetchTaskStats} />
        </TabsContent>

        <TabsContent value="creation" className="space-y-4">
          <TaskCreationForm onTaskCreated={fetchTaskStats} />
        </TabsContent>

        <TabsContent value="submission" className="space-y-4">
          <TaskSubmissionForm onSubmission={fetchTaskStats} />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <TaskReviewSystem />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}