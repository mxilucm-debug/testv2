"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Calendar as CalendarIcon, 
  Upload, 
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Info
} from "lucide-react"
import { format } from "date-fns"
import { useLeaveSocket } from "@/hooks/use-leave-socket"

interface LeaveType {
  id: string
  name: string
  description?: string
  daysAllowed?: number
  isPaid: boolean
  isActive: boolean
}

interface LeaveRequestFormData {
  leaveTypeId: string
  startDate: Date | undefined
  endDate: Date | undefined
  reason: string
  attachment?: string
}

interface LeaveRequestFormProps {
  userId: string
  workspaceId: string
  onSuccess?: () => void
}

export function LeaveRequestForm({ userId, workspaceId, onSuccess }: LeaveRequestFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false)
  
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    leaveTypeId: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
    attachment: undefined
  })

  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  const [leaveDays, setLeaveDays] = useState<number>(0)

  // WebSocket hook for real-time notifications
  const { isConnected, sendLeaveUpdate } = useLeaveSocket(workspaceId, userId)

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leave-types?workspaceId=${workspaceId}&isActive=true`)
      const result = await response.json()
      
      if (result.success) {
        setLeaveTypes(result.data)
      }
    } catch (error) {
      console.error('Error fetching leave types:', error)
      setError('Failed to load leave types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveTypes()
  }, [workspaceId])

  useEffect(() => {
    if (formData.leaveTypeId) {
      const leaveType = leaveTypes.find(lt => lt.id === formData.leaveTypeId)
      setSelectedLeaveType(leaveType || null)
    } else {
      setSelectedLeaveType(null)
    }
  }, [formData.leaveTypeId, leaveTypes])

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const diffTime = Math.abs(formData.endDate.getTime() - formData.startDate.getTime())
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      setLeaveDays(days)
    } else {
      setLeaveDays(0)
    }
  }, [formData.startDate, formData.endDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      if (!formData.leaveTypeId) {
        setError('Please select a leave type')
        return
      }

      if (!formData.startDate || !formData.endDate) {
        setError('Please select both start and end dates')
        return
      }

      if (formData.startDate > formData.endDate) {
        setError('Start date must be before end date')
        return
      }

      if (formData.startDate < new Date()) {
        setError('Start date cannot be in the past')
        return
      }

      if (!formData.reason.trim()) {
        setError('Please provide a reason for your leave request')
        return
      }

      // Check if leave days exceed allowed days
      if (selectedLeaveType?.daysAllowed && leaveDays > selectedLeaveType.daysAllowed) {
        setError(`Requested leave days (${leaveDays}) exceed allowed days (${selectedLeaveType.daysAllowed}) for this leave type`)
        return
      }

      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          leaveTypeId: formData.leaveTypeId,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          reason: formData.reason.trim(),
          attachment: formData.attachment
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Leave request submitted successfully')
        
        // Send WebSocket notification
        sendLeaveUpdate(userId, 'submitted', result.data.id, {
          leaveType: selectedLeaveType?.name,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          leaveDays
        })
        
        setFormData({
          leaveTypeId: '',
          startDate: undefined,
          endDate: undefined,
          reason: '',
          attachment: undefined
        })
        setSelectedLeaveType(null)
        setLeaveDays(0)
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || 'Failed to submit leave request')
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      setError('Failed to submit leave request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a storage service
      // For now, we'll just store the file name
      setFormData(prev => ({ ...prev, attachment: file.name }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Leave Request
        </CardTitle>
        <CardDescription>
          Request time off by filling out the form below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select 
              value={formData.leaveTypeId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((leaveType) => (
                  <SelectItem key={leaveType.id} value={leaveType.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{leaveType.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {leaveType.daysAllowed && (
                          <span>{leaveType.daysAllowed} days</span>
                        )}
                        <Badge variant={leaveType.isPaid ? 'default' : 'secondary'} className="text-xs">
                          {leaveType.isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLeaveType && (
              <div className="text-sm text-muted-foreground">
                {selectedLeaveType.description}
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, startDate: date }))
                      setShowCalendar(false)
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Dialog open={showEndDateCalendar} onOpenChange={setShowEndDateCalendar}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, endDate: date }))
                      setShowEndDateCalendar(false)
                    }}
                    disabled={(date) => date < (formData.startDate || new Date())}
                    initialFocus
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Leave Days Calculation */}
          {leaveDays > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                Total leave days: <strong>{leaveDays}</strong>
                {selectedLeaveType?.daysAllowed && (
                  <span className="text-muted-foreground">
                    {' '}out of {selectedLeaveType.daysAllowed} allowed
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please provide a detailed reason for your leave request..."
              rows={4}
              required
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Supporting Document (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                type="file"
                onChange={handleFileUpload}
                className="flex-1"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {formData.attachment && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {formData.attachment}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Upload medical certificates, travel documents, or other supporting evidence
            </p>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Leave requests require manager approval</li>
                <li>Submit requests at least 24 hours in advance</li>
                <li>Emergency leave may require additional documentation</li>
                <li>You will receive email notifications for status updates</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setFormData({
                  leaveTypeId: '',
                  startDate: undefined,
                  endDate: undefined,
                  reason: '',
                  attachment: undefined
                })
                setSelectedLeaveType(null)
                setLeaveDays(0)
                setError(null)
                setSuccess(null)
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}