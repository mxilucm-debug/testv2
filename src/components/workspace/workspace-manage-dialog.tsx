"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  Edit, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Save,
  X,
  Users,
  Activity,
  Settings,
  Trash2,
  Power,
  PowerOff
} from "lucide-react"

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  notificationEmail: z.string().email("Invalid email address"),
  notificationPhone: z.string().optional(),
  notificationProvider: z.enum(["email", "whatsapp", "push"]).default("email"),
  workingDays: z.string().default("1,2,3,4,5"),
  isActive: z.boolean().default(true),
})

type WorkspaceForm = z.infer<typeof workspaceSchema>

interface WorkspaceData {
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

interface WorkspaceManageDialogProps {
  workspace?: WorkspaceData
  onWorkspaceUpdated?: (workspace: WorkspaceData) => void
  onWorkspaceCreated?: (workspace: WorkspaceData) => void
  onWorkspaceDeleted?: (workspaceId: string) => void
  onWorkspaceToggled?: (workspaceId: string, isActive: boolean) => void
}

export function WorkspaceManageDialog({ 
  workspace, 
  onWorkspaceUpdated, 
  onWorkspaceCreated, 
  onWorkspaceDeleted,
  onWorkspaceToggled 
}: WorkspaceManageDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "settings" | "danger">("details")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isEditing = !!workspace
  const title = isEditing ? "Manage Workspace" : "Create New Workspace"
  const submitText = isEditing ? "Update Workspace" : "Create Workspace"

  const form = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: workspace?.name || "",
      notificationEmail: workspace?.notificationEmail || "",
      notificationPhone: workspace?.notificationPhone || "",
      notificationProvider: workspace?.notificationProvider || "email",
      workingDays: workspace?.workingDays || "1,2,3,4,5",
      isActive: workspace?.isActive ?? true,
    },
  })

  const onSubmit = async (data: WorkspaceForm) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const url = isEditing ? `/api/workspaces/${workspace.id}` : '/api/workspaces'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          if (isEditing) {
            onWorkspaceUpdated?.(result.data)
          } else {
            onWorkspaceCreated?.(result.data)
          }
          setSuccess(false)
          form.reset()
        }, 1500)
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} workspace`)
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} workspace:`, error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!workspace) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !workspace.isActive }),
      })

      const result = await response.json()

      if (result.success) {
        onWorkspaceToggled?.(workspace.id, !workspace.isActive)
        setOpen(false)
      } else {
        setError(result.error || 'Failed to toggle workspace status')
      }
    } catch (error) {
      console.error('Error toggling workspace status:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!workspace) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        onWorkspaceDeleted?.(workspace.id)
        setOpen(false)
        setShowDeleteConfirm(false)
      } else {
        setError(result.error || 'Failed to delete workspace')
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Workspace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Manage workspace settings and configuration"
              : "Create a new workspace with default settings"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Tabs for editing mode */}
        {isEditing && (
          <div className="flex space-x-1 border-b">
            <Button
              variant={activeTab === "details" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("details")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Details
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Statistics
            </Button>
            <Button
              variant={activeTab === "danger" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("danger")}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </Button>
          </div>
        )}

        {/* Error/Success Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Workspace {isEditing ? 'updated' : 'created'} successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Content based on tab */}
        {activeTab === "details" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter workspace name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Notification Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="workspace@company.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Notification Phone (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 234 567 8900" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select notification provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="push">Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Working Days
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1,2,3,4,5 (Mon-Fri)" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Current: {getWorkingDaysLabel(field.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enter comma-separated day numbers (1=Monday, 2=Tuesday, etc.)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable or disable this workspace
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setOpen(false)
                    setError(null)
                    setSuccess(false)
                    form.reset()
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || success}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : success ? "Saved!" : submitText}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* Statistics Tab */}
        {activeTab === "settings" && workspace && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Users</span>
                </div>
                <div className="text-2xl font-bold">{workspace._count.users}</div>
                <p className="text-sm text-muted-foreground">Total employees</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Departments</span>
                </div>
                <div className="text-2xl font-bold">{workspace._count.departments}</div>
                <p className="text-sm text-muted-foreground">Active departments</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Designations</span>
                </div>
                <div className="text-2xl font-bold">{workspace._count.designations}</div>
                <p className="text-sm text-muted-foreground">Job titles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Workspace Information</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(workspace.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={workspace.isActive 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }>
                      {workspace.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Quick Actions</Label>
                <div className="mt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleToggleStatus}
                    disabled={loading}
                  >
                    {workspace.isActive ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        Deactivate Workspace
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Activate Workspace
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && workspace && (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Danger Zone:</strong> These actions are irreversible and may affect all users in this workspace.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-200">Delete Workspace</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Permanently delete this workspace and all associated data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {showDeleteConfirm && (
                <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Are you absolutely sure?</strong></p>
                      <p className="text-sm">
                        This will permanently delete the workspace "{workspace.name}" and all associated data including:
                      </p>
                      <ul className="text-sm list-disc list-inside">
                        <li>All users in this workspace</li>
                        <li>All departments and designations</li>
                        <li>All attendance records</li>
                        <li>All leave requests</li>
                        <li>All documents and files</li>
                      </ul>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={loading}
                        >
                          {loading ? "Deleting..." : "Yes, Delete Workspace"}
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}