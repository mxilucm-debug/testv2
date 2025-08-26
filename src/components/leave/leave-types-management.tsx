"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users
} from "lucide-react"

interface LeaveType {
  id: string
  name: string
  description?: string
  daysAllowed?: number
  isPaid: boolean
  isActive: boolean
  workspaceId: string
  createdAt: string
  updatedAt: string
  _count: {
    leaveRequests: number
  }
}

interface LeaveTypeFormData {
  name: string
  description?: string
  daysAllowed?: number
  isPaid: boolean
  isActive: boolean
}

export function LeaveTypesManagement() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [formData, setFormData] = useState<LeaveTypeFormData>({
    name: '',
    description: '',
    daysAllowed: undefined,
    isPaid: true,
    isActive: true
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch(`/api/leave-types?workspaceId=${workspaceId}`)
      const result = await response.json()
      
      if (result.success) {
        setLeaveTypes(result.data)
      }
    } catch (error) {
      console.error('Error fetching leave types:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const url = editingLeaveType 
        ? `/api/leave-types/${editingLeaveType.id}`
        : '/api/leave-types'
      
      const method = editingLeaveType ? 'PUT' : 'POST'
      const body = {
        ...formData,
        workspaceId
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(editingLeaveType ? 'Leave type updated successfully' : 'Leave type created successfully')
        setIsDialogOpen(false)
        resetForm()
        await fetchLeaveTypes()
      } else {
        setError(result.error || 'Failed to save leave type')
      }
    } catch (error) {
      console.error('Error saving leave type:', error)
      setError('Failed to save leave type')
    }
  }

  const handleEdit = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType)
    setFormData({
      name: leaveType.name,
      description: leaveType.description || '',
      daysAllowed: leaveType.daysAllowed,
      isPaid: leaveType.isPaid,
      isActive: leaveType.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (leaveType: LeaveType) => {
    if (!confirm(`Are you sure you want to delete "${leaveType.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/leave-types/${leaveType.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Leave type deleted successfully')
        await fetchLeaveTypes()
      } else {
        setError(result.error || 'Failed to delete leave type')
      }
    } catch (error) {
      console.error('Error deleting leave type:', error)
      setError('Failed to delete leave type')
    }
  }

  const resetForm = () => {
    setEditingLeaveType(null)
    setFormData({
      name: '',
      description: '',
      daysAllowed: undefined,
      isPaid: true,
      isActive: true
    })
    setError(null)
    setSuccess(null)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    setIsDialogOpen(open)
  }

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
          <h1 className="text-3xl font-bold">Leave Types Management</h1>
          <p className="text-muted-foreground">Manage leave types for your organization</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Annual Leave, Sick Leave"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the leave type"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysAllowed">Days Allowed (Optional)</Label>
                <Input
                  id="daysAllowed"
                  type="number"
                  min="0"
                  value={formData.daysAllowed || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    daysAllowed: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Maximum days allowed per year"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPaid">Paid Leave</Label>
                  <p className="text-sm text-muted-foreground">Is this a paid leave type?</p>
                </div>
                <Switch
                  id="isPaid"
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaid: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">Is this leave type currently active?</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLeaveType ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Leave Types
          </CardTitle>
          <CardDescription>
            Configure different types of leave available in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Days Allowed</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((leaveType) => (
                  <TableRow key={leaveType.id}>
                    <TableCell className="font-medium">{leaveType.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {leaveType.description || '-'}
                    </TableCell>
                    <TableCell>
                      {leaveType.daysAllowed ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {leaveType.daysAllowed} days
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unlimited</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={leaveType.isPaid ? 'default' : 'secondary'}>
                        <div className="flex items-center gap-1">
                          {leaveType.isPaid ? (
                            <DollarSign className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {leaveType.isPaid ? 'Paid' : 'Unpaid'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={leaveType.isActive ? 'default' : 'secondary'}>
                        <div className="flex items-center gap-1">
                          {leaveType.isActive ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {leaveType.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {leaveType._count.leaveRequests} requests
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(leaveType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(leaveType)}
                          disabled={leaveType._count.leaveRequests > 0}
                          className="text-red-600 hover:text-red-700"
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