"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { SuperAdminDashboard } from "@/components/dashboards/super-admin-dashboard"
import { WorkspaceAdminDashboard } from "@/components/dashboards/workspace-admin-dashboard"
import { ManagerDashboard } from "@/components/dashboards/manager-dashboard"
import { EmployeeDashboard } from "@/components/dashboards/employee-dashboard"
import { UserProfile } from "@/components/dashboards/user-profile"
import { SuperAdminSettings } from "@/components/dashboards/super-admin-settings"
import { SuperAdminAnalytics } from "@/components/dashboards/super-admin-analytics"
import { TeamManagement } from "@/components/dashboards/team-management"
import { AttendancePunch } from "@/components/attendance/attendance-punch"
import { LeaveDashboard } from "@/components/leave/leave-dashboard"
import { TaskDashboard } from "@/components/tasks/task-dashboard"
import { DocumentDashboard } from "@/components/documents/document-dashboard"
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard"
import { ReportDashboard } from "@/components/reports/report-dashboard"
import { ReportDownloadSection } from "@/components/reports/report-download-section"

interface User {
  id: string
  email: string
  name: string
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"
  workspaceId: string
  workspaceName: string
  department?: {
    id: string
    name: string
  }
  designation?: {
    id: string
    name: string
  }
  employeeId?: string
  profileImage?: string
}

type ViewType = "dashboard" | "profile" | "settings" | "analytics" | "team" | "attendance" | "leave" | "tasks" | "documents" | "payroll" | "reports" | "report-downloads"

export default function Home() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const userData = localStorage.getItem('user')
        const authToken = localStorage.getItem('authToken')
        
        if (!userData || !authToken) {
          // Redirect to login page if not authenticated
          router.push('/login')
          return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Authentication error:', error)
        // Redirect to login page on error
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const renderDashboard = () => {
    if (!user) return null

    switch (user.role) {
      case "SUPER_ADMIN":
        switch (currentView) {
          case "dashboard":
            return <SuperAdminDashboard />
          case "settings":
            return <SuperAdminSettings />
          case "analytics":
            return <SuperAdminAnalytics />
          case "profile":
            return <UserProfile />
          case "team":
            return <TeamManagement />
          case "attendance":
            return <AttendancePunch />
          case "leave":
            return <LeaveDashboard />
          case "tasks":
            return <TaskDashboard />
          case "documents":
            return <DocumentDashboard />
          case "payroll":
            return <PayrollDashboard />
          case "reports":
            return <ReportDashboard />
          case "report-downloads":
            return <ReportDownloadSection userRole={user.role} />
          default:
            return <SuperAdminDashboard />
        }
      case "ADMIN":
        switch (currentView) {
          case "dashboard":
            return <WorkspaceAdminDashboard />
          case "team":
            return <TeamManagement />
          case "profile":
            return <UserProfile />
          case "attendance":
            return <AttendancePunch />
          case "leave":
            return <LeaveDashboard />
          case "tasks":
            return <TaskDashboard />
          case "documents":
            return <DocumentDashboard />
          case "payroll":
            return <PayrollDashboard />
          case "reports":
            return <ReportDashboard />
          case "report-downloads":
            return <ReportDownloadSection userRole={user.role} />
          default:
            return <WorkspaceAdminDashboard />
        }
      case "MANAGER":
        switch (currentView) {
          case "dashboard":
            return <ManagerDashboard />
          case "team":
            return <TeamManagement />
          case "profile":
            return <UserProfile />
          case "attendance":
            return <AttendancePunch />
          case "leave":
            return <LeaveDashboard />
          case "tasks":
            return <TaskDashboard />
          case "documents":
            return <DocumentDashboard />
          case "payroll":
            return <PayrollDashboard />
          case "reports":
            return <ReportDashboard />
          case "report-downloads":
            return <ReportDownloadSection userRole={user.role} />
          default:
            return <ManagerDashboard />
        }
      case "EMPLOYEE":
        switch (currentView) {
          case "dashboard":
            return <EmployeeDashboard />
          case "profile":
            return <UserProfile />
          case "attendance":
            return <AttendancePunch />
          case "leave":
            return <LeaveDashboard />
          case "tasks":
            return <TaskDashboard />
          case "documents":
            return <DocumentDashboard />
          case "payroll":
            return <PayrollDashboard />
          case "reports":
            return <ReportDashboard />
          default:
            return <EmployeeDashboard />
        }
      default:
        return <EmployeeDashboard />
    }
  }

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    // This will redirect to login, but we show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <MainLayout 
      userRole={user.role}
      userName={user.name}
      userAvatar={user.profileImage}
      currentView={currentView}
      onViewChange={handleNavigation}
    >
      {renderDashboard()}
    </MainLayout>
  )
}