"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell
} from "lucide-react"
import { LeaveRequestForm } from "./leave-request-form"
import { LeaveApprovalSystem } from "./leave-approval-system"
import { LeaveBalanceTracking } from "./leave-balance-tracking"
import { LeaveCalendarView } from "./leave-calendar-view"
import { LeaveReportsAnalytics } from "./leave-reports-analytics"
import { useLeaveSocket } from "@/hooks/use-leave-socket"

interface LeaveStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  myPendingRequests: number
  myApprovedRequests: number
  totalLeaveDays: number
  averageApprovalTime: number
}

export function LeaveDashboard() {
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    myPendingRequests: 0,
    myApprovedRequests: 0,
    totalLeaveDays: 0,
    averageApprovalTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Mock user and workspace IDs - in real app, this would come from authentication
  const userId = "cmepn2wo4000vptfyqbh6cqsj" // employee@techcorp.com
  const workspaceId = "cmepn2vxh0007ptfyxsfwyr2w" // TechCorp
  const userRole = "EMPLOYEE" // Could be EMPLOYEE, MANAGER, ADMIN

  // WebSocket hook for real-time notifications
  const { isConnected, leaveUpdates, leaveStatusChanges, clearUpdates, clearStatusChanges } = useLeaveSocket(workspaceId, userId)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch all requests for workspace stats
      const allRequestsResponse = await fetch(`/api/leave-requests?workspaceId=${workspaceId}`)
      const allRequestsResult = await allRequestsResponse.json()
      
      // Fetch user's requests
      const userRequestsResponse = await fetch(`/api/leave-requests?userId=${userId}`)
      const userRequestsResult = await userRequestsResponse.json()
      
      // Fetch leave balance
      const balanceResponse = await fetch(`/api/leave-balance?userId=${userId}&year=${new Date().getFullYear()}`)
      const balanceResult = await balanceResponse.json()

      if (allRequestsResult.success && userRequestsResult.success && balanceResult.success) {
        const allRequests = allRequestsResult.data
        const userRequests = userRequestsResult.data
        const balances = balanceResult.data

        const totalRequests = allRequests.length
        const pendingRequests = allRequests.filter(r => r.status === 'pending').length
        const approvedRequests = allRequests.filter(r => r.status === 'approved').length
        const rejectedRequests = allRequests.filter(r => r.status === 'rejected').length
        
        const myPendingRequests = userRequests.filter(r => r.status === 'pending').length
        const myApprovedRequests = userRequests.filter(r => r.status === 'approved').length
        
        const totalLeaveDays = allRequests
          .filter(r => r.status === 'approved')
          .reduce((sum, r) => sum + r.leaveDays, 0)

        setStats({
          totalRequests,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          myPendingRequests,
          myApprovedRequests,
          totalLeaveDays,
          averageApprovalTime: 2.5 // Mock value
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [workspaceId, userId])

  const getTabAccess = (tabName: string) => {
    switch (userRole) {
      case 'EMPLOYEE':
        return ['overview', 'my-requests', 'calendar', 'balance'].includes(tabName)
      case 'MANAGER':
        return ['overview', 'my-requests', 'approval', 'calendar', 'balance', 'reports'].includes(tabName)
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return true // Admins have access to all tabs
      default:
        return false
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
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Manage leave requests, approvals, and tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Notifications */}
      {(leaveUpdates.length > 0 || leaveStatusChanges.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaveUpdates.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Recent Leave Updates</h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {leaveUpdates.map((update, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                          <div className={`w-2 h-2 rounded-full ${
                            update.action === 'submitted' ? 'bg-blue-500' :
                            update.action === 'approved' ? 'bg-green-500' :
                            'bg-red-500'
                          }`} />
                          <span className="flex-1">{update.message}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {leaveStatusChanges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Your Leave Status Changes</h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {leaveStatusChanges.map((change, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                          <div className={`w-2 h-2 rounded-full ${
                            change.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="flex-1">{change.message}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(change.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-2 gap-2">
              {leaveUpdates.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearUpdates}>
                  Clear Updates
                </Button>
              )}
              {leaveStatusChanges.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearStatusChanges}>
                  Clear Status
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingRequests} pending, {stats.approvedRequests} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myPendingRequests + stats.myApprovedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.myPendingRequests} pending, {stats.myApprovedRequests} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeaveDays}</div>
            <p className="text-xs text-muted-foreground">
              Approved this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Approval Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageApprovalTime}h</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {getTabAccess('overview') && (
            <TabsTrigger value="overview">Overview</TabsTrigger>
          )}
          {getTabAccess('my-requests') && (
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          )}
          {getTabAccess('approval') && (
            <TabsTrigger value="approval">Approvals</TabsTrigger>
          )}
          {getTabAccess('calendar') && (
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          )}
          {getTabAccess('balance') && (
            <TabsTrigger value="balance">Balance</TabsTrigger>
          )}
          {getTabAccess('reports') && (
            <TabsTrigger value="reports">Reports</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeaveRequestForm userId={userId} workspaceId={workspaceId} onSuccess={fetchStats} />
            <LeaveBalanceTracking />
          </div>
          <LeaveCalendarView />
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-6">
          <LeaveRequestForm userId={userId} workspaceId={workspaceId} onSuccess={fetchStats} />
          {/* Here you would add a component to show user's leave requests */}
        </TabsContent>

        <TabsContent value="approval" className="space-y-6">
          <LeaveApprovalSystem />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <LeaveCalendarView />
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <LeaveBalanceTracking />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <LeaveReportsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}