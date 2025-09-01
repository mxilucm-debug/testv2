"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar as CalendarIcon, 
  Users, 
  Target, 
  FileText,
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface TaskFormData {
  title: string
  description: string
  objectives: string
  startDate: Date | undefined
  endDate: Date | undefined
  dueAt: Date | undefined
  assignedTo: string
  priority: "LOW" | "MEDIUM" | "HIGH"
}

interface User {
  id: string
  name: string
  email: string
  employeeId?: string
  department?: {
    name: string
  }
}

export function TaskCreationForm({ onTaskCreated }: { onTaskCreated: () => void }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    objectives: '',
    startDate: undefined,
    endDate: undefined,
    dueAt: undefined,
    assignedTo: '',
    priority: 'MEDIUM'
  })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Get current user from auth context
  const currentUserId = user?.id || "user-1"
  const currentUserRole = user?.role || "MANAGER"
  const workspaceId = user?.workspaceId || "workspace-1"

  const fetchUsers = async () => {
    try {
      // For task assignment, we want to show all users in the workspace
      // Managers can assign tasks to any employee or manager
      // Admins can assign tasks to anyone
      let url = `/api/users?workspaceId=${workspaceId}`
      
      // Only filter by role if needed - for now, show all users
      // This allows managers to assign tasks to any employee or manager in the workspace
      const response = await fetch(url)
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
  }, [workspaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.startDate || !formData.assignedTo) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.endDate && formData.startDate > formData.endDate) {
      setError('Start date must be before end date')
      return
    }

    if (formData.dueAt && formData.startDate > formData.dueAt) {
      setError('Start date must be before due date')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          workspaceId,
          currentUserId,
          currentUserRole,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate ? formData.endDate.toISOString() : undefined,
          dueAt: formData.dueAt ? formData.dueAt.toISOString() : undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setFormData({
          title: '',
          description: '',
          objectives: '',
          startDate: undefined,
          endDate: undefined,
          dueAt: undefined,
          assignedTo: '',
          priority: 'MEDIUM'
        })
        onTaskCreated()
      } else {
        setError(result.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      setError('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Task Created Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              The task has been assigned and the user will be notified.
            </p>
            <Button onClick={() => setSuccess(false)}>
              Create Another Task
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Task
        </CardTitle>
        <CardDescription>
          Assign a new task to a team member with specific objectives and timeline.
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

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Task Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task in detail"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="objectives" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objectives & Goals
              </Label>
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                placeholder="List specific objectives and expected outcomes"
                rows={3}
              />
            </div>
          </div>

          {/* Assignment and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedTo" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign To *
              </Label>
              <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.employeeId} • {user.department?.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value: "LOW" | "MEDIUM" | "HIGH") => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Low Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Medium Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      High Priority
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueAt ? format(formData.dueAt, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueAt}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueAt: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}