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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  Mail,
  Building,
  Eye,
  FileText,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { useLeaveSocket } from "@/hooks/use-leave-socket"

interface LeaveRequest {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    employeeId?: string
    department?: {
      name: string
    }
    designation?: {
      name: string
    }
  }
  leaveType: {
    id: string
    name: string
    isPaid: boolean
    daysAllowed?: number
  }
  startDate: string
  endDate: string
  reason: string
  attachment?: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: {
    id: string
    name: string
    email: string
  }
  approvedAt?: string
  remarks?: string
  createdAt: string
  leaveDays: number
}

interface LeaveApprovalData {
  status: 'approved' | 'rejected'
  remarks: string
}

export function LeaveApprovalSystem() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingRequest, setApprovingRequest] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    search: ''
  })
  const [approvalData, setApprovalData] = useState<LeaveApprovalData>({
    status: 'approved',
    remarks: ''
  })

  // WebSocket hook for real-time notifications
  const { isConnected, sendLeaveUpdate } = useLeaveSocket(workspaceId)

  // Get current user from auth context - in real app, this would come from authentication
  const currentUserId = "manager-1" // TODO: Replace with actual auth context
  const currentUserRole = "MANAGER" // TODO: Replace with actual auth context
  const workspaceId = "workspace-1" // TODO: Replace with actual auth context

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('workspaceId', workspaceId)
      if (filters.status && filters.status !== "all") params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      // If current user is a manager, only show leave requests from their direct reports
      if (currentUserRole === 'MANAGER') {
        params.append('managerId', currentUserId)
      }

      const response = await fetch(`/api/leave-requests?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setLeaveRequests(result.data)
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveRequests()
  }, [workspaceId, filters.status, filters.search])

  const handleApproveReject = async (requestId: string) => {
    setApprovingRequest(requestId)
    
    try {
      const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedBy: currentUserId,
          status: approvalData.status,
          remarks: approvalData.remarks
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Send WebSocket notification
        sendLeaveUpdate(selectedRequest.userId, approvalData.status, selectedRequest.id, {
          approverId,
          remarks: approvalData.remarks,
          approvedAt: new Date().toISOString()
        })
        
        setApprovalDialog(false)
        setSelectedRequest(null)
        setApprovalData({ status: 'approved', remarks: '' })
        await fetchLeaveRequests()
      } else {
        alert(result.error || 'Failed to process leave request')
      }
    } catch (error) {
      console.error('Error processing leave request:', error)
      alert('Failed to process leave request')
    } finally {
      setApprovingRequest(null)
    }
  }

  const openApprovalDialog = (request: LeaveRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setApprovalData({
      status,
      remarks: ''
    })
    setApprovalDialog(true)
  }

  const openViewDialog = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setViewDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredRequests = leaveRequests.filter(request => {
    if (filters.department && filters.department !== "all" && request.user.department?.name !== filters.department) {
      return false
    }
    return true
  })

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length
  const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length

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
          <h1 className="text-3xl font-bold">Leave Approval System</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLeaveRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Approved requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(leaveRequests.map(r => r.user.department?.name).filter(Boolean))).map(dept => (
                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            Review and approve employee leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{request.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {request.user.email}
                        </div>
                        {request.user.employeeId && (
                          <div className="text-xs text-muted-foreground">
                            ID: {request.user.employeeId}
                          </div>
                        )}
                        {request.user.department && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building className="h-3 w-3" />
                            {request.user.department.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-medium">{request.leaveType.name}</span>
                        <div className="text-xs">
                          <Badge variant={request.leaveType.isPaid ? 'default' : 'secondary'}>
                            {request.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.startDate), 'MMM dd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {format(new Date(request.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{request.leaveDays}</span>
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(request.createdAt), 'MMM dd')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openApprovalDialog(request, 'approved')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openApprovalDialog(request, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Employee Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedRequest.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedRequest.user.email}</p>
                    {selectedRequest.user.employeeId && (
                      <p><span className="font-medium">Employee ID:</span> {selectedRequest.user.employeeId}</p>
                    )}
                    {selectedRequest.user.department && (
                      <p><span className="font-medium">Department:</span> {selectedRequest.user.department.name}</p>
                    )}
                    {selectedRequest.user.designation && (
                      <p><span className="font-medium">Designation:</span> {selectedRequest.user.designation.name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Leave Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Leave Type:</span> {selectedRequest.leaveType.name}</p>
                    <p><span className="font-medium">Start Date:</span> {format(new Date(selectedRequest.startDate), 'PPP')}</p>
                    <p><span className="font-medium">End Date:</span> {format(new Date(selectedRequest.endDate), 'PPP')}</p>
                    <p><span className="font-medium">Total Days:</span> {selectedRequest.leaveDays}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Applied:</span> {format(new Date(selectedRequest.createdAt), 'PPP')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Reason for Leave</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.attachment && (
                <div>
                  <h4 className="font-medium mb-2">Supporting Document</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>{selectedRequest.attachment}</span>
                  </div>
                </div>
              )}

              {selectedRequest.status !== 'pending' && selectedRequest.approvedBy && (
                <div>
                  <h4 className="font-medium mb-2">Approval Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Approved By:</span> {selectedRequest.approvedBy.name}</p>
                    <p><span className="font-medium">Approved At:</span> {selectedRequest.approvedAt ? format(new Date(selectedRequest.approvedAt), 'PPP') : '-'}</p>
                    {selectedRequest.remarks && (
                      <p><span className="font-medium">Remarks:</span> {selectedRequest.remarks}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalData.status === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="text-sm">
                <p><strong>Employee:</strong> {selectedRequest.user.name}</p>
                <p><strong>Leave Type:</strong> {selectedRequest.leaveType.name}</p>
                <p><strong>Dates:</strong> {format(new Date(selectedRequest.startDate), 'MMM dd')} - {format(new Date(selectedRequest.endDate), 'MMM dd, yyyy')}</p>
                <p><strong>Days:</strong> {selectedRequest.leaveDays}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={approvalData.remarks}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder={approvalData.status === 'approved' ? 'Add any comments for approval...' : 'Provide reason for rejection...'}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApproveReject(selectedRequest.id)}
                  disabled={approvingRequest === selectedRequest.id}
                  className={approvalData.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {approvingRequest === selectedRequest.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    approvalData.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )
                  )}
                  {approvingRequest === selectedRequest.id ? 'Processing...' : approvalData.status === 'approved' ? 'Approve' : 'Reject'}
                </Button>
                <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}