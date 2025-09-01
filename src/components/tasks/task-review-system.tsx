"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Star,
  Award,
  User,
  Calendar,
  FileText,
  Download,
  TrendingUp
} from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

interface TaskSubmission {
  id: string
  taskId: string
  userId: string
  report?: string
  fileUrl?: string
  submittedAt: string
  status: "pending_review" | "approved" | "rejected"
  basePoints: number
  qualityPoints: number
  bonusPoints: number
  totalPoints: number
  hoursSinceSubmission: number
  needsEscalation: boolean
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  task: {
    id: string
    title: string
    description?: string
    objectives?: string
    startDate: string
    dueAt?: string
    priority: string
    assignee: {
      id: string
      name: string
      email: string
      employeeId?: string
      role: string
      department?: {
        name: string
      }
    }
    creator: {
      id: string
      name: string
      email: string
      role: string
    }
  }
}

interface ReviewData {
  status: 'approved' | 'rejected'
  qualityPoints: number
  bonusPoints: number
  remarks: string
}

export function TaskReviewSystem() {
  const { user } = useAuth()
  const [pendingReviews, setPendingReviews] = useState<TaskSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingSubmission, setReviewingSubmission] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null)
  const [reviewDialog, setReviewDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [reviewData, setReviewData] = useState<ReviewData>({
    status: 'approved',
    qualityPoints: 5,
    bonusPoints: 0,
    remarks: ''
  })

  // Get current user info
  const currentUserId = user?.id || "user-1"
  const currentUserRole = user?.role || "MANAGER"
  const workspaceId = user?.workspaceId || "workspace-1"

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/tasks/reviews/pending?reviewerId=${currentUserId}&reviewerRole=${currentUserRole}&workspaceId=${workspaceId}`
      )
      const result = await response.json()
      
      if (result.success) {
        setPendingReviews(result.data)
      } else {
        setError(result.error || 'Failed to fetch pending reviews')
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
      setError('Failed to fetch pending reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingReviews()
  }, [currentUserId, currentUserRole, workspaceId])

  const handleReview = async (submissionId: string) => {
    setReviewingSubmission(submissionId)
    
    try {
      const response = await fetch(`/api/tasks/submission/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerId: currentUserId,
          reviewerRole: currentUserRole,
          workspaceId,
          ...reviewData
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Task submission ${reviewData.status} successfully`)
        setReviewDialog(false)
        setSelectedSubmission(null)
        setReviewData({
          status: 'approved',
          qualityPoints: 5,
          bonusPoints: 0,
          remarks: ''
        })
        await fetchPendingReviews()
      } else {
        setError(result.error || 'Failed to review task submission')
      }
    } catch (error) {
      console.error('Error reviewing task submission:', error)
      setError('Failed to review task submission')
    } finally {
      setReviewingSubmission(null)
    }
  }

  const openReviewDialog = (submission: TaskSubmission) => {
    setSelectedSubmission(submission)
    setReviewData({
      status: 'approved',
      qualityPoints: 5,
      bonusPoints: 0,
      remarks: ''
    })
    setReviewDialog(true)
  }

  const openViewDialog = (submission: TaskSubmission) => {
    setSelectedSubmission(submission)
    setViewDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending_review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold">Task Review System</h1>
          <p className="text-muted-foreground">
            Review and approve task submissions from your team members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPendingReviews}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Escalation</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingReviews.filter(r => r.needsEscalation).length}
            </div>
            <p className="text-xs text-muted-foreground">Over 48 hours old</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quality</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingReviews.length > 0 ? 
                Math.round(pendingReviews.reduce((sum, r) => sum + r.qualityPoints, 0) / pendingReviews.length) : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Points per review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonus</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pendingReviews.reduce((sum, r) => sum + r.bonusPoints, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Bonus points awarded</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            Review task submissions and assign quality and bonus points
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
              <p className="text-muted-foreground">
                All task submissions have been reviewed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReviews.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{submission.task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.task.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{submission.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {submission.user.role}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {format(new Date(submission.submittedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {submission.hoursSinceSubmission}h ago
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={getPriorityColor(submission.task.priority)}
                        variant="outline"
                      >
                        {submission.task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status.replace('_', ' ')}
                        </Badge>
                        {submission.needsEscalation && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Needs escalation
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openReviewDialog(submission)}
                        >
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Task Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Task</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <div className="font-medium">{selectedSubmission.task.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedSubmission.task.description}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Report</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <div className="text-sm">{selectedSubmission.report}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualityPoints" className="text-sm font-medium">
                      Quality Points (0-10)
                    </Label>
                    <Input
                      id="qualityPoints"
                      type="number"
                      min="0"
                      max="10"
                      value={reviewData.qualityPoints}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        qualityPoints: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bonusPoints" className="text-sm font-medium">
                      Bonus Points (0-5)
                    </Label>
                    <Input
                      id="bonusPoints"
                      type="number"
                      min="0"
                      max="5"
                      value={reviewData.bonusPoints}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        bonusPoints: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Remarks (Optional)
                  </Label>
                  <Textarea
                    id="remarks"
                    value={reviewData.remarks}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      remarks: e.target.value
                    }))}
                    placeholder="Add any feedback or comments..."
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <div>Base Points (On-time): 5</div>
                    <div>Quality Points: {reviewData.qualityPoints}</div>
                    <div>Bonus Points: {reviewData.bonusPoints}</div>
                  </div>
                  <div className="text-lg font-bold">
                    Total: {5 + reviewData.qualityPoints + reviewData.bonusPoints} pts
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setReviewData(prev => ({ ...prev, status: 'rejected' }))
                    handleReview(selectedSubmission.id)
                  }}
                  disabled={reviewingSubmission === selectedSubmission.id}
                >
                  {reviewingSubmission === selectedSubmission.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setReviewData(prev => ({ ...prev, status: 'approved' }))
                    handleReview(selectedSubmission.id)
                  }}
                  disabled={reviewingSubmission === selectedSubmission.id}
                >
                  {reviewingSubmission === selectedSubmission.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Task Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Task Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {selectedSubmission.task.title}</div>
                    <div><strong>Description:</strong> {selectedSubmission.task.description}</div>
                    <div><strong>Objectives:</strong> {selectedSubmission.task.objectives}</div>
                    <div><strong>Priority:</strong> 
                      <Badge className={`ml-2 ${getPriorityColor(selectedSubmission.task.priority)}`}>
                        {selectedSubmission.task.priority}
                      </Badge>
                    </div>
                    <div><strong>Due Date:</strong> 
                      {selectedSubmission.task.dueAt ? 
                        format(new Date(selectedSubmission.task.dueAt), 'MMM dd, yyyy') : 
                        'No due date'
                      }
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Submission Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Submitted By:</strong> {selectedSubmission.user.name}</div>
                    <div><strong>Role:</strong> {selectedSubmission.user.role}</div>
                    <div><strong>Submitted At:</strong> 
                      {format(new Date(selectedSubmission.submittedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                    <div><strong>Hours Since Submission:</strong> {selectedSubmission.hoursSinceSubmission}</div>
                    {selectedSubmission.needsEscalation && (
                      <div className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Needs escalation (>48h)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Report</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="whitespace-pre-wrap">{selectedSubmission.report}</div>
                </div>
              </div>

              {selectedSubmission.fileUrl && (
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => openReviewDialog(selectedSubmission)}>
                  Review This Submission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
