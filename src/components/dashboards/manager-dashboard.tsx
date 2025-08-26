"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Target,
  Star,
  MoreHorizontal,
  UserPlus,
  BarChart3
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { TaskCreationForm } from "@/components/tasks/task-creation-form"
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  name: string
  position: string
  status: "active" | "on_leave" | "absent"
  performance: number
  tasksCompleted: number
  tasksPending: number
  avatar?: string
}

interface TeamStats {
  totalMembers: number
  activeMembers: number
  onLeave: number
  averagePerformance: number
  tasksCompleted: number
  tasksPending: number
  attendanceRate: number
}

interface Task {
  id: string
  title: string
  assignedTo: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  progress: number
}

interface PerformanceData {
  name: string
  performance: number
  tasks: number
  attendance: number
}

export function ManagerDashboard() {
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    onLeave: 0,
    averagePerformance: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    attendanceRate: 0
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showGoalsDialog, setShowGoalsDialog] = useState(false)
  const [showReportsDialog, setShowReportsDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Mock data - in real app, this would come from API
    const mockTeamStats: TeamStats = {
      totalMembers: 12,
      activeMembers: 10,
      onLeave: 2,
      averagePerformance: 85,
      tasksCompleted: 45,
      tasksPending: 18,
      attendanceRate: 92
    }

    const mockTeamMembers: TeamMember[] = [
      { id: "1", name: "John Doe", position: "Senior Developer", status: "active", performance: 92, tasksCompleted: 8, tasksPending: 2 },
      { id: "2", name: "Jane Smith", position: "Frontend Developer", status: "active", performance: 88, tasksCompleted: 6, tasksPending: 3 },
      { id: "3", name: "Mike Johnson", position: "Backend Developer", status: "on_leave", performance: 85, tasksCompleted: 5, tasksPending: 1 },
      { id: "4", name: "Sarah Wilson", position: "UI/UX Designer", status: "active", performance: 90, tasksCompleted: 7, tasksPending: 2 },
      { id: "5", name: "David Brown", position: "QA Engineer", status: "active", performance: 82, tasksCompleted: 4, tasksPending: 4 },
      { id: "6", name: "Lisa Davis", position: "DevOps Engineer", status: "active", performance: 87, tasksCompleted: 6, tasksPending: 1 }
    ]

    const mockTasks: Task[] = [
      { id: "1", title: "Implement user authentication", assignedTo: "John Doe", dueDate: "2024-01-20", priority: "high", status: "in_progress", progress: 75 },
      { id: "2", title: "Design dashboard UI", assignedTo: "Sarah Wilson", dueDate: "2024-01-18", priority: "medium", status: "completed", progress: 100 },
      { id: "3", title: "Setup CI/CD pipeline", assignedTo: "Lisa Davis", dueDate: "2024-01-22", priority: "high", status: "pending", progress: 0 },
      { id: "4", title: "Write API documentation", assignedTo: "Jane Smith", dueDate: "2024-01-19", priority: "medium", status: "in_progress", progress: 60 },
      { id: "5", title: "Fix login bug", assignedTo: "David Brown", dueDate: "2024-01-17", priority: "high", status: "overdue", progress: 80 },
      { id: "6", title: "Optimize database queries", assignedTo: "Mike Johnson", dueDate: "2024-01-25", priority: "medium", status: "pending", progress: 0 }
    ]

    const mockPerformanceData: PerformanceData[] = mockTeamMembers.map(member => ({
      name: member.name.split(' ')[0],
      performance: member.performance,
      tasks: member.tasksCompleted,
      attendance: member.status === "active" ? 95 : 80
    }))

    setTeamStats(mockTeamStats)
    setTeamMembers(mockTeamMembers)
    setTasks(mockTasks)
    setPerformanceData(mockPerformanceData)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "on_leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

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

  const handleTaskCreated = () => {
    setShowTaskDialog(false)
    toast({
      title: "Task Assigned",
      description: "New task has been successfully assigned to team member.",
    })
    // Refresh tasks data
    setTimeout(() => {
      // In real app, this would fetch fresh data from API
      const newTask: Task = {
        id: Date.now().toString(),
        title: "New Assigned Task",
        assignedTo: "Team Member",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "medium",
        status: "pending",
        progress: 0
      }
      setTasks(prev => [...prev, newTask])
    }, 1000)
  }

  const handleTeamAnalytics = () => {
    setShowAnalyticsDialog(true)
    toast({
      title: "Team Analytics",
      description: "Loading comprehensive team performance analytics...",
    })
  }

  const handleSetGoals = () => {
    setShowGoalsDialog(true)
    toast({
      title: "Set Goals",
      description: "Opening goal setting interface...",
    })
  }

  const handleViewReports = () => {
    setShowReportsDialog(true)
    toast({
      title: "Team Reports",
      description: "Generating detailed team performance reports...",
    })
  }

  const handleScheduleMeeting = () => {
    setShowScheduleDialog(true)
    toast({
      title: "Schedule 1:1",
      description: "Opening meeting scheduler...",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Dashboard</h1>
          <p className="text-muted-foreground">Engineering Team - Overview and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleTeamAnalytics}>
            <BarChart3 className="h-4 w-4" />
            Team Analytics
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setShowTaskDialog(true)}>
            <UserPlus className="h-4 w-4" />
            Assign Task
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
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                {teamStats.activeMembers} active, {teamStats.onLeave} on leave
              </p>
              <Progress value={teamStats.attendanceRate} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {teamStats.attendanceRate}% attendance rate
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
              <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.averagePerformance}%</div>
              <p className="text-xs text-muted-foreground">
                Average team performance
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Above target</span>
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
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground">
                {teamStats.tasksPending} pending
              </p>
              <Progress value={(teamStats.tasksCompleted / (teamStats.tasksCompleted + teamStats.tasksPending)) * 100} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((teamStats.tasksCompleted / (teamStats.tasksCompleted + teamStats.tasksPending)) * 100)}% completion rate
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
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status !== "completed").length}</div>
              <p className="text-xs text-muted-foreground">
                {tasks.filter(t => t.priority === "high").length} high priority
              </p>
              <Badge variant="outline" className="mt-2">
                {tasks.filter(t => t.status === "overdue").length} overdue
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
            <CardDescription>Individual performance metrics across the team</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="performance" fill="#3b82f6" name="Performance %" />
                <Bar dataKey="tasks" fill="#22c55e" name="Tasks Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Members and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Current status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(member.status)}>
                              {member.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {member.tasksCompleted}/{member.tasksCompleted + member.tasksPending} tasks
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-medium">{member.performance}%</span>
                        </div>
                        <Progress value={member.performance} className="mt-1 w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Current task assignments and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tasks.filter(t => t.status !== "completed").map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Assigned to: {task.assignedTo} • Due: {task.dueDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge className={getTaskStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress value={task.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{task.progress}% complete</p>
                        </div>
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
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common team management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <UserPlus className="h-6 w-6" />
                    <span className="text-sm">Assign Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Assign New Task</DialogTitle>
                    <DialogDescription>
                      Create and assign a new task to your team members with specific objectives and timeline.
                    </DialogDescription>
                  </DialogHeader>
                  <TaskCreationForm onTaskCreated={handleTaskCreated} />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleScheduleMeeting}>
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Schedule 1:1</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleSetGoals}>
                <Target className="h-6 w-6" />
                <span className="text-sm">Set Goals</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleViewReports}>
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Performance Analytics</DialogTitle>
            <DialogDescription>
              Comprehensive analytics and insights about your team's performance, productivity, and engagement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamStats.averagePerformance}%</div>
                  <p className="text-xs text-muted-foreground">Average performance score</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamStats.tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">Tasks completed this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamStats.attendanceRate}%</div>
                  <p className="text-xs text-muted-foreground">Team attendance</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Team performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', performance: 78, tasks: 32 },
                    { month: 'Feb', performance: 82, tasks: 38 },
                    { month: 'Mar', performance: 85, tasks: 42 },
                    { month: 'Apr', performance: 83, tasks: 40 },
                    { month: 'May', performance: 87, tasks: 45 },
                    { month: 'Jun', performance: 85, tasks: 45 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="performance" stroke="#3b82f6" name="Performance %" />
                    <Line type="monotone" dataKey="tasks" stroke="#22c55e" name="Tasks Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Team Member Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Performance Breakdown</CardTitle>
                <CardDescription>Detailed performance metrics for each team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{member.performance}%</span>
                        </div>
                        <Progress value={member.performance} className="w-24 h-2" />
                        <div className="text-xs text-muted-foreground">
                          {member.tasksCompleted}/{member.tasksCompleted + member.tasksPending} tasks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goals Setting Dialog */}
      <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Team Goals & Targets</DialogTitle>
            <DialogDescription>
              Define performance goals and targets for your team to drive productivity and growth.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Performance Score</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="range" 
                        min="70" 
                        max="100" 
                        defaultValue="90" 
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">90%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Task Target</label>
                    <input 
                      type="number" 
                      defaultValue="50" 
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Development Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skill Development Hours</label>
                    <input 
                      type="number" 
                      defaultValue="20" 
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Certification Target</label>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option>1 certification per quarter</option>
                      <option>2 certifications per quarter</option>
                      <option>1 certification per year</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Goal Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold">Q1 2024</div>
                    <div className="text-sm text-muted-foreground">Foundation Building</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-primary/5">
                    <div className="text-lg font-semibold">Q2 2024</div>
                    <div className="text-sm text-muted-foreground">Performance Growth</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold">Q3 2024</div>
                    <div className="text-sm text-muted-foreground">Excellence Target</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowGoalsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowGoalsDialog(false)
                toast({
                  title: "Goals Set",
                  description: "Team goals and targets have been successfully set.",
                })
              }}>
                Set Goals
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Performance Reports</DialogTitle>
            <DialogDescription>
              Generate and view comprehensive reports about team performance, productivity, and analytics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Performance Report</CardTitle>
                  <CardDescription>Comprehensive monthly performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generated:</span>
                      <span>Jun 30, 2024</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Format:</span>
                      <span>PDF, Excel</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => {
                    toast({
                      title: "Report Generated",
                      description: "Monthly performance report has been generated and downloaded.",
                    })
                  }}>
                    Download Report
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Team Productivity Analysis</CardTitle>
                  <CardDescription>Productivity metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generated:</span>
                      <span>Jun 28, 2024</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Format:</span>
                      <span>PDF, PowerPoint</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => {
                    toast({
                      title: "Report Generated",
                      description: "Productivity analysis report has been generated and downloaded.",
                    })
                  }}>
                    Download Report
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Custom Report Builder</CardTitle>
                <CardDescription>Create custom reports with specific metrics and timeframes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <select className="w-full px-3 py-2 border rounded-md mt-1">
                      <option>Performance Summary</option>
                      <option>Task Analysis</option>
                      <option>Attendance Report</option>
                      <option>Goal Progress</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time Period</label>
                    <select className="w-full px-3 py-2 border rounded-md mt-1">
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                      <option>Last 6 months</option>
                      <option>Custom range</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <select className="w-full px-3 py-2 border rounded-md mt-1">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                      <option>PowerPoint</option>
                    </select>
                  </div>
                </div>
                <Button onClick={() => {
                  toast({
                    title: "Custom Report Generated",
                    description: "Your custom report is being generated and will be downloaded shortly.",
                  })
                }}>
                  Generate Custom Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule 1:1 Meeting</DialogTitle>
            <DialogDescription>
              Schedule a one-on-one meeting with your team members for performance reviews and feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Team Member</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1">
                  <option>John Doe - Senior Developer</option>
                  <option>Jane Smith - Frontend Developer</option>
                  <option>Mike Johnson - Backend Developer</option>
                  <option>Sarah Wilson - UI/UX Designer</option>
                  <option>David Brown - QA Engineer</option>
                  <option>Lisa Davis - DevOps Engineer</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <input 
                    type="time" 
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Meeting Type</label>
                <select className="w-full px-3 py-2 border rounded-md mt-1">
                  <option>Performance Review</option>
                  <option>Goal Setting</option>
                  <option>Career Development</option>
                  <option>General Check-in</option>
                  <option>Feedback Session</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Agenda / Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  rows={4}
                  placeholder="Add meeting agenda, topics to discuss, or any notes..."
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowScheduleDialog(false)
                toast({
                  title: "Meeting Scheduled",
                  description: "1:1 meeting has been successfully scheduled and calendar invitation sent.",
                })
              }}>
                Schedule Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}