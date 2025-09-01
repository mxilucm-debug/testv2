"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Calendar,
  Star,
  Award,
  Plus
} from "lucide-react"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string
  objectives?: string
  startDate: string
  endDate: string
  status: "pending" | "in_progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
  creator: {
    id: string
    name: string
    email: string
  }
}

interface TaskSubmission {
  taskId: string
  report: string
  fileUrl?: string
}

export function TaskSubmissionForm({ onSubmission }: { onSubmission: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submission, setSubmission] = useState<TaskSubmission>({
    taskId: '',
    report: '',
    fileUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"
  const userId = "cmepn2wo4000vptfyqbh6cqsj" // Mock user ID

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks/assigned?userId=${userId}&workspaceId=${workspaceId}`)
      const result = await response.json()
      
      if (result.success) {
        setTasks(result.data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [workspaceId, userId])

  const handleFileUpload = async (file: File) => {
    // In a real app, you would upload the file to a storage service
    // For now, we'll create a mock URL
    return `https://example.com/files/${file.name}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!submission.taskId || !submission.report) {
      setError('Please select a task and provide a report')
      return
    }

    setLoading(true)
    setError('')

    try {
      let fileUrl = submission.fileUrl
      if (file) {
        fileUrl = await handleFileUpload(file)
      }

      const response = await fetch('/api/tasks/submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...submission,
          userId,
          fileUrl
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setSubmission({
          taskId: '',
          report: '',
          fileUrl: ''
        })
        setSelectedTask(null)
        setFile(null)
        onSubmission()
      } else {
        setError(result.error || 'Failed to submit task')
      }
    } catch (error) {
      console.error('Error submitting task:', error)
      setError('Failed to submit task')
    } finally {
      setLoading(false)
    }
  }

  const handleTaskSelect = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    setSelectedTask(task || null)
    setSubmission(prev => ({ ...prev, taskId }))
  }

  // Points will be calculated during review
  const totalPoints = 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'overdue': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Task Submitted Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              Your task has been submitted and is awaiting review.
            </p>
            <Button onClick={() => setSuccess(false)}>
              Submit Another Task
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Task Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Task to Submit
          </CardTitle>
          <CardDescription>
            Choose a task from your assigned tasks to submit your work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={submission.taskId} onValueChange={handleTaskSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      Due: {format(new Date(task.endDate), 'MMM dd, yyyy')} • 
                      Priority: <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Task Details */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">{selectedTask.title}</h4>
                {selectedTask.description && (
                  <p className="text-muted-foreground mt-2">{selectedTask.description}</p>
                )}
              </div>
              
              {selectedTask.objectives && (
                <div>
                  <h5 className="font-medium mb-2">Objectives</h5>
                  <p className="text-sm text-muted-foreground">{selectedTask.objectives}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedTask.startDate), 'PPP')}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedTask.endDate), 'PPP')}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className={`text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Submit Task
            </CardTitle>
            <CardDescription>
              Provide your task report and any supporting documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Report */}
              <div>
                <Label htmlFor="report" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Task Report *
                </Label>
                <Textarea
                  id="report"
                  value={submission.report}
                  onChange={(e) => setSubmission(prev => ({ ...prev, report: e.target.value }))}
                  placeholder="Describe your work, achievements, challenges faced, and outcomes..."
                  rows={6}
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Supporting Document
                </Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected file: {file.name}
                  </p>
                )}
              </div>

              {/* Points Assessment */}
              <div className="space-y-4">
                <h4 className="font-medium">Self-Assessment Points</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="basePoints" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Base Points (0-100)
                    </Label>
                    <Input
                      id="basePoints"
                      type="number"
                      min="0"
                      max="100"
                      value={submission.basePoints}
                      onChange={(e) => setSubmission(prev => ({ ...prev, basePoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="qualityPoints" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Quality Points (0-50)
                    </Label>
                    <Input
                      id="qualityPoints"
                      type="number"
                      min="0"
                      max="50"
                      value={submission.qualityPoints}
                      onChange={(e) => setSubmission(prev => ({ ...prev, qualityPoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bonusPoints" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Bonus Points (0-25)
                    </Label>
                    <Input
                      id="bonusPoints"
                      type="number"
                      min="0"
                      max="25"
                      value={submission.bonusPoints}
                      onChange={(e) => setSubmission(prev => ({ ...prev, bonusPoints: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {/* Total Points Display */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Points:</span>
                    <span className="text-2xl font-bold text-primary">{totalPoints}</span>
                  </div>
                  <Progress value={(totalPoints / 175) * 100} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum possible points: 175 (100 + 50 + 25)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="min-w-32">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Task
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!selectedTask && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Task</h3>
              <p className="text-muted-foreground">
                Choose a task from the list above to submit your work.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}