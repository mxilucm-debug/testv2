"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  User,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Info
} from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns"

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
  }
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  leaveDays: number
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  leaveRequests: LeaveRequest[]
}

export function LeaveCalendarView() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    userId: ''
  })

  // Mock workspace ID - in real app, this would come from authentication
  const workspaceId = "workspace-1"

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('workspaceId', workspaceId)
      params.append('status', 'approved') // Only show approved leaves on calendar
      
      if (filters.department) {
        // In a real app, you would filter by department
        // For now, we'll fetch all and filter client-side
      }
      if (filters.userId && filters.userId !== "all") {
        params.append('userId', filters.userId)
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
  }, [workspaceId, filters.userId])

  const getCalendarDays = (date: Date): CalendarDay[] => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map(day => ({
      date: day,
      isCurrentMonth: isSameMonth(day, date),
      leaveRequests: leaveRequests.filter(request => {
        const start = parseISO(request.startDate)
        const end = parseISO(request.endDate)
        return day >= start && day <= end
      })
    }))
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
        return <CheckCircle className="h-3 w-3" />
      case 'rejected':
        return <XCircle className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getLeaveTypeColor = (leaveTypeName: string) => {
    const colors: Record<string, string> = {
      'Annual Leave': 'bg-blue-500',
      'Sick Leave': 'bg-red-500',
      'Personal Leave': 'bg-purple-500',
      'Maternity Leave': 'bg-pink-500',
      'Paternity Leave': 'bg-indigo-500',
      'Emergency Leave': 'bg-orange-500',
      'Unpaid Leave': 'bg-gray-500'
    }
    return colors[leaveTypeName] || 'bg-gray-500'
  }

  const calendarDays = getCalendarDays(currentDate)
  const selectedDateRequests = selectedDate 
    ? leaveRequests.filter(request => {
        const start = parseISO(request.startDate)
        const end = parseISO(request.endDate)
        return selectedDate >= start && selectedDate <= end
      })
    : []

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const filteredRequests = leaveRequests.filter(request => {
    if (filters.department && filters.department !== "all" && request.user.department?.name !== filters.department) {
      return false
    }
    if (filters.status && filters.status !== "all" && request.status !== filters.status) {
      return false
    }
    return true
  })

  // Get unique departments for filter
  const departments = Array.from(new Set(leaveRequests.map(r => r.user.department?.name).filter(Boolean)))

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
          <h1 className="text-3xl font-bold">Leave Calendar</h1>
          <p className="text-muted-foreground">Visualize employee leave schedules</p>
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

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const hasLeave = day.leaveRequests.length > 0
              const isToday = isSameDay(day.date, new Date())
              const isSelected = selectedDate && isSameDay(day.date, selectedDate)

              return (
                <div
                  key={index}
                  className={`
                    min-h-24 p-1 border rounded-lg cursor-pointer transition-colors
                    ${day.isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    ${hasLeave ? 'hover:bg-muted' : ''}
                  `}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day.date, 'd')}
                  </div>
                  
                  {hasLeave && (
                    <div className="space-y-1">
                      {day.leaveRequests.slice(0, 3).map((request, reqIndex) => (
                        <div
                          key={reqIndex}
                          className={`
                            text-xs p-1 rounded text-white truncate
                            ${getLeaveTypeColor(request.leaveType.name)}
                          `}
                          title={`${request.user.name} - ${request.leaveType.name}`}
                        >
                          {request.user.name.split(' ')[0]}
                        </div>
                      ))}
                      {day.leaveRequests.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{day.leaveRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Leave Schedule for {format(selectedDate, 'PPP')}
            </CardTitle>
            <CardDescription>
              {selectedDateRequests.length} leave request{selectedDateRequests.length !== 1 ? 's' : ''} on this date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateRequests.length > 0 ? (
              <div className="space-y-3">
                {selectedDateRequests.map((request) => (
                  <div key={request.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className={`
                      w-4 h-4 rounded-full mt-1
                      ${getLeaveTypeColor(request.leaveType.name)}
                    `}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{request.user.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {request.user.employeeId && (
                              <span>ID: {request.user.employeeId}</span>
                            )}
                            {request.user.department && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {request.user.department.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status}
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Leave Type:</span> {request.leaveType.name}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {request.leaveDays} days
                        </div>
                        <div>
                          <span className="font-medium">Start:</span> {format(parseISO(request.startDate), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          <span className="font-medium">End:</span> {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      
                      {request.reason && (
                        <div className="mt-2">
                          <span className="font-medium text-sm">Reason:</span>
                          <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                <p>No leave requests scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave Type Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(new Set(leaveRequests.map(r => r.leaveType))).map(leaveType => (
              <div key={leaveType.id} className="flex items-center gap-2">
                <div className={`
                  w-4 h-4 rounded
                  ${getLeaveTypeColor(leaveType.name)}
                `}></div>
                <span className="text-sm">{leaveType.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Calendar Information:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Only approved leave requests are shown on the calendar</li>
            <li>Click on any date to view detailed leave information</li>
            <li>Use the filters to view specific departments or status types</li>
            <li>Colors represent different leave types for easy identification</li>
          </ul>
        </div>
      </div>
    </div>
  )
}